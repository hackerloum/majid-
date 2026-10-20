import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { SetupNotice } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang, requireMember } from "@/lib/session";

function groupName(value: { name: string } | { name: string }[] | null | undefined): string {
  if (Array.isArray(value)) return value[0]?.name ?? "";
  return value?.name ?? "";
}

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const session = await requireMember();

  if (!session.configured) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <SetupNotice lang={lang} />
      </main>
    );
  }

  if (!session.member) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <p className="text-sm text-clay">{t(lang, "err_bad_invite")}</p>
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 py-5">
      <header className="no-print mb-5 flex items-start justify-between gap-3">
        <Link href="/member" className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-green">{t(lang, "appName")}</p>
          <h1 className="truncate text-xl font-bold">{groupName(session.member.groups)}</h1>
          <p className="text-sm text-muted">{session.member.full_name}</p>
        </Link>
        <LanguageToggle lang={lang} />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
