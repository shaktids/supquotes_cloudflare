import { createClient, type Client, type Row } from "@libsql/client/web";
import { env } from "cloudflare:workers";
import { dayInTz, setDailyPick } from "../../shared/daily";

let client: Client | null = null;

export function db(): Client {
  if (!client) {
    client = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN || undefined });
  }
  return client;
}

export const siteTz = () => env.SITE_TZ || "Asia/Kolkata";
export const mediaUrl = (key: string | null | undefined) =>
  key ? `${(env.MEDIA_BASE_URL || "").replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}` : null;
export const ogBase = () => (env.OG_BASE_URL || "").replace(/\/$/, "");

const plain = <T>(r: Row | undefined): T | null => (r ? (Object.fromEntries(Object.entries(r)) as T) : null);
const plainAll = <T>(rows: Row[]): T[] => rows.map((r) => plain<T>(r)!);

export interface Quote { id: number; text: string; author: string | null; author_slug: string | null; topic: string | null; topic_slug: string | null }
export interface Wish { id: number; text: string; occasion: string }
export interface Template { id: number; name: string; kind: string; occasion: string | null; layout_json: string; bg_key: string | null }
export interface Topic { id: number; slug: string; name: string; emoji: string | null }
export interface Festival { id: number; slug: string; name: string; occasion: string; headline: string | null; accent: string | null; art_key: string | null }

const QUOTE_SELECT = `SELECT q.id, q.text, a.name AS author, a.slug AS author_slug, t.name AS topic, t.slug AS topic_slug
  FROM quotes q LEFT JOIN authors a ON a.id = q.author_id LEFT JOIN topics t ON t.id = q.topic_id`;

export async function getQuote(id: number) {
  const r = await db().execute({ sql: `${QUOTE_SELECT} WHERE q.id = ? AND q.is_active = 1`, args: [id] });
  return plain<Quote>(r.rows[0]);
}

export async function randomQuote(topic?: string | null, exclude?: number | null) {
  const r = await db().execute({
    sql: `${QUOTE_SELECT} WHERE q.is_active = 1 AND (?1 IS NULL OR t.slug = ?1) AND (?2 IS NULL OR q.id != ?2)
          ORDER BY random() LIMIT 1`,
    args: [topic || null, exclude ?? null],
  });
  return plain<Quote>(r.rows[0]);
}

export async function quotesBy(field: "topic" | "author", slug: string, limit = 60) {
  const col = field === "topic" ? "t.slug" : "a.slug";
  const r = await db().execute({ sql: `${QUOTE_SELECT} WHERE q.is_active = 1 AND ${col} = ? ORDER BY q.id DESC LIMIT ?`, args: [slug, limit] });
  return plainAll<Quote>(r.rows);
}

export async function getWish(id: number) {
  const r = await db().execute({ sql: "SELECT id, text, occasion FROM wishes WHERE id = ? AND is_active = 1", args: [id] });
  return plain<Wish>(r.rows[0]);
}

export async function randomWish(occasion?: string | null, exclude?: number | null) {
  const r = await db().execute({
    sql: `SELECT id, text, occasion FROM wishes WHERE is_active = 1 AND (?1 IS NULL OR occasion = ?1) AND (?2 IS NULL OR id != ?2)
          ORDER BY random() LIMIT 1`,
    args: [occasion || null, exclude ?? null],
  });
  return plain<Wish>(r.rows[0]);
}

export async function wishesFor(occasion: string, limit = 60) {
  const r = await db().execute({ sql: "SELECT id, text, occasion FROM wishes WHERE is_active = 1 AND occasion = ? ORDER BY id LIMIT ?", args: [occasion, limit] });
  return plainAll<Wish>(r.rows);
}

/** Everyday occasions, shown first in this order. Everything else is a festival/day. */
const EVERYDAY = ["birthday", "anniversary", "good-morning", "good-night", "congratulations", "get-well"];

export interface Occasion { key: string; label: string; everyday: boolean; next_on: string | null; on_now: boolean }

