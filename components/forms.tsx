"use client";

import { useActionState, useState } from "react";
import { addFine, addLaw, addMember, confirmShareout, deleteLaw, giveLoan, logout, recordContribution, recordRepayment, renameGroup, updateLaw, updateMember } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { formatTzs, interestDue } from "@/lib/money";
import type { GroupLaw, Lang, Member } from "@/lib/types";
import { SubmitButton } from "@/components/submit-button";
import { Card, Field, FormError, SelectField, TextArea } from "@/components/ui";

function memberChoices(members: Member[], activeOnly: boolean) {
  return members
    .filter((member) => (activeOnly ? member.is_active : true))
    .map((member) => (
      <option key={member.id} value={member.id}>
        {member.full_name}
        {member.is_active ? "" : " ·"}
      </option>
    ));
}

export function AddMemberForm({ lang }: { lang: Lang }) {
  const [state, action] = useActionState(addMember, null);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "addMember")}</h3>
      <form action={action} className="grid gap-3">
        <Field label={t(lang, "name")} name="full_name" required />
        <Field label={t(lang, "phone")} name="phone" type="tel" hint={t(lang, "optional")} />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "add")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function MemberEditor({ lang, member }: { lang: Lang; member: Member }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateMember, null);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold">{member.full_name}</p>
          <p className="text-sm text-muted">{member.phone || "—"}</p>
          <p className={`mt-1 text-sm font-semibold ${member.is_active ? "text-green" : "text-clay"}`}>
            {member.is_active ? t(lang, "active") : t(lang, "inactive")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-11 rounded-2xl border border-line px-3 text-sm font-semibold"
        >
          {open ? t(lang, "close") : t(lang, "edit")}
        </button>
      </div>
      {open ? (
        <form action={action} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={member.id} />
          <Field label={t(lang, "name")} name="full_name" required defaultValue={member.full_name} />
          <Field label={t(lang, "phone")} name="phone" type="tel" defaultValue={member.phone ?? ""} hint={t(lang, "optional")} />
          <input type="hidden" name="is_active" value={String(member.is_active)} />
          <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
          <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
        </form>
      ) : null}
      <form action={action} className="mt-3">
        <input type="hidden" name="id" value={member.id} />
        <input type="hidden" name="full_name" value={member.full_name} />
        <input type="hidden" name="phone" value={member.phone ?? ""} />
        <input type="hidden" name="is_active" value={String(!member.is_active)} />
        <button type="submit" className="min-h-11 text-sm font-semibold text-clay">
          {member.is_active ? t(lang, "deactivate") : t(lang, "activate")}
        </button>
      </form>
    </Card>
  );
}

