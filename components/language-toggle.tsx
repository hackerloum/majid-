"use client";

import { useRouter } from "next/navigation";
import { setLanguage } from "@/lib/actions";
import type { Lang } from "@/lib/types";

export function LanguageToggle({ lang }: { lang: Lang }) {
  const router = useRouter();

  function choose(next: Lang) {
    void setLanguage(next).then(() => router.refresh());
  }

  return (
    <div className="no-print flex rounded-full border border-line bg-card p-1 text-sm font-bold">
      {(["sw", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => choose(code)}
          className={`min-h-10 min-w-12 rounded-full px-3 ${lang === code ? "bg-green text-white" : "text-ink"}`}
          aria-pressed={lang === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
