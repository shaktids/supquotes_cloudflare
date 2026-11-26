// Imports quotes and wishes from plain files on any HTTPS storage into Turso.
// Format: docs/content-format.md. Used by the edge cron and the admin "Sync now" button.
//
//   <CONTENT_BASE_URL>/index.txt                    list of files to import (one path per line)
//   <CONTENT_BASE_URL>/quotes/<topic>.txt|csv|yaml   → quotes in topic <topic>
//   <CONTENT_BASE_URL>/quotes/<topic>/<any>.ext      → same, several files per topic
//   <CONTENT_BASE_URL>/wishes/<occasion>.ext         → wishes for <occasion>
//   <CONTENT_BASE_URL>/wishes/<occasion>/<any>.ext
//
// Rules: rows from a file are tagged with source = its path. When a file changes, rows from it that
// are no longer in the file are deactivated; when a file leaves index.txt, all its rows are
// deactivated. Rows added in /admin or by the seed (source NULL) are never touched.
import { parse as parseYaml } from "yaml";
import type { Client, InStatement } from "@libsql/client/web";

export const LIMITS = { fileBytes: 1_000_000, itemsPerFile: 2000, textChars: 500, authorChars: 100, files: 200 };
const EXTS = ["txt", "csv", "yaml", "yml"] as const;

export interface SyncReport {
  files: number;
  changed: number;
  unchanged: number;
  removed: number;
  quotes: number;
  wishes: number;
  errors: { path: string; error: string }[];
  warnings: string[];
}

