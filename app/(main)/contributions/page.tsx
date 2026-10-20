import { ContributionForm } from "@/components/forms";
import { Card, Empty, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { currentMonth, formatDate, monthRange, todayInDar } from "@/lib/money";
import { getContributions, getMembers, getSnapshot } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;

  const params = await searchParams;
  const month = monthRange(params.month ?? "") ? (params.month as string) : currentMonth();
  const range = monthRange(month)!;
  const [members, rows, snapshot] = await Promise.all([
    getMembers(session.supabase),
    getContributions(session.supabase, range.start, range.end),
    getSnapshot(session.supabase, range.start),
  ]);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "contributions")} />
      <form className="no-print flex items-end gap-2" method="get">
        <label className="grid flex-1 gap-1 text-sm font-semibold">
          <span>{t(lang, "month")}</span>
          <input
            className="min-h-12 rounded-2xl border border-line bg-white px-3"
            type="month"
            name="month"
            defaultValue={month}
          />
        </label>
        <button className="min-h-12 rounded-2xl bg-green px-4 font-semibold text-white" type="submit">
          {t(lang, "show")}
        </button>
      </form>
      <ContributionForm lang={lang} members={members} today={todayInDar()} />
      <Card>
        <h3 className="text-lg font-bold">{t(lang, "unpaidMonth")}</h3>
        {snapshot.unpaid.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t(lang, "allPaid")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {snapshot.unpaid.map((member) => (
              <li key={member.id} className="font-semibold">
                {member.full_name}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {rows.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {rows.map((row) => (
        <Card key={row.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{row.member_name}</p>
              <p className="text-sm text-muted">{formatDate(row.paid_on, lang)}</p>
              {row.note ? <p className="mt-1 text-sm">{row.note}</p> : null}
            </div>
            <p className="font-bold">
              <Money value={row.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
