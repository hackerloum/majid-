"use client";

import { useActionState } from "react";
import { login, signup } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";
import { Field, FormError } from "@/components/ui";

export function LoginForm({ lang }: { lang: Lang }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-3">
      <Field label={t(lang, "email")} name="email" type="email" required />
      <Field label={t(lang, "password")} name="password" type="password" required />
      <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
      <SubmitButton label={t(lang, "login")} pendingLabel={t(lang, "pleaseWait")} />
    </form>
  );
}

export function SignupForm({ lang }: { lang: Lang }) {
  const [state, action] = useActionState(signup, null);
  return (
    <form action={action} className="grid gap-3">
      <Field label={t(lang, "groupName")} name="group_name" required />
      <Field label={t(lang, "email")} name="email" type="email" required />
      <Field label={t(lang, "password")} name="password" type="password" required min="6" />
      <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
      <SubmitButton label={t(lang, "signup")} pendingLabel={t(lang, "pleaseWait")} />
    </form>
  );
}
