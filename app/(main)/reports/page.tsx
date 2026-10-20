import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { Card, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { currentMonth, todayInDar, formatDate } from "@/lib/money";
import { getMembers, getSnapshot } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function ReportsPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const month = currentMonth();
  const [snapshot, members] = await Promise.all([
    getSnapshot(session.supabase, `${month}-01`),
    getMembers(session.supabase),
  ]);

  const rows = [
    [t(lang, "activeMembers"), String(snapshot.members_active)],
    [t(lang, "allMembers"), String(snapshot.members_all)],
    [t(lang, "totalContributions"), snapshot.contributions_total],
    [t(lang, "totalFines"), snapshot.fines_total],
    [t(lang, "loansGiven"), snapshot.loans_principal],
    [t(lang, "interestSet"), snapshot.loans_interest],
    [t(lang, "interestCollected"), snapshot.interest_collected],
    [t(lang, "repayments"), snapshot.repayments_total],
    [t(lang, "owed"), snapshot.outstanding],
  ] as const;

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "groupSummary")}>
        {session.group.name} · {formatDate(todayInDar(), lang)}
      </PageIntro>
      <PrintButton label={t(lang, "print")} />
      <Card>
        <dl className="grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-bold">{typeof value === "number" ? <Money value={value} lang={lang} /> : value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <h3 className="text-lg font-bold">{t(lang, "memberStatement")}</h3>
      {members.map((member) => (
        <Link key={member.id} href={`/reports/${member.id}`} className="rounded-3xl border border-line bg-card px-4 py-3 font-semibold">
          {member.full_name}
        </Link>
      ))}
    </div>
  );
}
