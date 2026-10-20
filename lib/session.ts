import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Lang } from "@/lib/types";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  return cookieStore.get("lang")?.value === "en" ? "en" : "sw";
}

export function isMemberUser(user: { user_metadata?: Record<string, unknown> } | null): boolean {
  return user?.user_metadata?.role === "member";
}

export async function getOptionalUser() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function afterAuthPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<"/home" | "/member"> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (isMemberUser(user)) return "/member";
  const { data: owned } = await supabase.from("groups").select("id").eq("owner_id", user?.id ?? "").maybeSingle();
  return owned ? "/home" : "/member";
}

export async function requireGroup() {
  if (!supabaseConfigured()) return { configured: false as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isMemberUser(user)) redirect("/member");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!group) redirect("/member");
  return { configured: true as const, supabase, group, email: user.email ?? "" };
}

export async function requireMember() {
  if (!supabaseConfigured()) return { configured: false as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: owned } = await supabase.from("groups").select("id").eq("owner_id", user.id).maybeSingle();
  if (owned) redirect("/home");

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, phone, is_active, group_id, groups(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = member as
    | {
        id: string;
        full_name: string;
        phone: string | null;
        is_active: boolean;
        group_id: string;
        groups: { name: string } | { name: string }[] | null;
      }
    | null;

  return { configured: true as const, supabase, member: row, email: user.email ?? "" };
}
