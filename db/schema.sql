-- SupQuotes schema (Turso / libSQL). Idempotent: safe to run repeatedly.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS authors (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  bio         TEXT
);

CREATE TABLE IF NOT EXISTS topics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  emoji       TEXT
);

CREATE TABLE IF NOT EXISTS quotes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text        TEXT NOT NULL,
  author_id   INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  topic_id    INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  lang        TEXT NOT NULL DEFAULT 'en',
  is_active   INTEGER NOT NULL DEFAULT 1,
  source      TEXT,                         -- storage file path for synced rows; NULL = added in admin/seed
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS quotes_topic ON quotes(topic_id, is_active);
CREATE INDEX IF NOT EXISTS quotes_author ON quotes(author_id, is_active);

CREATE TABLE IF NOT EXISTS festivals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,          -- e.g. diwali-2027 (one row per occurrence)
  name        TEXT NOT NULL,                 -- e.g. Diwali
  occasion    TEXT NOT NULL,                 -- wish occasion key it maps to, e.g. diwali
  starts_on   TEXT NOT NULL,                 -- YYYY-MM-DD (site timezone)
  ends_on     TEXT NOT NULL,                 -- YYYY-MM-DD inclusive
  headline    TEXT,                          -- homepage hero line
  accent      TEXT,                          -- hex colour for the hero
  art_key     TEXT,                          -- Internxt object key for hero art (optional)
  priority    INTEGER NOT NULL DEFAULT 0,    -- higher wins when ranges overlap
  is_active   INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS festivals_range ON festivals(starts_on, ends_on);

-- Wish text contains a {name} placeholder that the visitor fills in.
CREATE TABLE IF NOT EXISTS wishes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text        TEXT NOT NULL,
  occasion    TEXT NOT NULL,                 -- birthday, anniversary, good-morning, diwali, ...
  lang        TEXT NOT NULL DEFAULT 'en',
  is_active   INTEGER NOT NULL DEFAULT 1,
  source      TEXT,                          -- storage file path for synced rows; NULL = added in admin/seed
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS wishes_occasion ON wishes(occasion, is_active);

-- layout_json is drawn by the browser canvas renderer and the OG worker (see shared/layout.ts).
-- bg_key is an optional Internxt object key used as background art.
CREATE TABLE IF NOT EXISTS templates (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'any',    -- quote | wish | any
  occasion    TEXT,                           -- restrict to an occasion (e.g. diwali); NULL = generic
  layout_json TEXT NOT NULL,
  bg_key      TEXT,
  sort        INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1
);

-- No duplicate content; also lets seed files use INSERT OR IGNORE safely on a live DB.
CREATE UNIQUE INDEX IF NOT EXISTS quotes_text_uq ON quotes(text);
CREATE UNIQUE INDEX IF NOT EXISTS wishes_text_uq ON wishes(text);
CREATE UNIQUE INDEX IF NOT EXISTS templates_name_uq ON templates(name);

-- Files imported from the content storage (see docs/content-format.md). hash = SHA-256 of the
-- last imported body, so unchanged files are skipped.
CREATE TABLE IF NOT EXISTS content_files (
  path        TEXT PRIMARY KEY,
  hash        TEXT NOT NULL,
  items       INTEGER NOT NULL DEFAULT 0,
  synced_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_picks (
  day         TEXT PRIMARY KEY,               -- YYYY-MM-DD (site timezone)
  quote_id    INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
  wish_id     INTEGER REFERENCES wishes(id) ON DELETE SET NULL,
  template_id INTEGER REFERENCES templates(id) ON DELETE SET NULL,
  festival_id INTEGER REFERENCES festivals(id) ON DELETE SET NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
