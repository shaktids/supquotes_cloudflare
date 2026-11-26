// Parsers for content files (.txt / .csv / .yaml). Used by scripts/build-content.mjs.
// Format guide: docs/content-format.md
import { parse as parseYaml } from "yaml";

export const LIMITS = { fileBytes: 1_000_000, textChars: 500, authorChars: 100 };
const EXTS = ["txt", "csv", "yaml", "yml"];

export const slugify = (s) =>
  String(s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const titleCase = (slug) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** "quotes/love.csv" → {kind: "quotes", category: "love", ext: "csv"}; "quotes/love/rumi.yaml" → same category. */
export function classify(path) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length < 2 || parts.length > 3) return null;
  const kind = parts[0] === "quotes" ? "quotes" : parts[0] === "wishes" ? "wishes" : null;
  const ext = (parts[parts.length - 1].match(/\.([a-z]+)$/i)?.[1] ?? "").toLowerCase();
  if (!kind || !EXTS.includes(ext)) return null;
  const category = slugify(parts.length === 3 ? parts[1] : parts[1].replace(/\.[^.]+$/, ""));
  return category ? { kind, category, ext } : null;
}

export function cleanText(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“”'‘’]+|["“”'‘’]+$/g, "")
    .trim();
}

const AUTHOR_SEPARATORS = [" — ", " ― ", " – ", " -- ", " | ", " - "];
/** "Quote text — Author" → [text, author]. The author part must look like a name (short, no full stop). */
export function splitAuthor(line) {
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

const truthy = (v) => !/^(0|no|false|n|off)$/i.test(String(v ?? "").trim());

function parseTxt(body, kind) {
  const items = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [text, author] = kind === "quotes" ? splitAuthor(line) : [line, null];
    items.push({ text, author, lang: "en", active: true });
  }
  return { items };
}

/** RFC 4180 CSV (quoted fields, "" escapes, newlines inside quotes). */
function csvRows(body) {
  const rows = [];
  let row = [], field = "", q = false;
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

function parseCsv(body) {
  const rows = csvRows(body);
  if (!rows.length) return { items: [] };
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = head.includes("text") || head.includes("quote") || head.includes("wish");
  const col = (names, fallback) => (hasHeader ? head.findIndex((h) => names.includes(h)) : fallback);
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

function parseYamlFile(body, kind) {
  const doc = parseYaml(body, { maxAliasCount: 10 });
  const obj = Array.isArray(doc) ? { [kind]: doc } : doc ?? {};
  const list = obj[kind] ?? obj.items ?? [];
  if (!Array.isArray(list)) throw new Error(`expected a list under "${kind}:"`);
  const defAuthor = typeof obj.author === "string" ? obj.author : null;
  const defLang = typeof obj.lang === "string" ? obj.lang : "en";
  const items = list.map((it) => {
    if (typeof it === "string") {
      const [text, author] = kind === "quotes" ? splitAuthor(it) : [it, null];
      return { text, author: author ?? defAuthor, lang: defLang, active: true };
    }
    const o = it ?? {};
    return {
      text: String(o.text ?? o.quote ?? o.wish ?? ""),
      author: o.author ?? defAuthor,
      lang: o.lang ?? defLang,
      active: o.active === undefined ? true : truthy(o.active),
    };
  });
  const name = obj.name ?? obj.topic ?? obj.occasion;
  return { name: typeof name === "string" ? name : undefined, emoji: typeof obj.emoji === "string" ? obj.emoji : undefined, items };
}

/** Parse a content file body into {name?, emoji?, items: [{text, author, lang, active}]}. */
export function parseFile(body, ext, kind) {
  body = body.replace(/^﻿/, "");
  if (ext === "csv") return parseCsv(body);
  if (ext === "yaml" || ext === "yml") return parseYamlFile(body, kind);
  return parseTxt(body, kind);
}
