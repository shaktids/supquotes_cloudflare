import type { APIRoute } from "astro";
import { db } from "../../../../lib/db";
import { isAdmin, unauthorized } from "../../../../lib/auth";
import { ENTITIES, cleanRow } from "../../../../lib/admin-schema";

const noStore = { "Cache-Control": "no-store" };

// GET /api/admin/:entity?q=&offset=  → rows
export const GET: APIRoute = async ({ params, url, request }) => {
  if (!isAdmin(request)) return unauthorized();
  const e = ENTITIES[params.entity!];
  if (!e) return Response.json({ error: "unknown entity" }, { status: 404 });
  const q = url.searchParams.get("q")?.trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const where = q ? `WHERE ${e.search.map((c) => `${c} LIKE ?`).join(" OR ")}` : "";
  const args = q ? e.search.map(() => `%${q}%`) : [];
  const r = await db().execute({ sql: `SELECT * FROM ${e.table} ${where} ORDER BY ${e.order} LIMIT 100 OFFSET ?`, args: [...args, offset] });
  const total = await db().execute({ sql: `SELECT count(*) AS n FROM ${e.table} ${where}`, args });
  return Response.json({ rows: r.rows, total: Number(total.rows[0].n) }, { headers: noStore });
};

// POST /api/admin/:entity  → create
export const POST: APIRoute = async ({ params, request }) => {
  if (!isAdmin(request)) return unauthorized();
  const e = ENTITIES[params.entity!];
  if (!e) return Response.json({ error: "unknown entity" }, { status: 404 });
  try {
    const row = cleanRow(e, await request.json(), false);
    const cols = Object.keys(row);
    const r = await db().execute({
      sql: `INSERT INTO ${e.table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      args: Object.values(row),
    });
    const id = e.pkAuto ? Number(r.lastInsertRowid) : row[e.pk];
    return Response.json({ ok: true, id }, { status: 201, headers: noStore });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
};
