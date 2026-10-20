import { FineForm } from "@/components/forms";
import { Card, Empty, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { formatDate, todayInDar } from "@/lib/money";
import { getFines, getMembers } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function FinesPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const [members, fines] = await Promise.all([getMembers(session.supabase), getFines(session.supabase)]);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "fines")} />
      <FineForm lang={lang} members={members} today={todayInDar()} />
      {fines.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {fines.map((fine) => (
        <Card key={fine.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{fine.member_name}</p>
              <p className="text-sm">{fine.reason}</p>
              <p className="text-sm text-muted">{formatDate(fine.fined_on, lang)}</p>
            </div>
            <p className="font-bold text-clay">
              <Money value={fine.amount} lang={lang} />
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
