// Tiny local stand-in for Turso: speaks the Hrana v2 HTTP protocol that @libsql/client/web uses,
// backed by a local SQLite file. Dev only — no auth, single process.
//   node scripts/local-db-server.mjs [--port 8787] [--file supquotes.local.db]
import http from "node:http";
import { createClient } from "@libsql/client";

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const port = Number(opt("--port", 8787));
const file = opt("--file", "supquotes.local.db");
const db = createClient({ url: `file:${file}` });

const decodeVal = (v) => {
  switch (v?.type) {
    case "null": return null;
    case "integer": return BigInt(v.value);
    case "float": return Number(v.value);
    case "text": return v.value;
    case "blob": return Buffer.from(v.base64, "base64");
    default: return null;
  }
};
const encodeVal = (v) => {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "bigint") return { type: "integer", value: v.toString() };
  if (typeof v === "number") return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: v };
  if (typeof v === "string") return { type: "text", value: v };
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) return { type: "blob", base64: Buffer.from(v).toString("base64") };
  return { type: "text", value: String(v) };
};

// Statements stored with `store_sql` and referenced later by `sql_id`.
const storedSql = new Map();
const sqlOf = (stmt) => stmt.sql ?? storedSql.get(stmt.sql_id);

function argsOf(stmt) {
  return stmt.named_args?.length
    ? Object.fromEntries(stmt.named_args.map((a) => [a.name.replace(/^[:@$]/, ""), decodeVal(a.value)]))
    : (stmt.args ?? []).map(decodeVal);
}

const toResult = (rs, wantRows) => ({
  cols: rs.columns.map((name, i) => ({ name, decltype: rs.columnTypes?.[i] || null })),
  rows: wantRows === false ? [] : rs.rows.map((r) => rs.columns.map((_, i) => encodeVal(r[i]))),
  affected_row_count: rs.rowsAffected,
  last_insert_rowid: rs.lastInsertRowid == null ? null : String(rs.lastInsertRowid),
});

async function execStmt(stmt) {
  const sql = sqlOf(stmt);
  if (sql == null) throw new Error(`unknown sql_id ${stmt.sql_id}`);
  return toResult(await db.execute({ sql, args: argsOf(stmt) }), stmt.want_rows);
}

const errOf = (e) => ({ message: String(e?.message ?? e), code: e?.code ?? "SQLITE_ERROR" });

const TX_CONTROL = /^\s*(BEGIN|COMMIT|END|ROLLBACK)\b/i;

// The node file client can't hold a transaction open across execute() calls, so a client-side
// transactional batch (BEGIN … COMMIT / ROLLBACK) runs as one db.batch() transaction instead.
async function runBatch(batch) {
  const steps = batch.steps;
  const isTx = steps.length >= 2 && /^\s*BEGIN/i.test(sqlOf(steps[0].stmt) ?? "");
  if (!isTx) return runBatchSteps(steps);
  const dataIdx = steps.map((s, i) => (TX_CONTROL.test(sqlOf(s.stmt) ?? "") ? -1 : i)).filter((i) => i >= 0);
  const step_results = steps.map(() => null), step_errors = steps.map(() => null);
  try {
    const results = await db.batch(dataIdx.map((i) => ({ sql: sqlOf(steps[i].stmt), args: argsOf(steps[i].stmt) })), "write");
    dataIdx.forEach((i, k) => (step_results[i] = toResult(results[k], steps[i].stmt.want_rows)));
    steps.forEach((s, i) => {
      if (/^\s*(BEGIN|COMMIT|END)/i.test(sqlOf(s.stmt) ?? "")) step_results[i] = toResult({ columns: [], rows: [], rowsAffected: 0 }, false);
    });
  } catch (e) {
    step_results[0] = toResult({ columns: [], rows: [], rowsAffected: 0 }, false);
    step_errors[dataIdx[0] ?? 0] = errOf(e);
  }
  return { step_results, step_errors };
}

async function runBatchSteps(stepsIn) {
  const step_results = [], step_errors = [];
  for (const step of stepsIn) {
    const ok = (i) => step_results[i] != null;
    const cond = (c) => {
      if (!c) return true;
      if (c.type === "ok") return ok(c.step);
      if (c.type === "error") return step_errors[c.step] != null;
      if (c.type === "not") return !cond(c.cond);
      if (c.type === "and") return c.conds.every(cond);
      if (c.type === "or") return c.conds.some(cond);
      if (c.type === "is_autocommit") return true;
      return true;
    };
    if (!cond(step.condition)) { step_results.push(null); step_errors.push(null); continue; }
    try { step_results.push(await execStmt(step.stmt)); step_errors.push(null); }
    catch (e) { step_results.push(null); step_errors.push(errOf(e)); }
  }
  return { step_results, step_errors };
}

async function handleRequest(req) {
  try {
    switch (req.type) {
      case "execute": return { type: "ok", response: { type: "execute", result: await execStmt(req.stmt) } };
      case "batch": return { type: "ok", response: { type: "batch", result: await runBatch(req.batch) } };
      case "sequence": await db.executeMultiple(req.sql); return { type: "ok", response: { type: "sequence" } };
      case "store_sql": storedSql.set(req.sql_id, req.sql); return { type: "ok", response: { type: "store_sql" } };
      case "close_sql": storedSql.delete(req.sql_id); return { type: "ok", response: { type: "close_sql" } };
      case "close": return { type: "ok", response: { type: "close" } };
      case "get_autocommit": return { type: "ok", response: { type: "get_autocommit", is_autocommit: true } };
      default: return { type: "error", error: { message: `unsupported request ${req.type}` } };
    }
  } catch (e) {
    return { type: "error", error: errOf(e) };
  }
}

http
  .createServer(async (req, res) => {
    const send = (code, body) => {
      res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/v2") return send(200, {});
    if (req.method === "GET" && req.url === "/health") return send(200, { ok: true });
    if (req.method === "POST" && req.url === "/v2/pipeline") {
      let raw = "";
      for await (const c of req) raw += c;
      const body = JSON.parse(raw || "{}");
      const results = [];
      for (const r of body.requests ?? []) results.push(await handleRequest(r));
      return send(200, { baton: null, base_url: null, results });
    }
    send(404, { error: "not found" });
  })
  .listen(port, "127.0.0.1", () => console.log(`local Turso shim: http://127.0.0.1:${port} -> ${file}`));
