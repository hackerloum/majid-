import Link from "next/link";
import { LogoutButton } from "@/components/forms";
import { Card, Empty, Money } from "@/components/ui";
import { kindLabel, t } from "@/lib/i18n";
import { formatDate, loanBalance } from "@/lib/money";
import { getFines, getLaws, getLoans, getMyContributions, getStatement } from "@/lib/queries";
import { getLang, requireMember } from "@/lib/session";

export default async function MemberHomePage() {
  const lang = await getLang();
  const session = await requireMember();
  if (!session.configured || !session.member) return null;

  const [laws, contributions, loans, fines, statement] = await Promise.all([
    getLaws(session.supabase),
    getMyContributions(session.supabase),
    getLoans(session.supabase),
    getFines(session.supabase),
    getStatement(session.supabase, session.member.id),
  ]);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-2xl font-bold">{t(lang, "memberHome")}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{t(lang, "memberLead")}</p>
      </div>

      <h3 className="text-lg font-bold">{t(lang, "laws")}</h3>
      {laws.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {laws.map((law, index) => (
        <Card key={law.id}>
          <p className="leading-6">
            <span className="font-bold text-green">{index + 1}. </span>
            {law.body}
          </p>
        </Card>
      ))}

      <h3 className="text-lg font-bold">{t(lang, "myContributions")}</h3>
      {contributions.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {contributions.map((row) => (
        <Card key={row.id}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted">{formatDate(row.paid_on, lang)}</p>
            <p className="font-bold">
              <Money value={row.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}

      <h3 className="text-lg font-bold">{t(lang, "myLoans")}</h3>
      {loans.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {loans.map((loan) => {
        const balance = loanBalance(
          loan.total_due,
          loan.repayments.map((repayment) => repayment.amount),
        );
        return (
          <Card key={loan.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{formatDate(loan.issued_on, lang)}</p>
                <p className="text-sm text-muted">
                  {loan.status === "paid" ? t(lang, "paid") : t(lang, "ongoing")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">{t(lang, "balance")}</p>
                <p className="font-bold">
                  <Money value={balance} lang={lang} />
                </p>
              </div>
            </div>
            <Link href={`/member/loans/${loan.id}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-green">
              {t(lang, "open")}
            </Link>
          </Card>
        );
      })}

      <h3 className="text-lg font-bold">{t(lang, "myFines")}</h3>
      {fines.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {fines.map((fine) => (
        <Card key={fine.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm">{fine.reason}</p>
              <p className="text-sm text-muted">{formatDate(fine.fined_on, lang)}</p>
            </div>
            <p className="font-bold text-clay">
              <Money value={fine.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}

      <h3 className="text-lg font-bold">{t(lang, "myStatement")}</h3>
      {(statement?.rows.length ?? 0) === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {statement?.rows.map((row) => (
        <Card key={row.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{kindLabel(lang, row.kind)}</p>
              <p className="text-sm text-muted">{formatDate(row.occurred_on, lang)}</p>
            </div>
            <p className="font-bold">
              <Money value={row.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}

      <LogoutButton label={t(lang, "logout")} />
    </div>
  );
}
