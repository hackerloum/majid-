import { AddMemberForm, MemberEditor } from "@/components/forms";
import { Empty, PageIntro } from "@/components/ui";
import { t } from "@/lib/i18n";
import { getMembers } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";

export default async function MembersPage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;
  const members = await getMembers(session.supabase);

  return (
    <div className="grid gap-4">
      <PageIntro lang={lang} title={t(lang, "members")} />
      <AddMemberForm lang={lang} />
      {members.length === 0 ? <Empty>{t(lang, "empty")}</Empty> : null}
      {members.map((member) => (
        <MemberEditor key={member.id} lang={lang} member={member} />
      ))}
    </div>
  );
}
