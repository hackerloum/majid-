import Link from "next/link";
import { redirect } from "next/navigation";
import { IconCoin, IconLoan, IconShare, IconUsers } from "@/components/icons";
import { LanguageToggle } from "@/components/language-toggle";
import { t } from "@/lib/i18n";
import { getLang, getOptionalUser } from "@/lib/session";

export default async function LandingPage() {
  const user = await getOptionalUser();
  if (user) redirect("/home");

  const lang = await getLang();
  const features = [
    { icon: IconUsers, title: t(lang, "landingF1"), body: t(lang, "landingF1b") },
    { icon: IconCoin, title: t(lang, "landingF2"), body: t(lang, "landingF2b") },
    { icon: IconLoan, title: t(lang, "landingF3"), body: t(lang, "landingF3b") },
    { icon: IconShare, title: t(lang, "landingF4"), body: t(lang, "landingF4b") },
  ];

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 py-8">
      <div className="mb-10 flex items-center justify-between">
        <p className="text-sm font-bold tracking-wide text-green">{t(lang, "appName")}</p>
        <LanguageToggle lang={lang} />
      </div>

      <p className="text-sm font-semibold text-green">{t(lang, "landingMadeFor")}</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight">{t(lang, "landingTitle")}</h1>
      <p className="mt-3 text-base leading-7 text-muted">{t(lang, "landingLead")}</p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/signup"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-green px-4 text-lg font-bold text-white"
        >
          {t(lang, "landingSignup")}
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-card px-4 text-lg font-bold"
        >
          {t(lang, "landingLogin")}
        </Link>
      </div>

      <ul className="mt-10 grid gap-3">
        {features.map((feature) => (
          <li key={feature.title} className="flex gap-3 rounded-3xl border border-line bg-card p-4">
            <feature.icon className="mt-0.5 h-8 w-8 shrink-0 text-green" />
            <div>
              <p className="font-bold">{feature.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{feature.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
