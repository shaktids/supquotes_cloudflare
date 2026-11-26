// Content model (generated/content.json, built from content/ by scripts/build-content.mjs) and the
// date-based daily pick. Shared by the site and the OG worker. No database: everything is computed
// from the bundled content and today's date, so every visitor sees the same pick for the day.
import type { Layout } from "./layout";

export interface Quote { id: string; text: string; author: string | null; authorSlug: string | null; topic: string; lang: string }
export interface Wish { id: string; text: string; occasion: string; lang: string }
export interface Topic { slug: string; name: string; emoji: string | null; isOccasion: boolean }
export interface Occasion { key: string; label: string; everyday: boolean }
export interface Festival {
  slug: string; name: string; occasion: string; starts: string; ends: string;
  headline: string | null; accent: string | null; art: string | null; priority: number;
}
export interface Template { id: string; name: string; kind: "quote" | "wish" | "any"; occasion: string | null; bg: string | null; sort: number; layout: Partial<Layout> }
export interface Content {
  quotes: Quote[]; wishes: Wish[]; topics: Topic[]; authors: Record<string, string>;
  occasions: Occasion[]; festivals: Festival[]; templates: Template[];
}

/** YYYY-MM-DD for `date` in the given IANA timezone. */
export function dayInTz(tz: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** The highest-priority festival covering `day`, if any. */
export function festivalOn(c: Content, day: string): Festival | null {
  return (
    c.festivals
      .filter((f) => f.starts <= day && f.ends >= day)
      .sort((a, b) => b.priority - a.priority || b.starts.localeCompare(a.starts))[0] ?? null
  );
}

/** Next date (>= day) each occasion is on, for "Diwali · 29 Oct" labels and ordering. */
export function nextDates(c: Content, day: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of c.festivals) {
    if (f.ends < day) continue;
    const cur = m.get(f.occasion);
    if (!cur || f.starts < cur) m.set(f.occasion, f.starts);
  }
  return m;
}

const PRIMES = [7919, 7927, 7933, 7937, 7949, 7951, 7963, 7993];
const hashStr = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Deterministic pick for a day: steps through the list with a stride coprime to its length,
 * so consecutive days never repeat until every item has been shown once.
 */
export function pickForDay<T>(list: T[], day: string, salt: string): T | null {
  const n = list.length;
  if (!n) return null;
  const dayNo = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  const step = PRIMES.find((p) => n % p !== 0) ?? 1;
  const i = ((dayNo * step + hashStr(salt)) % n + n) % n;
  return list[i];
}

export interface DailyPick { day: string; festival: Festival | null; quote: Quote | null; wish: Wish | null; template: Template | null }

/** Today's quote, wish, template and festival. */
export function dailyPick(c: Content, day: string): DailyPick {
  const festival = festivalOn(c, day);
  const occ = festival?.occasion ?? null;
  const festQuotes = occ ? c.quotes.filter((q) => q.topic === occ) : [];
  const quote = pickForDay(festQuotes.length ? festQuotes : c.quotes, day, `quote:${occ ?? ""}`);
  const festWishes = occ ? c.wishes.filter((w) => w.occasion === occ) : [];
  const wish = occ
    ? pickForDay(festWishes, day, `wish:${occ}`) // awareness days have no wishes on purpose
    : pickForDay(c.wishes.filter((w) => w.occasion === "good-morning"), day, "wish");
  const festTpl = occ ? c.templates.filter((t) => t.occasion === occ) : [];
  const generic = c.templates.filter((t) => t.occasion == null && t.kind !== "wish");
  const template = pickForDay(festTpl.length ? festTpl : generic, day, `tpl:${occ ?? ""}`);
  return { day, festival, quote, wish, template };
}
