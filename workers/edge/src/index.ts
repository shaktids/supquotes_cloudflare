// supquotes-edge: draws link-preview (OG) images and runs the daily cron.
//   GET /default.png
//   GET /q/:id.png[?t=templateId]
//   GET /w/:id.png[?name=Priya&t=templateId]
//   cron "35 18 * * *" → sync content files, then set today's daily_picks row (festival switch included)
//   cron "0 */6 * * *" → sync content files only
import { ImageResponse, loadGoogleFont } from "workers-og";
import { createClient, type Client } from "@libsql/client/web";
import { parseLayout, cssBackground, fillName, type Layout } from "../../../shared/layout";
import { dayInTz, setDailyPick } from "../../../shared/daily";
import { syncContent } from "../../../shared/content-sync";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
  MEDIA_BASE_URL: string;
  SITE_TZ?: string;
  CONTENT_BASE_URL?: string; // folder holding index.txt, quotes/, wishes/ (docs/content-format.md)
  CONTENT_TOKEN?: string; // optional Bearer token for that storage
}

const DAILY_CRON = "35 18 * * *";

const W = 1200, H = 630;
const db = (env: Env): Client => createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN || undefined });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function template(d: Client, id: number | null, kind: "quote" | "wish", occasion: string | null) {
  const r = id
    ? await d.execute({ sql: "SELECT layout_json, bg_key FROM templates WHERE id = ? AND is_active = 1", args: [id] })
    : await d.execute({
        sql: `SELECT layout_json, bg_key FROM templates WHERE is_active = 1 AND kind IN (?, 'any')
              AND (occasion IS NULL OR occasion = ?) ORDER BY (occasion = ?) DESC, sort, id LIMIT 1`,
        args: [kind, occasion, occasion],
      });
  const row = r.rows[0];
  return { layout: parseLayout(row?.layout_json as string | undefined), bgKey: (row?.bg_key as string | null) ?? null };
}

