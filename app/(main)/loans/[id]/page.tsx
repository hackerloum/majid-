import { notFound } from "next/navigation";
import { RepaymentForm } from "@/components/forms";
import { Card, Empty, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { formatDate, loanBalance, todayInDar } from "@/lib/money";
import { getLoan } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function LoanPage({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const { id } = await params;
  const loan = await getLoan(session.supabase, id);
  if (!loan) notFound();

  const balance = loanBalance(
    loan.total_due,
    loan.repayments.map((repayment) => repayment.amount),
  );

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={loan.member_name}>
        {t(lang, "principal")}: <Money value={loan.principal} lang={lang} /> · {t(lang, "interestAmount")}:{" "}
        <Money value={loan.interest_amount} lang={lang} /> · {t(lang, "totalDue")}:{" "}
        <Money value={loan.total_due} lang={lang} />
      </PageIntro>
      <Card>
        <p className="text-sm text-muted">{t(lang, "balance")}</p>
        <p className="text-3xl font-bold">
          <Money value={balance} lang={lang} />
        </p>
        <p className="mt-1 text-sm font-semibold text-green">
          {loan.status === "paid" ? t(lang, "paid") : t(lang, "ongoing")}
        </p>
      </Card>
      {loan.status === "active" ? (
        <RepaymentForm lang={lang} loanId={loan.id} balance={balance} today={todayInDar()} />
      ) : null}
      {loan.repayments.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {loan.repayments.map((repayment) => (
        <Card key={repayment.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{formatDate(repayment.paid_on, lang)}</p>
              {repayment.note ? <p className="text-sm text-muted">{repayment.note}</p> : null}
            </div>
            <p className="font-bold">
              <Money value={repayment.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
