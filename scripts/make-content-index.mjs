// Writes index.txt for a content folder (lists every quotes/… and wishes/… file the sync can read).
//   node scripts/make-content-index.mjs <folder>
// Run it after adding or removing files, then upload index.txt with them.
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.argv[2];
if (!root) { console.error("usage: node scripts/make-content-index.mjs <folder>"); process.exit(1); }
const OK = /\.(txt|csv|ya?ml)$/i;
const files = [];
const walk = (dir, depth) => {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (depth < 2) walk(p, depth + 1); }
    else if (OK.test(name)) files.push(relative(root, p).split(sep).join("/"));
  }
};
for (const top of ["quotes", "wishes"]) {
  try { walk(join(root, top), 1); } catch { /* folder missing */ }
}
writeFileSync(join(root, "index.txt"), `# Files for SupQuotes to import. Generated ${new Date().toISOString()}\n${files.join("\n")}\n`);
console.log(`index.txt: ${files.length} file(s)\n${files.map((f) => `  ${f}`).join("\n")}`);
