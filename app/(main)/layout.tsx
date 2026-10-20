import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { SetupNotice } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang, requireGroup } from "@/lib/session";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const session = await requireGroup();

  if (!session.configured || !session.group) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-8">
        <div className="mb-6 flex justify-end">
          <LanguageToggle lang={lang} />
        </div>
        <SetupNotice lang={lang} />
        {session.configured && !session.group ? (
          <p className="mt-3 text-sm text-muted">{t(lang, "err_no_group")}</p>
        ) : null}
      </main>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 py-5">
      <header className="no-print mb-5 flex items-start justify-between gap-3">
        <Link href="/home" className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-green">{t(lang, "appName")}</p>
          <h1 className="truncate text-xl font-bold">{session.group.name}</h1>
        </Link>
        <LanguageToggle lang={lang} />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
