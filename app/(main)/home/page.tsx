import Link from "next/link";
import {
  IconActivity,
  IconCoin,
  IconFine,
  IconLoan,
  IconAdmin,
  IconReport,
  IconShare,
  IconUsers,
} from "@/components/icons";
import { Card, Money } from "@/components/ui";
import { t, type CopyKey } from "@/lib/i18n";
import { currentMonth } from "@/lib/money";
import { getSnapshot } from "@/lib/queries";
import { getLang, requireGroup } from "@/lib/session";
import type { Lang } from "@/lib/types";

const links: { href: string; key: CopyKey; icon: typeof IconUsers }[] = [
  { href: "/members", key: "members", icon: IconUsers },
  { href: "/contributions", key: "contributions", icon: IconCoin },
  { href: "/loans", key: "loans", icon: IconLoan },
  { href: "/fines", key: "fines", icon: IconFine },
  { href: "/shareout", key: "shareout", icon: IconShare },
  { href: "/reports", key: "reports", icon: IconReport },
  { href: "/activity", key: "activity", icon: IconActivity },
  { href: "/admin", key: "admin", icon: IconAdmin },
];

function Stat({ label, value, lang }: { label: string; value: number; lang: Lang }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">
        <Money value={value} lang={lang} />
      </p>
    </Card>
  );
}

export default async function HomePage() {
  const lang = await getLang();
  const session = await requireGroup();
  if (!session.configured || !session.group) return null;

  const month = currentMonth();
  const snapshot = await getSnapshot(session.supabase, `${month}-01`);

  return (
    <div className="grid gap-4">
      <Card>
        <p className="text-sm text-muted">{t(lang, "activeMembers")}</p>
        <p className="text-3xl font-bold">{snapshot.members_active}</p>
      </Card>
      <div className="grid gap-3">
        <Stat label={t(lang, "totalContributions")} value={snapshot.contributions_total} lang={lang} />
        <Stat label={t(lang, "loanBalance")} value={snapshot.outstanding} lang={lang} />
        <Stat label={t(lang, "totalFines")} value={snapshot.fines_total} lang={lang} />
      </div>
      <Card>
        <h2 className="text-lg font-bold">{t(lang, "unpaidTitle")}</h2>
        {snapshot.unpaid.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t(lang, "allPaid")}</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {snapshot.unpaid.map((member) => (
              <li key={member.id} className="rounded-2xl bg-paper px-3 py-2 font-semibold">
                {member.full_name}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <nav className="grid grid-cols-2 gap-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-24 flex-col justify-between rounded-3xl border border-line bg-card p-4 font-bold"
          >
            <item.icon className="h-7 w-7 text-green" />
            {t(lang, item.key)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
