"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green px-4 text-base font-semibold text-white disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
