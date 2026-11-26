// Site data access. Everything comes from generated/content.json (built from content/ at build time),
// bundled into the Worker: no database, no network calls.
import { env } from "cloudflare:workers";
import raw from "../../generated/content.json";
import { dailyPick, dayInTz, nextDates, type Content, type Quote as RawQuote, type Wish } from "../../shared/content";

export type { Wish };
const C = raw as unknown as Content;

export const siteTz = () => env.SITE_TZ || "Asia/Kolkata";
export const ogBase = () => (env.OG_BASE_URL || "").replace(/\/$/, "");
export const mediaUrl = (key: string | null | undefined) =>
  key ? `${(env.MEDIA_BASE_URL || "").replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}` : null;

const topicBySlug = new Map(C.topics.map((t) => [t.slug, t]));
const quoteById = new Map(C.quotes.map((q) => [q.id, q]));
const wishById = new Map(C.wishes.map((w) => [w.id, w]));
const labelByKey = new Map(C.occasions.map((o) => [o.key, o.label]));

/** Quote as pages and the generator use it. */
export interface Quote { id: string; text: string; author: string | null; author_slug: string | null; topic: string | null; topic_slug: string | null }
const view = (q: RawQuote | undefined | null): Quote | null =>
  q ? { id: q.id, text: q.text, author: q.author, author_slug: q.authorSlug, topic: topicBySlug.get(q.topic)?.name ?? null, topic_slug: q.topic } : null;

const randomOf = <T>(list: T[]): T | null => (list.length ? list[Math.floor(Math.random() * list.length)] : null);

export const getQuote = (id: string) => view(quoteById.get(id));
export const getWish = (id: string) => wishById.get(id) ?? null;

export function randomQuote(topic?: string | null, exclude?: string | null) {
  const pool = C.quotes.filter((q) => (!topic || q.topic === topic) && q.id !== exclude);
  return view(randomOf(pool.length ? pool : C.quotes.filter((q) => !topic || q.topic === topic)));
}

export function randomWish(occasion?: string | null, exclude?: string | null) {
  const pool = C.wishes.filter((w) => (!occasion || w.occasion === occasion) && w.id !== exclude);
  return randomOf(pool.length ? pool : C.wishes.filter((w) => !occasion || w.occasion === occasion));
}

export function quotesBy(field: "topic" | "author", slug: string) {
  return C.quotes.filter((q) => (field === "topic" ? q.topic === slug : q.authorSlug === slug)).map((q) => view(q)!);
}

export const wishesFor = (occasion: string) => C.wishes.filter((w) => w.occasion === occasion);
export const authorName = (slug: string) => C.authors[slug] ?? null;

export interface OccasionView { key: string; label: string; everyday: boolean; next_on: string | null; on_now: boolean }

/** Wish occasions: everyday ones first, then festivals & days ordered by their next date. */
export function occasions(): OccasionView[] {
  const day = dayInTz(siteTz());
  const next = nextDates(C, day);
  const everyday = ["birthday", "anniversary", "good-morning", "good-night", "congratulations", "get-well"];
  return C.occasions
    .map((o) => {
      const next_on = next.get(o.key) ?? null;
      return { ...o, next_on, on_now: next_on != null && next_on <= day };
    })
    .sort((a, b) => {
      if (a.everyday !== b.everyday) return a.everyday ? -1 : 1;
      if (a.everyday) return everyday.indexOf(a.key) - everyday.indexOf(b.key);
      return (a.next_on ?? "9999").localeCompare(b.next_on ?? "9999") || a.label.localeCompare(b.label);
    });
}

export const topics = () => C.topics.map((t) => ({ slug: t.slug, name: t.name, emoji: t.emoji, is_occasion: t.isOccasion }));

/** Templates in the shape the generator script uses. */
export const templates = () =>
  C.templates.map((t) => ({ id: t.id, name: t.name, kind: t.kind, occasion: t.occasion, layout_json: JSON.stringify(t.layout), bg_url: mediaUrl(t.bg) }));

/** Today's pick, computed from the date (same for every visitor). */
export function today() {
  const p = dailyPick(C, dayInTz(siteTz()));
  return {
    day: p.day,
    quote: view(p.quote),
    wish: p.wish,
    festival: p.festival ? { ...p.festival, art_url: mediaUrl(p.festival.art) } : null,
    templateId: p.template?.id ?? null,
  };
}

export const occasionLabel = (o: string) => labelByKey.get(o) ?? o.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
