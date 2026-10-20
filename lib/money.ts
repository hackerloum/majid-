import type { Lang } from "@/lib/types";

export function asTzs(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number);
}

export function formatTzs(value: number | string | null | undefined, lang: Lang): string {
  const amount = new Intl.NumberFormat(lang === "sw" ? "sw-TZ" : "en-TZ", {
    maximumFractionDigits: 0,
  }).format(asTzs(value));
  return `${amount} TZS`;
}

export function formatDate(value: string, lang: Lang): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "sw" ? "sw-TZ" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, (month || 1) - 1, day || 1));
}

export function formatWhen(value: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "sw" ? "sw-TZ" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(new Date(value));
}

export function currentMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Dar_es_Salaam",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

export function todayInDar(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Dar_es_Salaam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function monthRange(month: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const end =
    monthNumber === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export function loanBalance(totalDue: number | string, paid: Array<number | string>): number {
  return asTzs(totalDue) - paid.reduce<number>((sum, amount) => sum + asTzs(amount), 0);
}

export function interestDue(principal: number, percent: number): number {
  if (!Number.isFinite(principal) || !Number.isFinite(percent) || principal <= 0) return 0;
  return Math.round((principal * percent) / 100);
}