interface Item { text: string; author: string | null; lang: string; active: boolean }
interface Parsed { name?: string; emoji?: string; items: Item[] }
type Kind = "quotes" | "wishes";

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
const titleCase = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** quotes/love.csv → {kind: quotes, category: love}; quotes/love/rumi.yaml → same. */
export function classify(path: string): { kind: Kind; category: string; ext: string } | null {
  if (path.includes("..") || path.startsWith("/")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;
  const kind = parts[0] === "quotes" ? "quotes" : parts[0] === "wishes" ? "wishes" : null;
  const ext = (parts[parts.length - 1].match(/\.([a-z]+)$/i)?.[1] ?? "").toLowerCase();
  if (!kind || !(EXTS as readonly string[]).includes(ext)) return null;
  const category = slugify(parts.length === 3 ? parts[1] : parts[1].replace(/\.[^.]+$/, ""));
  return category ? { kind, category, ext } : null;
}

// ---------- parsing ----------

function cleanText(s: unknown): string {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
    .trim();
}

const AUTHOR_SEPARATORS = [" — ", " ― ", " – ", " -- ", " | ", " - "];
/** "Quote text — Author" → [text, author]. The author part must look like a name (short, no full stop). */
function splitAuthor(line: string): [string, string | null] {
  for (const sep of AUTHOR_SEPARATORS) {
    const i = line.lastIndexOf(sep);
    if (i <= 0) continue;
    const author = line.slice(i + sep.length).trim();
    if (author && author.length <= LIMITS.authorChars && author.split(/\s+/).length <= 6 && !/[.!?]$/.test(author)) {
      return [line.slice(0, i), author];
    }
  }
  return [line, null];
}

function parseTxt(body: string, kind: Kind): Parsed {
  const items: Item[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [text, author] = kind === "quotes" ? splitAuthor(line) : [line, null];
    items.push({ text, author, lang: "en", active: true });
  }
  return { items };
}

/** RFC 4180 CSV (quoted fields, "" escapes, newlines inside quotes). */
function csvRows(body: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", q = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (q) {
      if (c === '"') {
        if (body[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && body[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

const truthy = (v: unknown) => !/^(0|no|false|n|off)$/i.test(String(v ?? "").trim());

function parseCsv(body: string): Parsed {
  const rows = csvRows(body);
  if (!rows.length) return { items: [] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = head.includes("text") || head.includes("quote") || head.includes("wish");
  const col = (names: string[], fallback: number) => {
    const i = head.findIndex((h) => names.includes(h));
    return hasHeader ? i : fallback;
  };
  const ti = col(["text", "quote", "wish"], 0), ai = col(["author", "by"], 1), li = col(["lang", "language"], -1), xi = col(["active", "enabled"], -1);
  return {
    items: rows.slice(hasHeader ? 1 : 0).map((r) => ({
      text: r[ti] ?? "",
      author: ai >= 0 ? r[ai] || null : null,
      lang: (li >= 0 && r[li]?.trim()) || "en",
      active: xi >= 0 ? truthy(r[xi]) : true,
    })),
  };
}

function parseYamlFile(body: string, kind: Kind): Parsed {
  const doc = parseYaml(body, { maxAliasCount: 10 }) as unknown;
  const obj = (Array.isArray(doc) ? { [kind]: doc } : doc ?? {}) as Record<string, unknown>;
  const list = (obj[kind] ?? obj.items ?? []) as unknown[];
  if (!Array.isArray(list)) throw new Error(`expected a list under "${kind}:"`);
  const defAuthor = typeof obj.author === "string" ? obj.author : null;
  const defLang = typeof obj.lang === "string" ? obj.lang : "en";
  const items = list.map((it): Item => {
    if (typeof it === "string") {
      const [text, author] = kind === "quotes" ? splitAuthor(it) : [it, null];
      return { text, author: author ?? defAuthor, lang: defLang, active: true };
    }
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      text: String(o.text ?? o.quote ?? o.wish ?? ""),
      author: (o.author as string) ?? defAuthor,
      lang: (o.lang as string) ?? defLang,
      active: o.active === undefined ? true : truthy(o.active),
    };
  });
  const name = obj.name ?? obj.topic ?? obj.occasion;
  return { name: typeof name === "string" ? name : undefined, emoji: typeof obj.emoji === "string" ? obj.emoji : undefined, items };
}

export function parseFile(body: string, ext: string, kind: Kind): Parsed {
  body = body.replace(/^﻿/, "");
  if (ext === "csv") return parseCsv(body);
  if (ext === "yaml" || ext === "yml") return parseYamlFile(body, kind);
  return parseTxt(body, kind);
}

// ---------- sync ----------

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function statementsFor(kind: Kind, category: string, path: string, parsed: Parsed, hash: string, report: SyncReport): InStatement[] {
  const stmts: InStatement[] = [];
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const it of parsed.items) {
    const text = cleanText(it.text);
    if (!text) continue;
    if (text.length > LIMITS.textChars) { report.warnings.push(`${path}: skipped a ${text.length}-character entry (max ${LIMITS.textChars})`); continue; }
    if (seen.has(text)) continue;
    seen.add(text);
    const author = it.author ? cleanText(it.author).slice(0, LIMITS.authorChars) || null : null;
    const lang = slugify(it.lang || "en").slice(0, 10) || "en";
    items.push({ text, author, lang, active: it.active });
    if (items.length >= LIMITS.itemsPerFile) { report.warnings.push(`${path}: only the first ${LIMITS.itemsPerFile} entries were imported; split the file`); break; }
  }
  if (kind === "wishes") {
    const missing = items.filter((i) => !i.text.includes("{name}")).length;
    if (missing) report.warnings.push(`${path}: ${missing} wish(es) without {name}; they will show as written`);
  }

  if (kind === "quotes") {
    stmts.push({ sql: "INSERT OR IGNORE INTO topics (slug, name, emoji) VALUES (?, ?, ?)", args: [category, parsed.name ?? titleCase(category), parsed.emoji ?? null] });
    if (parsed.name || parsed.emoji) {
      stmts.push({ sql: "UPDATE topics SET name = coalesce(?, name), emoji = coalesce(?, emoji) WHERE slug = ?", args: [parsed.name ?? null, parsed.emoji ?? null, category] });
    }
    for (const a of new Set(items.map((i) => i.author).filter(Boolean) as string[])) {
      stmts.push({ sql: "INSERT OR IGNORE INTO authors (slug, name) VALUES (?, ?)", args: [slugify(a) || "unknown", a] });
    }
    stmts.push({ sql: "UPDATE quotes SET is_active = 0 WHERE source = ?", args: [path] });
    for (const i of items) {
      stmts.push({
        sql: `INSERT INTO quotes (text, author_id, topic_id, lang, is_active, source)
              VALUES (?, (SELECT id FROM authors WHERE slug = ?), (SELECT id FROM topics WHERE slug = ?), ?, ?, ?)
              ON CONFLICT(text) DO UPDATE SET author_id = excluded.author_id, topic_id = excluded.topic_id,
                lang = excluded.lang, is_active = excluded.is_active, source = excluded.source`,
        args: [i.text, i.author ? slugify(i.author) || "unknown" : null, category, i.lang, i.active ? 1 : 0, path],
      });
    }
    report.quotes += items.length;
  } else {
    stmts.push({ sql: "UPDATE wishes SET is_active = 0 WHERE source = ?", args: [path] });
    for (const i of items) {
      stmts.push({
        sql: `INSERT INTO wishes (text, occasion, lang, is_active, source) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(text) DO UPDATE SET occasion = excluded.occasion, lang = excluded.lang,
                is_active = excluded.is_active, source = excluded.source`,
        args: [i.text, category, i.lang, i.active ? 1 : 0, path],
      });
    }
    report.wishes += items.length;
  }
  stmts.push({
    sql: `INSERT INTO content_files (path, hash, items, synced_at) VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(path) DO UPDATE SET hash = excluded.hash, items = excluded.items, synced_at = excluded.synced_at`,
    args: [path, hash, items.length],
  });
  return stmts;
}

export async function syncContent(db: Client, baseUrl: string, opts: { token?: string; force?: boolean } = {}): Promise<SyncReport> {
  const report: SyncReport = { files: 0, changed: 0, unchanged: 0, removed: 0, quotes: 0, wishes: 0, errors: [], warnings: [] };
  const base = baseUrl.replace(/\/+$/, "");
  const headers: Record<string, string> = opts.token ? { authorization: `Bearer ${opts.token}` } : {};
  const get = (p: string) => fetch(`${base}/${p.split("/").map(encodeURIComponent).join("/")}`, { headers, cache: "no-store" });

  const idx = await get("index.txt");
  if (!idx.ok) throw new Error(`index.txt: HTTP ${idx.status} from ${base}/index.txt`);
  const paths: string[] = [];
  for (const raw of (await idx.text()).replace(/^﻿/, "").split(/\r?\n/)) {
    const p = raw.trim().replace(/^\.\//, "");
    if (!p || p.startsWith("#")) continue;
    if (!classify(p)) { report.warnings.push(`index.txt: ignored "${p}" (must be quotes/… or wishes/… ending in .txt, .csv or .yaml)`); continue; }
    if (!paths.includes(p)) paths.push(p);
  }
  if (paths.length > LIMITS.files) {
    report.warnings.push(`index.txt lists ${paths.length} files; only the first ${LIMITS.files} are synced per run`);
    paths.length = LIMITS.files;
  }

  const known = new Map(
    (await db.execute("SELECT path, hash FROM content_files")).rows.map((r) => [String(r.path), String(r.hash)]),
  );

  for (const path of paths) {
    report.files++;
    try {
      const res = await get(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const len = Number(res.headers.get("content-length") ?? 0);
      if (len > LIMITS.fileBytes) throw new Error(`file is ${len} bytes (max ${LIMITS.fileBytes})`);
      await importOne(db, path, await res.text(), known, !!opts.force, report);
    } catch (e) {
      report.errors.push({ path, error: (e as Error).message });
    }
  }

  // Files dropped from index.txt: hide their rows.
  await removeMissing(db, known, paths, report);
  return report;
}

/** Parse one file body and write it (skipped if its checksum hasn't changed). */
async function importOne(db: Client, path: string, body: string, known: Map<string, string>, force: boolean, report: SyncReport) {
  const c = classify(path);
  if (!c) throw new Error("path must be quotes/… or wishes/… ending in .txt, .csv or .yaml");
  if (body.length > LIMITS.fileBytes) throw new Error(`file is too large (max ${LIMITS.fileBytes} bytes)`);
  const hash = await sha256(body);
  if (!force && known.get(path) === hash) { report.unchanged++; return; }
  const parsed = parseFile(body, c.ext, c.kind);
  await db.batch(statementsFor(c.kind, c.category, path, parsed, hash, report), "write");
  report.changed++;
}

/** Hide rows of previously imported files that are not in `present`. */
async function removeMissing(db: Client, known: Map<string, string>, present: string[], report: SyncReport) {
  for (const path of known.keys()) {
    if (present.includes(path)) continue;
    await db.batch(
      [
        { sql: "UPDATE quotes SET is_active = 0 WHERE source = ?", args: [path] },
        { sql: "UPDATE wishes SET is_active = 0 WHERE source = ?", args: [path] },
        { sql: "DELETE FROM content_files WHERE path = ?", args: [path] },
      ],
      "write",
    );
    report.removed++;
  }
}

/**
 * Import files uploaded from the admin page (no external storage needed).
 * `fullSet`: the upload is the whole content folder, so previously imported files that are
 * missing from it get hidden (like removing them from index.txt).
 */
export async function importUploaded(
  db: Client,
  files: { path: string; body: string }[],
  opts: { fullSet?: boolean; force?: boolean } = {},
): Promise<SyncReport> {
  const report: SyncReport = { files: 0, changed: 0, unchanged: 0, removed: 0, quotes: 0, wishes: 0, errors: [], warnings: [] };
  if (files.length > LIMITS.files) throw new Error(`too many files (${files.length}); max ${LIMITS.files} per upload`);
  const known = new Map(
    (await db.execute("SELECT path, hash FROM content_files")).rows.map((r) => [String(r.path), String(r.hash)]),
  );
  const paths: string[] = [];
  for (const f of files) {
    const path = normalizeUploadPath(f.path);
    if (!path && /(^|\/)(index\.txt|\.[^/]*)$/i.test(String(f.path))) continue; // index.txt / hidden files: expected, not an error
    if (!path) { report.warnings.push(`ignored "${f.path}" (not inside quotes/ or wishes/, or not .txt/.csv/.yaml)`); continue; }
    if (paths.includes(path)) continue;
    paths.push(path);
    report.files++;
    try {
      await importOne(db, path, String(f.body ?? "").replace(/^﻿/, ""), known, !!opts.force, report);
    } catch (e) {
      report.errors.push({ path, error: (e as Error).message });
    }
  }
  if (opts.fullSet) await removeMissing(db, known, paths, report);
  return report;
}

/** "SupQuotes/quotes/love/rumi.yaml" or "quotes\\love.txt" → "quotes/love/rumi.yaml" style path, or null. */
export function normalizeUploadPath(raw: string): string | null {
  const parts = String(raw).replace(/\\/g, "/").split("/").filter((p) => p && p !== ".");
  const i = parts.findIndex((p) => p === "quotes" || p === "wishes");
  if (i < 0) return null;
  const path = parts.slice(i).join("/");
  return classify(path) ? path : null;
}
