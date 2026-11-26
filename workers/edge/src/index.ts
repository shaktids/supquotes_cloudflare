// supquotes-edge: draws link-preview (OG) images. No database: content is bundled from
// generated/content.json (built from content/ by scripts/build-content.mjs).
//   GET /default.png
//   GET /q/:id.png[?t=templateId]
//   GET /w/:id.png[?name=Priya&t=templateId]
import { ImageResponse, loadGoogleFont } from "workers-og";
import raw from "../../../generated/content.json";
import { parseLayout, cssBackground, fillName, type Layout } from "../../../shared/layout";
import type { Content, Template } from "../../../shared/content";

export interface Env {
  MEDIA_BASE_URL: string;
}

const C = raw as unknown as Content;
const quoteById = new Map(C.quotes.map((q) => [q.id, q]));
const wishById = new Map(C.wishes.map((w) => [w.id, w]));
const tplById = new Map(C.templates.map((t) => [t.id, t]));

const W = 1200, H = 630;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The requested template, or the best default for this kind/occasion. */
function template(id: string | null, kind: "quote" | "wish", occasion: string | null) {
  let t: Template | undefined = id ? tplById.get(id) : undefined;
  if (!t) {
    const ok = C.templates.filter((x) => (x.kind === "any" || x.kind === kind) && (x.occasion == null || x.occasion === occasion));
    t = ok.find((x) => x.occasion === occasion) ?? ok[0];
  }
  return { layout: parseLayout(t ? JSON.stringify(t.layout) : null), bgKey: t?.bg ?? null };
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
  const t = url.searchParams.get("t");
  let m: RegExpMatchArray | null;

  if (url.pathname === "/" || url.pathname === "/default.png") {
    const { layout } = template(null, "quote", null);
    return card(env, layout, null, "Make a quote or wish card in seconds. Share it to your status.", "SupQuotes", true);
  }
  if ((m = url.pathname.match(/^\/q\/([a-z0-9]+)\.png$/))) {
    const q = quoteById.get(m[1]);
    if (!q) return new Response("not found", { status: 404 });
    const { layout, bgKey } = template(t, "quote", null);
    return card(env, layout, bgKey, q.text, q.author, true);
  }
  if ((m = url.pathname.match(/^\/w\/([a-z0-9]+)\.png$/))) {
    const w = wishById.get(m[1]);
    if (!w) return new Response("not found", { status: 404 });
    const { layout, bgKey } = template(t, "wish", w.occasion);
    return card(env, layout, bgKey, fillName(w.text, url.searchParams.get("name")), null, false);
  }
  return new Response("not found", { status: 404 });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method !== "GET") return new Response("method not allowed", { status: 405 });
    // Normalise the cache key to only the params we use.
    const url = new URL(req.url);
    const key = new URL(url.origin + url.pathname);
    for (const p of ["t", "name"]) if (url.searchParams.get(p)) key.searchParams.set(p, url.searchParams.get(p)!.slice(0, 60));
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
};
