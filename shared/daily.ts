// Daily pick logic, used by the cron in workers/edge and as a lazy fallback by the site.
import type { Client } from "@libsql/client/web";

/** YYYY-MM-DD for `date` in the given IANA timezone. */
export function dayInTz(tz: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export interface DailyPick {
  day: string;
  quote_id: number | null;
  wish_id: number | null;
  template_id: number | null;
  festival_id: number | null;
}

/** Active festival covering `day`, highest priority first. */
export async function festivalOn(db: Client, day: string) {
  const r = await db.execute({
    sql: `SELECT * FROM festivals WHERE is_active = 1 AND starts_on <= ?1 AND ends_on >= ?1
          ORDER BY priority DESC, starts_on DESC LIMIT 1`,
    args: [day],
  });
  return r.rows[0] ?? null;
}

async function one(db: Client, sql: string, args: (string | number)[] = []): Promise<number | null> {
  const r = await db.execute({ sql, args });
  const v = r.rows[0]?.[0];
  return v == null ? null : Number(v);
}

/**
 * Compute and store the pick for `day`. With `overwrite=false` an existing row
 * (e.g. one set by hand in the admin page) is kept.
 */
export async function setDailyPick(db: Client, day: string, overwrite = true): Promise<DailyPick> {
  if (!overwrite) {
    const existing = await db.execute({ sql: "SELECT * FROM daily_picks WHERE day = ?", args: [day] });
    if (existing.rows[0]) return existing.rows[0] as unknown as DailyPick;
  }

  const festival = await festivalOn(db, day);
  const festivalId = festival ? Number(festival.id) : null;
  const occasion = festival ? String(festival.occasion) : null;

  // Festival day: a quote for that day if the topic has any. Otherwise avoid repeating a quote
  // picked in the last 90 days when possible.
  const festivalQuote = occasion
    ? await one(
        db,
        `SELECT q.id FROM quotes q JOIN topics t ON t.id = q.topic_id
         WHERE q.is_active = 1 AND t.slug = ? ORDER BY random() LIMIT 1`,
        [occasion],
      )
    : null;
  const quoteId =
    festivalQuote ??
    (await one(
      db,
      `SELECT id FROM quotes WHERE is_active = 1
         AND id NOT IN (SELECT quote_id FROM daily_picks WHERE quote_id IS NOT NULL AND day >= date(?, '-90 days'))
       ORDER BY random() LIMIT 1`,
      [day],
    )) ?? (await one(db, "SELECT id FROM quotes WHERE is_active = 1 ORDER BY random() LIMIT 1"));

  const wishId = occasion
    ? await one(db, "SELECT id FROM wishes WHERE is_active = 1 AND occasion = ? ORDER BY random() LIMIT 1", [occasion])
    : await one(db, "SELECT id FROM wishes WHERE is_active = 1 AND occasion = 'good-morning' ORDER BY random() LIMIT 1");

  const templateId =
    (occasion
      ? await one(db, "SELECT id FROM templates WHERE is_active = 1 AND occasion = ? ORDER BY random() LIMIT 1", [occasion])
      : null) ??
    (await one(
      db,
      "SELECT id FROM templates WHERE is_active = 1 AND occasion IS NULL AND kind IN ('quote','any') ORDER BY random() LIMIT 1",
    ));

  const pick: DailyPick = { day, quote_id: quoteId, wish_id: wishId, template_id: templateId, festival_id: festivalId };
  await db.execute({
    sql: `INSERT INTO daily_picks (day, quote_id, wish_id, template_id, festival_id) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(day) DO UPDATE SET quote_id = excluded.quote_id, wish_id = excluded.wish_id,
            template_id = excluded.template_id, festival_id = excluded.festival_id, created_at = datetime('now')`,
    args: [day, quoteId, wishId, templateId, festivalId],
  });
  return pick;
}
