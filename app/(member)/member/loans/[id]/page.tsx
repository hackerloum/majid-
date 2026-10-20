import Link from "next/link";
import { notFound } from "next/navigation";
import { IconBack } from "@/components/icons";
import { Card, Empty, Money } from "@/components/ui";
import { t } from "@/lib/i18n";
import { formatDate, loanBalance } from "@/lib/money";
import { getLoan } from "@/lib/queries";
import { getLang, requireMember } from "@/lib/session";

export default async function MemberLoanPage({ params }: { params: Promise<{ id: string }> }) {
  const lang = await getLang();
  const session = await requireMember();
  if (!session.configured || !session.member) return null;
  const { id } = await params;
  const loan = await getLoan(session.supabase, id);
  if (!loan || loan.member_id !== session.member.id) notFound();

  const balance = loanBalance(
    loan.total_due,
    loan.repayments.map((repayment) => repayment.amount),
  );

  return (
    <div className="grid gap-4">
      <Link href="/member" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-green">
        <IconBack className="h-5 w-5" />
        {t(lang, "back")}
      </Link>
      <h2 className="text-2xl font-bold">{t(lang, "myLoans")}</h2>
      <Card>
        <p className="text-sm text-muted">{t(lang, "balance")}</p>
        <p className="text-3xl font-bold">
          <Money value={balance} lang={lang} />
        </p>
        <p className="mt-2 text-sm">
          {t(lang, "principal")}: <Money value={loan.principal} lang={lang} /> · {t(lang, "interestAmount")}:{" "}
          <Money value={loan.interest_amount} lang={lang} /> · {t(lang, "totalDue")}:{" "}
          <Money value={loan.total_due} lang={lang} />
        </p>
      </Card>
      {loan.repayments.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {loan.repayments.map((repayment) => (
        <Card key={repayment.id}>
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold">{formatDate(repayment.paid_on, lang)}</p>
            <p className="font-bold">
              <Money value={repayment.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
