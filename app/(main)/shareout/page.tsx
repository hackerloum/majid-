import { ShareoutForm } from "@/components/forms";
import { Card, Money, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { formatTzs } from "@/lib/money";
import { getSharePreview } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function ShareoutPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const preview = await getSharePreview(session.supabase);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "shareoutTitle")}>
        {t(lang, "shareoutHelp")}
      </PageIntro>
      {preview ? (
        <div className="grid gap-3">
          <Card>
            <p className="text-sm text-muted">{t(lang, "interestCollected")}</p>
            <p className="text-xl font-bold">
              <Money value={preview.interest_collected} lang={lang} />
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">{t(lang, "cycleFines")}</p>
            <p className="text-xl font-bold">
              <Money value={preview.fines_total} lang={lang} />
            </p>
          </Card>
          <Card>
            <p className="text-sm text-muted">{t(lang, "profit")}</p>
            <p className="text-xl font-bold">
              <Money value={preview.profit} lang={lang} />
            </p>
          </Card>
          {preview.outstanding_loans > 0 ? (
            <p className="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-900">
              {t(lang, "outstandingWarning").replace("{amount}", formatTzs(preview.outstanding_loans, lang))}
            </p>
          ) : null}
        </div>
      ) : null}
      {preview && preview.lines.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-3 py-3">{t(lang, "member")}</th>
                <th className="px-3 py-3">{t(lang, "contributions")}</th>
                <th className="px-3 py-3">{t(lang, "profitShare")}</th>
                <th className="px-3 py-3">{t(lang, "payout")}</th>
              </tr>
            </thead>
            <tbody>
              {[...preview.lines]
                .sort((a, b) => a.full_name.localeCompare(b.full_name, lang === "sw" ? "sw" : "en"))
                .map((line) => (
                <tr key={line.member_id} className="border-t border-line">
                  <td className="px-3 py-3 font-semibold">{line.full_name}</td>
                  <td className="px-3 py-3">
                    <Money value={line.contribution} lang={lang} />
                  </td>
                  <td className="px-3 py-3">
                    <Money value={line.profit_share} lang={lang} />
                  </td>
                  <td className="px-3 py-3 font-bold">
                    <Money value={line.payout} lang={lang} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted">{t(lang, "nothingToShare")}</p>
      )}
      {preview && preview.lines.length > 0 ? <ShareoutForm lang={lang} /> : null}
    </div>
  );
}
