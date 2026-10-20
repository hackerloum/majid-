"use client";

import { IconPrint } from "@/components/icons";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card px-4 font-semibold"
    >
      <IconPrint className="h-5 w-5" />
      {label}
    </button>
  );
}
