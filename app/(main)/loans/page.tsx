import Link from "next/link";
import { LoanForm } from "@/components/forms";
import { Card, Empty, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { formatDate, loanBalance, todayInDar } from "@/lib/money";
import { getLoans, getMembers } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function LoansPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const [members, loans] = await Promise.all([getMembers(session.supabase), getLoans(session.supabase)]);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "loans")} />
      <LoanForm lang={lang} members={members} today={todayInDar()} />
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
                <p className="text-lg font-bold">{loan.member_name}</p>
                <p className="text-sm text-muted">{formatDate(loan.issued_on, lang)}</p>
                <p className={`mt-1 text-sm font-semibold ${loan.status === "paid" ? "text-green" : "text-amber-800"}`}>
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
            <p className="mt-3 text-sm">
              {t(lang, "totalDue")}: <Money value={loan.total_due} lang={lang} /> · {t(lang, "interest")}{" "}
              {loan.interest_percent}%
            </p>
            <Link href={`/loans/${loan.id}`} className="mt-3 inline-flex min-h-11 items-center font-bold text-green">
              {t(lang, "open")}
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
