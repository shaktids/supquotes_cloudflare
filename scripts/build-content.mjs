// Builds generated/content.json from the content/ folder. The site and the OG worker bundle that file,
// so there is no database: to change content, edit content/ and redeploy (git push).
//   node scripts/build-content.mjs           build once (fails on errors)
//   node scripts/build-content.mjs --watch   rebuild on every change (dev)
// Folder layout and formats: docs/content-format.md
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, watch, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { LIMITS, classify, cleanText, parseFile, slugify, titleCase } from "./content-parse.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_DIR = join(ROOT, "content");
export const OUT_FILE = join(ROOT, "generated", "content.json");

/** Everyday wish occasions, shown first in this order. */
const EVERYDAY = ["birthday", "anniversary", "good-morning", "good-night", "congratulations", "get-well"];

/** Display names where title-casing the slug isn't right. A wish file's `name:` overrides these. */
const LABELS = {
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

const shortId = (prefix, text) => createHash("sha1").update(`${prefix}:${text}`).digest("hex").slice(0, 8);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const rel = (p) => relative(CONTENT_DIR, p).split(sep).join("/");

function listFiles(dir, depth = 0) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .filter((n) => !n.startsWith("."))
    .flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return depth < 1 ? listFiles(p, depth + 1) : [];
      return [p];
    });
}

