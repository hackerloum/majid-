import Link from "next/link";
import type { ReactNode } from "react";
import { IconBack } from "@/components/icons";
import { errorText, t } from "@/lib/i18n";
import { formatTzs } from "@/lib/money";
import type { Lang } from "@/lib/types";

export function PageIntro({ lang, title, children }: { lang: Lang; title: string; children?: ReactNode }) {
  return (
    <div className="mb-5">
      <Link href="/home" className="no-print mb-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-green">
        <IconBack className="h-5 w-5" />
        {t(lang, "back")}
      </Link>
      <h2 className="text-2xl font-bold">{title}</h2>
      {children ? <div className="mt-2 text-sm leading-6 text-muted">{children}</div> : null}
    </div>
  );
}

export function FormError({ lang, code }: { lang: Lang; code?: string }) {
  if (!code) return null;
  return (
    <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm text-clay" role="alert">
      {errorText(lang, code)}
    </p>
  );
}

const fieldClass =
  "min-h-12 w-full rounded-2xl border border-line bg-white px-3 text-base outline-none focus:border-green";

export function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  hint,
  inputMode,
  step,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      <span>
        {label}
        {hint ? <span className="ml-2 font-normal text-muted">{hint}</span> : null}
      </span>
      <input
        className={fieldClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        inputMode={inputMode}
        step={step}
        min={min}
        max={max}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      <span>{label}</span>
      <textarea
        className={`${fieldClass} min-h-28 py-3`}
        name={name}
        required={required}
        defaultValue={defaultValue}
        rows={4}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  required,
  children,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: ReactNode;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      <span>{label}</span>
      <select className={fieldClass} name={name} required={required} defaultValue={defaultValue ?? ""}>
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-card p-4 ${className}`}>{children}</section>;
}

export function Money({ value, lang }: { value: number | string; lang: Lang }) {
  return <span className="tabular-nums">{formatTzs(value, lang)}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-3xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function SetupNotice({ lang }: { lang: Lang }) {
  return (
    <Card>
      <h2 className="text-xl font-bold">{t(lang, "setupTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{t(lang, "setupBody")}</p>
    </Card>
  );
}