export function ContributionForm({ lang, members, today }: { lang: Lang; members: Member[]; today: string }) {
  const [state, action] = useActionState(recordContribution, null);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "recordContribution")}</h3>
      <form action={action} className="grid gap-3">
        <SelectField label={t(lang, "member")} name="member_id" required>
          <option value="" />
          {memberChoices(members, false)}
        </SelectField>
        <Field label={t(lang, "amount")} name="amount" inputMode="numeric" required />
        <Field label={t(lang, "date")} name="paid_on" type="date" required defaultValue={today} />
        <Field label={t(lang, "note")} name="note" hint={t(lang, "optional")} />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function LoanForm({ lang, members, today }: { lang: Lang; members: Member[]; today: string }) {
  const [state, action] = useActionState(giveLoan, null);
  const [principal, setPrincipal] = useState("");
  const [percent, setPercent] = useState("10");
  const principalNumber = Number(principal.replace(/[,\s]/g, "")) || 0;
  const percentNumber = Number(percent.replace(",", ".")) || 0;
  const interest = interestDue(principalNumber, percentNumber);
  const total = principalNumber > 0 ? principalNumber + interest : 0;

  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "giveLoan")}</h3>
      <form action={action} className="grid gap-3">
        <SelectField label={t(lang, "member")} name="member_id" required>
          <option value="" />
          {memberChoices(members, true)}
        </SelectField>
        <label className="grid gap-1 text-sm font-semibold">
          <span>{t(lang, "amount")}</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-line bg-white px-3 text-base outline-none focus:border-green"
            name="principal"
            inputMode="numeric"
            required
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          <span>{t(lang, "interest")}</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-line bg-white px-3 text-base outline-none focus:border-green"
            name="interest_percent"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.01"
            required
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
          />
        </label>
        <Field label={t(lang, "date")} name="issued_on" type="date" required defaultValue={today} />
        <p className="rounded-2xl bg-paper px-3 py-3 text-sm">
          {t(lang, "interestAmount")}: <strong>{formatTzs(interest, lang)}</strong>
          <br />
          {t(lang, "totalDue")}: <strong>{formatTzs(total, lang)}</strong>
        </p>
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function RepaymentForm({
  lang,
  loanId,
  balance,
  today,
}: {
  lang: Lang;
  loanId: string;
  balance: number;
  today: string;
}) {
  const [state, action] = useActionState(recordRepayment, null);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "recordRepayment")}</h3>
      <form action={action} className="grid gap-3">
        <input type="hidden" name="loan_id" value={loanId} />
        <Field label={t(lang, "amount")} name="amount" inputMode="numeric" required max={String(balance)} />
        <Field label={t(lang, "date")} name="paid_on" type="date" required defaultValue={today} />
        <Field label={t(lang, "note")} name="note" hint={t(lang, "optional")} />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function FineForm({ lang, members, today }: { lang: Lang; members: Member[]; today: string }) {
  const [state, action] = useActionState(addFine, null);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "addFine")}</h3>
      <form action={action} className="grid gap-3">
        <SelectField label={t(lang, "member")} name="member_id" required>
          <option value="" />
          {memberChoices(members, false)}
        </SelectField>
        <Field label={t(lang, "amount")} name="amount" inputMode="numeric" required />
        <Field label={t(lang, "reason")} name="reason" required />
        <Field label={t(lang, "date")} name="fined_on" type="date" required defaultValue={today} />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function RenameForm({ lang, name }: { lang: Lang; name: string }) {
  const [state, action] = useActionState(renameGroup, null);
  return (
    <Card>
      <form action={action} className="grid gap-3">
        <Field label={t(lang, "groupName")} name="name" required defaultValue={name} />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        {state?.ok ? <p className="text-sm font-semibold text-green">{t(lang, "save")}</p> : null}
        <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function ShareoutForm({ lang }: { lang: Lang }) {
  const [state, action] = useActionState(confirmShareout, null);
  const [ready, setReady] = useState(false);
  return (
    <form action={action} className="grid gap-3">
      <label className="flex items-start gap-3 text-sm font-semibold">
        <input type="checkbox" className="mt-1 h-5 w-5" checked={ready} onChange={(event) => setReady(event.target.checked)} />
        <span>{t(lang, "confirmCheck")}</span>
      </label>
      <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
      {state?.ok ? <p className="text-sm font-semibold text-green">{t(lang, "save")}</p> : null}
      <SubmitButton label={t(lang, "confirmShareout")} pendingLabel={t(lang, "pleaseWait")} disabled={!ready} />
    </form>
  );
}

export function AddLawForm({ lang }: { lang: Lang }) {
  const [state, action] = useActionState(addLaw, null);
  return (
    <Card>
      <h3 className="mb-3 text-lg font-bold">{t(lang, "addLaw")}</h3>
      <form action={action} className="grid gap-3">
        <TextArea label={t(lang, "lawBody")} name="body" required />
        <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
        <SubmitButton label={t(lang, "add")} pendingLabel={t(lang, "pleaseWait")} />
      </form>
    </Card>
  );
}

export function LawEditor({ lang, law, index }: { lang: Lang; law: GroupLaw; index: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(updateLaw, null);
  const [deleteState, deleteAction] = useActionState(deleteLaw, null);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base leading-6">
          <span className="font-bold text-green">{index}. </span>
          {law.body}
        </p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-11 shrink-0 rounded-2xl border border-line px-3 text-sm font-semibold"
        >
          {open ? t(lang, "close") : t(lang, "edit")}
        </button>
      </div>
      {open ? (
        <form action={action} className="mt-4 grid gap-3">
          <input type="hidden" name="id" value={law.id} />
          <TextArea label={t(lang, "lawBody")} name="body" required defaultValue={law.body} />
          <FormError lang={lang} code={state?.ok === false ? state.error : undefined} />
          <SubmitButton label={t(lang, "save")} pendingLabel={t(lang, "pleaseWait")} />
        </form>
      ) : null}
      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="id" value={law.id} />
        <FormError lang={lang} code={deleteState?.ok === false ? deleteState.error : undefined} />
        <button type="submit" className="min-h-11 text-sm font-semibold text-clay">
          {t(lang, "deleteLaw")}
        </button>
      </form>
    </Card>
  );
}

export function LogoutButton({ label }: { label: string }) {
  return (
    <form action={logout}>
      <button type="submit" className="min-h-12 w-full rounded-2xl border border-line bg-card font-semibold text-clay">
        {label}
      </button>
    </form>
  );
}
