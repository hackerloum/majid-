import { LogoutButton, RenameForm } from "@/components/forms";
import { PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getLang, requireGroup } from "@/lib/session";

export default async function SettingsPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "settings")}>
        {t(lang, "settingsLead")}
      </PageIntro>
      <RenameForm lang={lang} name={session.group.name} />
      <LogoutButton label={t(lang, "logout")} />
    </div>
  );
}