async function bgDataUri(env: Env, key: string | null): Promise<string | null> {
  if (!key || !env.MEDIA_BASE_URL) return null;
  const url = `${env.MEDIA_BASE_URL.replace(/\/$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const res = await fetch(url, { cf: { cacheEverything: true, cacheTtl: 86400 * 30 } });
  if (!res.ok) return null;
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return `data:${res.headers.get("content-type") ?? "image/jpeg"};base64,${btoa(bin)}`;
}

async function fontsFor(layout: Layout, text: string) {
  const want = new Map<string, { family: string; weight: number; style: "normal" | "italic"; text: string }>();
  const add = (family: string, weight: number, style: "normal" | "italic", t: string) => {
    const k = `${family}|${weight}|${style}`;
    const cur = want.get(k);
    want.set(k, { family, weight, style, text: (cur?.text ?? "") + t });
  };
  add(layout.text.font, layout.text.weight ?? 400, layout.text.italic ? "italic" : "normal", text + "“");
  if (layout.author) add(layout.author.font, layout.author.weight ?? 400, layout.author.italic ? "italic" : "normal", text);
  add("Poppins", 600, "normal", "supquotes.com SupQuotes");
  const out = await Promise.all(
    [...want.values()].map(async (f) => {
      try {
        // loadGoogleFont fetches a subset containing only the characters we draw.
        const data = await loadGoogleFont({ family: f.family, weight: f.weight, text: [...new Set(f.text)].join("") });
        return { name: f.family, data, weight: f.weight as 400, style: f.style };
      } catch {
        return null;
      }
    }),
  );
  return out.filter((f): f is NonNullable<typeof f> => f !== null);
}

async function card(env: Env, layout: Layout, bgKey: string | null, text: string, author: string | null, quoteMark: boolean) {
  const bg = await bgDataUri(env, bgKey);
  const len = text.length;
  const size = Math.round(Math.max(30, Math.min(64, 78 - len * 0.27)));
  const center = (layout.align ?? "center") === "center";
  const t = layout.text;
  const a = layout.author!;
  const font = (f: { font: string; weight?: number; italic?: boolean }) =>
    `font-family: '${f.font}'; font-weight: ${f.weight ?? 400}; font-style: ${f.italic ? "italic" : "normal"};`;

  const html = `
  <div style="display:flex; width:${W}px; height:${H}px; position:relative; background:${cssBackground(layout.bg)};">
    ${bg ? `<img src="${bg}" width="${W}" height="${H}" style="position:absolute; top:0; left:0; width:${W}px; height:${H}px; object-fit:cover;" />
            <div style="display:flex; position:absolute; top:0; left:0; width:${W}px; height:${H}px; background:${layout.overlay ?? "rgba(0,0,0,0.35)"};"></div>` : ""}
    <div style="display:flex; flex-direction:column; justify-content:center; align-items:${center ? "center" : "flex-start"}; width:${W}px; height:${H}px; padding:56px 96px 72px; position:relative;">
      ${quoteMark && layout.quoteMark ? `<div style="display:flex; font-family:'${t.font}'; font-weight:${t.weight ?? 700}; font-size:150px; line-height:0.9; height:80px; color:${layout.quoteMark};">“</div>` : ""}
      <div style="display:flex; ${font(t)} font-size:${size}px; line-height:1.3; color:${t.color}; text-align:${center ? "center" : "left"};">${esc(text)}</div>
      ${author ? `<div style="display:flex; margin-top:26px; ${font(a)} font-size:28px; color:${a.color};">— ${esc(author)}</div>` : ""}
    </div>
    <div style="display:flex; position:absolute; bottom:26px; left:0; width:${W}px; justify-content:center; font-family:'Poppins'; font-weight:600; font-size:22px; color:${layout.brandColor ?? "rgba(255,255,255,0.75)"};">supquotes.com</div>
  </div>`;

  return new ImageResponse(html, {
    width: W,
    height: H,
    fonts: await fontsFor(layout, `${text} ${author ?? ""} —`),
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000, immutable" },
  });
}

async function handle(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const d = db(env);
  const t = Number(url.searchParams.get("t")) || null;
  let m: RegExpMatchArray | null;

  if (url.pathname === "/" || url.pathname === "/default.png") {
    const { layout } = await template(d, null, "quote", null);
    return card(env, layout, null, "Make a quote or wish card in seconds. Share it to your status.", "SupQuotes", true);
  }
  if ((m = url.pathname.match(/^\/q\/(\d+)\.png$/))) {
    const r = await d.execute({
      sql: "SELECT q.text, a.name AS author FROM quotes q LEFT JOIN authors a ON a.id = q.author_id WHERE q.id = ? AND q.is_active = 1",
      args: [Number(m[1])],
    });
    const q = r.rows[0];
    if (!q) return new Response("not found", { status: 404 });
    const { layout, bgKey } = await template(d, t, "quote", null);
    return card(env, layout, bgKey, String(q.text), (q.author as string | null) ?? null, true);
  }
  if ((m = url.pathname.match(/^\/w\/(\d+)\.png$/))) {
    const r = await d.execute({ sql: "SELECT text, occasion FROM wishes WHERE id = ? AND is_active = 1", args: [Number(m[1])] });
    const w = r.rows[0];
    if (!w) return new Response("not found", { status: 404 });
    const { layout, bgKey } = await template(d, t, "wish", String(w.occasion));
    return card(env, layout, bgKey, fillName(String(w.text), url.searchParams.get("name")), null, false);
  }
  return new Response("not found", { status: 404 });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method !== "GET") return new Response("method not allowed", { status: 405 });
    // Normalise the cache key to only the params we use.
    const url = new URL(req.url);
    const key = new URL(url.origin + url.pathname);
    for (const p of ["t", "name"]) if (url.searchParams.get(p)) key.searchParams.set(p, url.searchParams.get(p)!.slice(0, 40));
    const cacheKey = new Request(key.toString());
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
    try {
      const res = await handle(new Request(key.toString()), env);
      if (res.ok) ctx.waitUntil(cache.put(cacheKey, res.clone()));
      return res;
    } catch (err) {
      console.error("og error", err);
      return new Response("render failed", { status: 500 });
    }
  },

  async scheduled(ev: ScheduledController, env: Env, ctx: ExecutionContext) {
    const d = db(env);
    const run = async () => {
      if (env.CONTENT_BASE_URL) {
        try {
          const r = await syncContent(d, env.CONTENT_BASE_URL, { token: env.CONTENT_TOKEN });
          console.log("content sync", JSON.stringify(r));
        } catch (e) {
          console.error("content sync failed", (e as Error).message);
        }
      }
      if (ev.cron === DAILY_CRON) {
        // Keep a pick set by hand in the admin page ahead of time.
        const p = await setDailyPick(d, dayInTz(env.SITE_TZ || "Asia/Kolkata"), false);
        console.log("daily pick", JSON.stringify(p));
      }
    };
    ctx.waitUntil(run());
  },
};
