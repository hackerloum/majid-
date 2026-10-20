import { Card, Empty, PageIntro } from "@/components/ui";
import { activityLine, t } from "@/lib/i18n";
import { formatWhen } from "@/lib/money";
import { getActivity } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function ActivityPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const rows = await getActivity(session.supabase);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "activity")} />
      {rows.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {rows.map((row) => (
        <Card key={row.id}>
          <p className="font-semibold">{activityLine(lang, row.action, row.summary)}</p>
          <p className="mt-1 text-sm text-muted">{formatWhen(row.created_at, lang)}</p>
        </Card>
      ))}
    </div>
  );
}
