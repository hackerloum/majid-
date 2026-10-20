import { AddLawForm, LawEditor, LogoutButton, RenameForm } from "@/components/forms";
import { PrintButton } from "@/components/print-button";
import { Card, Empty, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLaws } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function AdminPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const laws = await getLaws(session.supabase);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "admin")}>
        {t(lang, "adminLead")}
      </PageIntro>
      <Card>
        <p className="text-sm text-muted">{t(lang, "adminAccount")}</p>
        <p className="mt-1 break-all font-bold">{session.email}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted">{t(lang, "inviteCode")}</p>
        <p className="mt-1 text-3xl font-bold tracking-widest">{session.group.invite_code}</p>
        <p className="mt-2 text-sm leading-6 text-muted">{t(lang, "inviteHelp")}</p>
      </Card>
      <RenameForm lang={lang} name={session.group.name} />
      <div className="mt-2">
        <h2 className="mb-2 text-xl font-bold">{t(lang, "laws")}</h2>
        <p className="mb-4 text-sm leading-6 text-muted">{t(lang, "lawsLead")}</p>
        <PrintButton label={t(lang, "print")} />
      </div>
      <AddLawForm lang={lang} />
      {laws.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {laws.map((law, index) => (
        <LawEditor key={law.id} lang={lang} law={law} index={index + 1} />
      ))}
      <LogoutButton label={t(lang, "logout")} />
    </div>
  );
}
