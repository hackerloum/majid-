import { asTzs } from "@/lib/money";
import type {
  ActivityRow,
  ContributionRow,
  FineRow,
  GroupLaw,
  LoanRow,
  Member,
  SharePreview,
  Snapshot,
  TransactionRow,
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type NameRelation = { full_name: string } | { full_name: string }[] | null;

function memberName(value: NameRelation): string {
  if (Array.isArray(value)) return value[0]?.full_name ?? "";
  return value?.full_name ?? "";
}

function numberField(value: unknown): number {
  return asTzs(typeof value === "number" || typeof value === "string" ? value : 0);
}

const emptySnapshot = (): Snapshot => ({
  members_active: 0,
  members_all: 0,
  contributions_total: 0,
  fines_total: 0,
  loans_principal: 0,
  loans_interest: 0,
  repayments_total: 0,
  outstanding: 0,
  interest_collected: 0,
  unpaid: [],
});

export async function getSnapshot(supabase: SupabaseClient, monthStart: string): Promise<Snapshot> {
  const { data, error } = await supabase.rpc("group_snapshot", { p_month: monthStart });
  if (error || !data) return emptySnapshot();
  const row = data as Snapshot;
  return {
    ...emptySnapshot(),
    ...row,
    members_active: numberField(row.members_active),
    members_all: numberField(row.members_all),
    contributions_total: numberField(row.contributions_total),
    fines_total: numberField(row.fines_total),
    loans_principal: numberField(row.loans_principal),
    loans_interest: numberField(row.loans_interest),
    repayments_total: numberField(row.repayments_total),
    outstanding: numberField(row.outstanding),
    interest_collected: numberField(row.interest_collected),
    unpaid: Array.isArray(row.unpaid) ? row.unpaid : [],
  };
}

export async function getLaws(supabase: SupabaseClient): Promise<GroupLaw[]> {
  const { data } = await supabase
    .from("group_laws")
    .select("id, body, created_at")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getMembers(supabase: SupabaseClient): Promise<Member[]> {
  const { data } = await supabase
    .from("members")
    .select("id, full_name, phone, is_active")
    .order("is_active", { ascending: false })
    .order("full_name");
  return data ?? [];
}

export async function getContributions(
  supabase: SupabaseClient,
  start: string,
  end: string,
): Promise<ContributionRow[]> {
  const { data } = await supabase
    .from("contributions")
    .select("id, amount, paid_on, note, members(full_name)")
    .gte("paid_on", start)
    .lt("paid_on", end)
    .order("paid_on", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: row.amount,
    paid_on: row.paid_on,
    note: row.note,
    member_name: memberName(row.members as NameRelation),
  }));
}

export async function getLoans(supabase: SupabaseClient): Promise<LoanRow[]> {
  const { data } = await supabase
    .from("loans")
    .select(
      "id, member_id, principal, interest_percent, interest_amount, total_due, issued_on, status, members(full_name), repayments(id, amount, paid_on, note)",
    )
    .order("issued_on", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    member_id: row.member_id,
    member_name: memberName(row.members as NameRelation),
    principal: row.principal,
    interest_percent: row.interest_percent,
    interest_amount: row.interest_amount,
    total_due: row.total_due,
    issued_on: row.issued_on,
    status: row.status,
    repayments: [...(row.repayments ?? [])].sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
  }));
}

export async function getLoan(supabase: SupabaseClient, id: string): Promise<LoanRow | null> {
  const { data } = await supabase
    .from("loans")
    .select(
      "id, member_id, principal, interest_percent, interest_amount, total_due, issued_on, status, members(full_name), repayments(id, amount, paid_on, note)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    member_id: data.member_id,
    member_name: memberName(data.members as NameRelation),
    principal: data.principal,
    interest_percent: data.interest_percent,
    interest_amount: data.interest_amount,
    total_due: data.total_due,
    issued_on: data.issued_on,
    status: data.status,
    repayments: [...(data.repayments ?? [])].sort((a, b) => b.paid_on.localeCompare(a.paid_on)),
  };
}

export async function getFines(supabase: SupabaseClient): Promise<FineRow[]> {
  const { data } = await supabase
    .from("fines")
    .select("id, amount, reason, fined_on, members(full_name)")
    .order("fined_on", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    fined_on: row.fined_on,
    member_name: memberName(row.members as NameRelation),
  }));
}

export async function getSharePreview(supabase: SupabaseClient): Promise<SharePreview | null> {
  const { data, error } = await supabase.rpc("shareout_preview");
  if (error || !data) return null;
  const row = data as SharePreview;
  return {
    interest_collected: numberField(row.interest_collected),
    fines_total: numberField(row.fines_total),
    profit: numberField(row.profit),
    contributions_total: numberField(row.contributions_total),
    outstanding_loans: numberField(row.outstanding_loans),
    lines: (row.lines ?? []).map((line) => ({
      member_id: line.member_id,
      full_name: line.full_name,
      contribution: numberField(line.contribution),
      profit_share: numberField(line.profit_share),
      payout: numberField(line.payout),
    })),
  };
}

export async function getActivity(supabase: SupabaseClient): Promise<ActivityRow[]> {
  const { data } = await supabase
    .from("activity_logs")
    .select("id, action, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getStatement(supabase: SupabaseClient, memberId: string) {
  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, phone, is_active")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) return null;

  const { data } = await supabase
    .from("transactions")
    .select("id, kind, amount, occurred_on, note")
    .eq("member_id", memberId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as TransactionRow[];
  return { member: member as Member, rows };
}