/** Wish occasions: everyday ones first, then festivals & days ordered by their next date. */
export async function occasions(): Promise<Occasion[]> {
  const day = dayInTz(siteTz());
  const r = await db().execute({
    sql: `SELECT w.occasion AS key,
            (SELECT min(f.starts_on) FROM festivals f WHERE f.occasion = w.occasion AND f.is_active = 1 AND f.ends_on >= ?) AS next_on
          FROM wishes w WHERE w.is_active = 1 GROUP BY w.occasion`,
    args: [day],
  });
  const list = r.rows.map((x) => {
    const key = String(x.key);
    const next_on = (x.next_on as string | null) ?? null;
    return { key, label: occasionLabel(key), everyday: EVERYDAY.includes(key), next_on, on_now: next_on != null && next_on <= day };
  });
  return list.sort((a, b) => {
    if (a.everyday !== b.everyday) return a.everyday ? -1 : 1;
    if (a.everyday) return EVERYDAY.indexOf(a.key) - EVERYDAY.indexOf(b.key);
    return (a.next_on ?? "9999").localeCompare(b.next_on ?? "9999") || a.label.localeCompare(b.label);
  });
}

/** Quote topics; `is_occasion` marks day/festival topics (slug matches a festival occasion). */
export async function topics() {
  const r = await db().execute(
    `SELECT t.id, t.slug, t.name, t.emoji,
       EXISTS (SELECT 1 FROM festivals f WHERE f.occasion = t.slug) AS is_occasion
     FROM topics t ORDER BY t.name`,
  );
  return plainAll<Topic & { is_occasion: number }>(r.rows).map((t) => ({ ...t, is_occasion: Number(t.is_occasion) === 1 }));
}

export async function templates() {
  const r = await db().execute("SELECT id, name, kind, occasion, layout_json, bg_key FROM templates WHERE is_active = 1 ORDER BY sort, id");
  return plainAll<Template>(r.rows).map((t) => ({ ...t, bg_url: mediaUrl(t.bg_key) }));
}

/** Today's picks; computes and stores them if the cron hasn't run yet. */
export async function today() {
  const day = dayInTz(siteTz());
  const d = db();
  let r = await d.execute({ sql: "SELECT * FROM daily_picks WHERE day = ?", args: [day] });
  if (!r.rows[0]) {
    await setDailyPick(d, day, false);
    r = await d.execute({ sql: "SELECT * FROM daily_picks WHERE day = ?", args: [day] });
  }
  const p = r.rows[0];
  const [quote, wish, festival] = await Promise.all([
    p?.quote_id != null ? getQuote(Number(p.quote_id)) : null,
    p?.wish_id != null ? getWish(Number(p.wish_id)) : null,
    p?.festival_id != null
      ? d.execute({ sql: "SELECT * FROM festivals WHERE id = ?", args: [p.festival_id] }).then((x) => plain<Festival>(x.rows[0]))
      : null,
  ]);
  return {
    day,
    quote,
    wish,
    festival: festival ? { ...festival, art_url: mediaUrl(festival.art_key) } : null,
    templateId: p?.template_id != null ? Number(p.template_id) : null,
  };
}

const LABELS: Record<string, string> = {
  "good-morning": "Good Morning", "good-night": "Good Night", "get-well": "Get Well Soon",
  "new-year": "New Year", "republic-day": "Republic Day", valentines: "Valentine's Day",
  sankranti: "Makar Sankranti & Pongal", "lunar-new-year": "Lunar New Year", eid: "Eid",
  "womens-day": "Women's Day", "good-friday": "Good Friday", "earth-day": "Earth Day",
  "labour-day": "Labour Day", "mothers-day": "Mother's Day", "fathers-day": "Father's Day",
  "environment-day": "Environment Day", "yoga-day": "Yoga Day", "fourth-of-july": "Fourth of July",
  "friendship-day": "Friendship Day", "independence-day": "Independence Day", "raksha-bandhan": "Raksha Bandhan",
  "ganesh-chaturthi": "Ganesh Chaturthi", "teachers-day": "Teachers' Day", "gandhi-jayanti": "Gandhi Jayanti",
  "childrens-day": "Children's Day", "guru-nanak-jayanti": "Guru Nanak Jayanti",
  "mother-language-day": "Mother Language Day", "happiness-day": "Day of Happiness", "health-day": "World Health Day",
  "siblings-day": "Siblings Day", "book-day": "World Book Day", "dance-day": "Dance Day", "nurses-day": "Nurses' Day",
  "family-day": "Day of Families", "parents-day": "Parents' Day", "music-day": "World Music Day", "doctors-day": "Doctors' Day",
  "chocolate-day": "Chocolate Day", "emoji-day": "Emoji Day", "youth-day": "Youth Day", "peace-day": "Day of Peace",
  "tourism-day": "Tourism Day", "heart-day": "World Heart Day", "coffee-day": "Coffee Day", "girl-child-day": "Day of the Girl Child",
  "kindness-day": "Kindness Day", "mens-day": "Men's Day", "pi-day": "Pi Day",
};
export const occasionLabel = (o: string) => LABELS[o] ?? o.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
