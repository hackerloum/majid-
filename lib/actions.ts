"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { publicOrigin } from "@/lib/origin";
import type { ActionResult, Lang } from "@/lib/types";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

const codes = [
  "bad_amount",
  "bad_percent",
  "bad_name",
  "bad_date",
  "member_not_found",
  "member_inactive",
  "loan_not_found",
  "loan_closed",
  "overpay",
  "nothing_to_share",
  "reason_required",
  "bad_law",
  "law_not_found",
  "no_group",
  "not_authenticated",
  "missing_supabase_env",
];

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function codeFrom(message: string): string {
  return codes.find((code) => message.includes(code)) ?? "failed";
}

async function client(): Promise<
  { ok: false; error: string } | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
> {
  if (!supabaseConfigured()) return { ok: false, error: "missing_supabase_env" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };
  return { ok: true, supabase };
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function whole(formData: FormData, key: string): number | null {
  const raw = text(formData, key).replace(/[,\s]/g, "");
  if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1_000_000_000) return null;
  return amount;
}

function rate(formData: FormData): number | null {
  const raw = text(formData, "interest_percent").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const percent = Number(raw);
  if (percent < 0 || percent > 100) return null;
  return percent;
}

function day(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function refresh(paths: string[]) {
  for (const path of new Set([...paths, "/", "/home", "/activity", "/reports", "/admin"])) {
    revalidatePath(path);
  }
}

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!supabaseConfigured()) return fail("missing_supabase_env");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (error) return fail("auth");
  redirect("/home");
}

export async function signup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (!supabaseConfigured()) return fail("missing_supabase_env");
  const groupName = text(formData, "group_name");
  const password = text(formData, "password");
  if (!groupName) return fail("bad_name");
  if (password.length < 6) return fail("short_password");

  const supabase = await createClient();
  const origin = await publicOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: text(formData, "email"),
    password,
    options: {
      data: { group_name: groupName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return fail("auth");
  if (!data.session) return fail("confirm_email");
  redirect("/home");
}

export async function setLanguage(lang: Lang) {
  const cookieStore = await cookies();
  cookieStore.set("lang", lang === "en" ? "en" : "sw", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function logout() {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function renameGroup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("rename_group", { p_name: text(formData, "name") });
  if (error) return fail(codeFrom(error.message));
  refresh(["/settings", "/admin"]);
  return { ok: true };
}

export async function addMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("add_member", {
    p_name: text(formData, "full_name"),
    p_phone: text(formData, "phone"),
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/members", "/", "/contributions", "/loans", "/fines", "/reports"]);
  return { ok: true };
}

export async function updateMember(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("update_member", {
    p_member_id: text(formData, "id"),
    p_name: text(formData, "full_name"),
    p_phone: text(formData, "phone"),
    p_is_active: text(formData, "is_active") === "true",
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/members", "/", "/loans", "/reports"]);
  return { ok: true };
}

export async function recordContribution(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const amount = whole(formData, "amount");
  const paidOn = day(formData, "paid_on");
  if (amount == null) return fail("bad_amount");
  if (!paidOn) return fail("bad_date");
  const { error } = await ready.supabase.rpc("record_contribution", {
    p_member_id: text(formData, "member_id"),
    p_amount: amount,
    p_paid_on: paidOn,
    p_note: text(formData, "note"),
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/contributions", "/", "/shareout", "/reports"]);
  return { ok: true };
}

export async function giveLoan(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const principal = whole(formData, "principal");
  const percent = rate(formData);
  const issuedOn = day(formData, "issued_on");
  if (principal == null) return fail("bad_amount");
  if (percent == null) return fail("bad_percent");
  if (!issuedOn) return fail("bad_date");
  const { error } = await ready.supabase.rpc("give_loan", {
    p_member_id: text(formData, "member_id"),
    p_principal: principal,
    p_interest_percent: percent,
    p_issued_on: issuedOn,
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/loans", "/", "/shareout", "/reports"]);
  return { ok: true };
}

export async function recordRepayment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const amount = whole(formData, "amount");
  const paidOn = day(formData, "paid_on");
  const loanId = text(formData, "loan_id");
  if (amount == null) return fail("bad_amount");
  if (!paidOn) return fail("bad_date");
  const { error } = await ready.supabase.rpc("record_repayment", {
    p_loan_id: loanId,
    p_amount: amount,
    p_paid_on: paidOn,
    p_note: text(formData, "note"),
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/loans", `/loans/${loanId}`, "/", "/shareout", "/reports"]);
  return { ok: true };
}

export async function addFine(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const amount = whole(formData, "amount");
  const finedOn = day(formData, "fined_on");
  if (amount == null) return fail("bad_amount");
  if (!finedOn) return fail("bad_date");
  const { error } = await ready.supabase.rpc("add_fine", {
    p_member_id: text(formData, "member_id"),
    p_amount: amount,
    p_reason: text(formData, "reason"),
    p_fined_on: finedOn,
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/fines", "/", "/shareout", "/reports"]);
  return { ok: true };
}

export async function confirmShareout(
  prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  void prev;
  void formData;
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("confirm_shareout");
  if (error) return fail(codeFrom(error.message));
  refresh(["/shareout", "/", "/reports", "/activity"]);
  return { ok: true };
}

export async function addLaw(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("add_law", { p_body: text(formData, "body") });
  if (error) return fail(codeFrom(error.message));
  refresh(["/admin"]);
  return { ok: true };
}

export async function updateLaw(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("update_law", {
    p_law_id: text(formData, "id"),
    p_body: text(formData, "body"),
  });
  if (error) return fail(codeFrom(error.message));
  refresh(["/admin"]);
  return { ok: true };
}

export async function deleteLaw(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ready = await client();
  if (!ready.ok) return fail(ready.error);
  const { error } = await ready.supabase.rpc("delete_law", { p_law_id: text(formData, "id") });
  if (error) return fail(codeFrom(error.message));
  refresh(["/admin"]);
  return { ok: true };
}
