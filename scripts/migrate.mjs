// Apply db/schema.sql (and optionally db/seed.sql on an empty DB) to Turso or a local file.
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate.mjs [--seed]
//   node scripts/migrate.mjs --seed --url file:supquotes.local.db
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const argv = process.argv.slice(2);
const url = argv.includes("--url") ? argv[argv.indexOf("--url") + 1] : process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Set TURSO_DATABASE_URL or pass --url");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

await db.executeMultiple(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("schema applied");

// Columns added after the first release (CREATE TABLE IF NOT EXISTS doesn't add them to old tables).
for (const [table, column, ddl] of [
  ["quotes", "source", "ALTER TABLE quotes ADD COLUMN source TEXT"],
  ["wishes", "source", "ALTER TABLE wishes ADD COLUMN source TEXT"],
]) {
  const cols = await db.execute(`PRAGMA table_info(${table})`);
  if (!cols.rows.some((r) => r.name === column)) {
    await db.execute(ddl);
    console.log(`added ${table}.${column}`);
  }
}
await db.executeMultiple(`
  CREATE INDEX IF NOT EXISTS quotes_source ON quotes(source);
  CREATE INDEX IF NOT EXISTS wishes_source ON wishes(source);
`);

if (argv.includes("--seed")) {
  const { rows } = await db.execute("SELECT count(*) AS n FROM quotes");
  if (Number(rows[0].n) > 0) {
    console.log("quotes table not empty, skipping seed");
  } else {
    await db.executeMultiple(readFileSync(new URL("../db/seed.sql", import.meta.url), "utf8"));
    console.log("seed applied");
  }
  // Festivals, days, wishes and themed templates: idempotent, so it also tops up live databases.
  for (const f of ["seed-occasions.sql", "seed-international-days.sql"]) {
    await db.executeMultiple(readFileSync(new URL(`../db/${f}`, import.meta.url), "utf8"));
    console.log(`${f} applied`);
  }
}
db.close();
