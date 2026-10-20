import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Card, Money, PageIntro } from "@/components/ui";
import { kindLabel, t } from "@/lib/i18n";
import { formatDate, todayInDar } from "@/lib/money";
import { getStatement } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function StatementPage({ params }: { params: Promise<{ memberId: string }> }) {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const { memberId } = await params;
  const statement = await getStatement(session.supabase, memberId);
  if (!statement) notFound();

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={statement.member.full_name}>
        {t(lang, "memberStatement")} · {session.group.name} · {formatDate(todayInDar(), lang)}
      </PageIntro>
      <PrintButton label={t(lang, "print")} />
      {statement.rows.length === 0 ? (
        <p className="text-sm text-muted">{t(lang, "empty")}</p>
      ) : (
        statement.rows.map((row) => (
          <Card key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{kindLabel(lang, row.kind)}</p>
                <p className="text-sm text-muted">{formatDate(row.occurred_on, lang)}</p>
                {row.note ? <p className="mt-1 text-sm">{row.note}</p> : null}
              </div>
              <p className="font-bold">
                <Money value={row.amount} lang={lang} />
              </p>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