function readYaml(file) {
  if (!existsSync(file)) return null;
  try {
    return parseYaml(readFileSync(file, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`${rel(file)}: ${e.message}`);
  }
}

export function buildContent({ write = true } = {}) {
  const errors = [];
  const warnings = [];
  const topics = new Map(); // slug -> {slug, name, emoji}
  const authors = new Map(); // slug -> name
  const quotes = [];
  const wishes = [];
  const seenQuote = new Map(); // text -> file
  const seenWish = new Map();
  const occasionNames = new Map();

  // ---- quotes/ and wishes/ ----
  for (const top of ["quotes", "wishes"]) {
    for (const file of listFiles(join(CONTENT_DIR, top))) {
      const path = rel(file);
      const c = classify(path);
      if (!c) {
        warnings.push(`${path}: skipped (use .txt, .csv or .yaml, at most one folder deep)`);
        continue;
      }
      let parsed;
      try {
        const body = readFileSync(file, "utf8");
        if (body.length > LIMITS.fileBytes) throw new Error(`file is over ${LIMITS.fileBytes / 1_000_000} MB; split it`);
        parsed = parseFile(body, c.ext, c.kind);
      } catch (e) {
        errors.push(`${path}: ${e.message}`);
        continue;
      }
      if (c.kind === "quotes") {
        const t = topics.get(c.category) ?? { slug: c.category, name: titleCase(c.category), emoji: null };
        if (parsed.name) t.name = parsed.name;
        if (parsed.emoji) t.emoji = parsed.emoji;
        topics.set(c.category, t);
      } else if (parsed.name) {
        occasionNames.set(c.category, parsed.name);
      }
      for (const it of parsed.items) {
        if (!it.active) continue;
        const text = cleanText(it.text);
        if (!text) continue;
        if (text.length > LIMITS.textChars) {
          warnings.push(`${path}: skipped an entry of ${text.length} characters (max ${LIMITS.textChars})`);
          continue;
        }
        const lang = slugify(it.lang || "en").slice(0, 10) || "en";
        if (c.kind === "quotes") {
          if (seenQuote.has(text)) {
            warnings.push(`${path}: duplicate of a quote in ${seenQuote.get(text)} (kept the first)`);
            continue;
          }
          seenQuote.set(text, path);
          const author = it.author ? cleanText(it.author).slice(0, LIMITS.authorChars) || null : null;
          const authorSlug = author ? slugify(author) || null : null;
          if (authorSlug) authors.set(authorSlug, author);
          quotes.push({ id: shortId("q", text), text, author, authorSlug, topic: c.category, lang });
        } else {
          if (seenWish.has(text)) {
            warnings.push(`${path}: duplicate of a wish in ${seenWish.get(text)} (kept the first)`);
            continue;
          }
          seenWish.set(text, path);
          if (!text.includes("{name}")) warnings.push(`${path}: a wish has no {name}; it shows as written`);
          wishes.push({ id: shortId("w", text), text, occasion: c.category, lang });
        }
      }
    }
  }

  // Short ids must be unique (they appear in share links).
  for (const list of [quotes, wishes]) {
    const ids = new Set();
    for (const x of list) {
      if (ids.has(x.id)) errors.push(`id collision for "${x.text.slice(0, 40)}…": reword it slightly`);
      ids.add(x.id);
    }
  }

  // ---- festivals.yaml ----
  const festivals = [];
  let festDoc = [];
  try {
    festDoc = readYaml(join(CONTENT_DIR, "festivals.yaml")) ?? [];
  } catch (e) {
    errors.push(e.message);
  }
  if (!Array.isArray(festDoc)) errors.push("festivals.yaml: expected a list of entries");
  else {
    const slugs = new Set();
    festDoc.forEach((f, i) => {
      const where = `festivals.yaml entry ${i + 1}${f?.slug ? ` (${f.slug})` : ""}`;
      if (!f || typeof f !== "object") return errors.push(`${where}: not an entry`);
      const slug = slugify(f.slug), occasion = slugify(f.occasion);
      const starts = String(f.starts ?? ""), ends = String(f.ends ?? f.starts ?? "");
      if (!slug || !f.name || !occasion) return errors.push(`${where}: needs slug, name and occasion`);
      if (!isDate(starts) || !isDate(ends)) return errors.push(`${where}: starts/ends must be YYYY-MM-DD`);
      if (ends < starts) return errors.push(`${where}: ends is before starts`);
      if (slugs.has(slug)) return errors.push(`${where}: duplicate slug`);
      slugs.add(slug);
      if (f.active === false) return;
      festivals.push({
        slug, name: String(f.name), occasion, starts, ends,
        headline: f.headline ? String(f.headline) : null,
        accent: f.accent ? String(f.accent) : null,
        art: f.art ? String(f.art) : null,
        priority: Number(f.priority) || 0,
      });
    });
  }
  festivals.sort((a, b) => a.starts.localeCompare(b.starts));

  // ---- templates.yaml ----
  const templates = [];
  let tplDoc = [];
  try {
    tplDoc = readYaml(join(CONTENT_DIR, "templates.yaml")) ?? [];
  } catch (e) {
    errors.push(e.message);
  }
  if (!Array.isArray(tplDoc)) errors.push("templates.yaml: expected a list of entries");
  else {
    const ids = new Set();
    tplDoc.forEach((t, i) => {
      const where = `templates.yaml entry ${i + 1}${t?.name ? ` (${t.name})` : ""}`;
      if (!t?.name || !t.layout || typeof t.layout !== "object") return errors.push(`${where}: needs name and layout`);
      const id = slugify(t.name);
      if (ids.has(id)) return errors.push(`${where}: duplicate name`);
      ids.add(id);
      const kind = ["quote", "wish", "any"].includes(t.kind) ? t.kind : "any";
      if (t.active === false) return;
      templates.push({ id, name: String(t.name), kind, occasion: t.occasion ? slugify(t.occasion) : null, bg: t.bg ? String(t.bg) : null, sort: Number(t.sort) || 0, layout: t.layout });
    });
  }
  templates.sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));

  // ---- derived lists ----
  const festivalOccasions = new Set(festivals.map((f) => f.occasion));
  const topicList = [...topics.values()]
    .filter((t) => quotes.some((q) => q.topic === t.slug))
    .map((t) => ({ ...t, isOccasion: festivalOccasions.has(t.slug) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const occasions = [...new Set(wishes.map((w) => w.occasion))].map((key) => ({
    key,
    label: occasionNames.get(key) ?? LABELS[key] ?? titleCase(key),
    everyday: EVERYDAY.includes(key),
  }));
  for (const f of festivals) {
    if (!topics.has(f.occasion) && !occasions.some((o) => o.key === f.occasion)) {
      warnings.push(`festival ${f.slug}: no wishes/${f.occasion} or quotes/${f.occasion} yet`);
    }
  }
  if (!quotes.length) errors.push("no quotes found in content/quotes/");
  if (!templates.length) errors.push("no templates in content/templates.yaml");

  const data = {
    quotes,
    wishes,
    topics: topicList,
    authors: Object.fromEntries([...authors].sort()),
    occasions,
    festivals,
    templates,
  };
  const stats = { quotes: quotes.length, wishes: wishes.length, topics: topicList.length, occasions: occasions.length, festivals: festivals.length, templates: templates.length };

  if (errors.length) {
    const err = new Error(`content has ${errors.length} error(s):\n  - ${errors.join("\n  - ")}`);
    err.warnings = warnings;
    throw err;
  }
  if (write) {
    mkdirSync(dirname(OUT_FILE), { recursive: true });
    const json = JSON.stringify(data);
    const prev = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, "utf8") : "";
    if (json !== prev) writeFileSync(OUT_FILE, json); // unchanged → don't trigger a reload
  }
  return { stats, warnings };
}

function report({ stats, warnings }) {
  for (const w of warnings) console.warn(`  ! ${w}`);
  console.log(
    `content: ${stats.quotes} quotes in ${stats.topics} topics, ${stats.wishes} wishes for ${stats.occasions} occasions, ` +
      `${stats.festivals} festival dates, ${stats.templates} templates → generated/content.json`,
  );
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const run = () => {
    try {
      report(buildContent());
      return true;
    } catch (e) {
      for (const w of e.warnings ?? []) console.warn(`  ! ${w}`);
      console.error(e.message);
      return false;
    }
  };
  const ok = run();
  if (process.argv.includes("--watch")) {
    console.log(`watching ${rel(CONTENT_DIR) || "content/"} for changes…`);
    let timer;
    watch(CONTENT_DIR, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(run, 150);
    });
  } else if (!ok) process.exit(1);
}
