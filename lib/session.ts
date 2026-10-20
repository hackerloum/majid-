import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Lang } from "@/lib/types";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies();
  return cookieStore.get("lang")?.value === "en" ? "en" : "sw";
}

export async function requireGroup() {
  if (!supabaseConfigured()) return { configured: false as const };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: group } = await supabase.from("groups").select("id, name").maybeSingle();
  return { configured: true as const, supabase, group };
}
