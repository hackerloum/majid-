import Link from "next/link";
import { SignupForm } from "@/components/auth-forms";
import { LanguageToggle } from "@/components/language-toggle";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase/server";

export default async function SignupPage() {
  const lang = await getLang();
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold text-green">
          {t(lang, "appName")}
        </Link>
        <LanguageToggle lang={lang} />
      </div>
      <h1 className="text-3xl font-bold">{t(lang, "signup")}</h1>
      <p className="mt-2 mb-6 text-muted">{t(lang, "signupLead")}</p>
      {supabaseConfigured() ? null : <p className="mb-4 text-sm text-clay">{t(lang, "setupBody")}</p>}
      <SignupForm lang={lang} />
      <p className="mt-6 text-sm">
        {t(lang, "haveAccount")}{" "}
        <Link href="/login" className="font-bold text-green">
          {t(lang, "login")}
        </Link>
      </p>
    </main>
  );
}
