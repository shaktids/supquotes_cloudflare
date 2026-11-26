import type { APIRoute } from "astro";
import { db } from "../../../../lib/db";
import { isAdmin, unauthorized } from "../../../../lib/auth";
import { ENTITIES, cleanRow } from "../../../../lib/admin-schema";

// PUT /api/admin/:entity/:id  → update (partial)
export const PUT: APIRoute = async ({ params, request }) => {
  if (!isAdmin(request)) return unauthorized();
  const e = ENTITIES[params.entity!];
  if (!e) return Response.json({ error: "unknown entity" }, { status: 404 });
  try {
    const body = await request.json();
    const row = cleanRow(e, body, true);
    if (!e.pkAuto) delete row[e.pk]; // natural keys are not editable
    const cols = Object.keys(row);
    if (!cols.length) return Response.json({ error: "nothing to update" }, { status: 400 });
    const r = await db().execute({
      sql: `UPDATE ${e.table} SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE ${e.pk} = ?`,
      args: [...Object.values(row), params.id!],
    });
    if (!r.rowsAffected) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
};

// DELETE /api/admin/:entity/:id
export const DELETE: APIRoute = async ({ params, request }) => {
  if (!isAdmin(request)) return unauthorized();
  const e = ENTITIES[params.entity!];
  if (!e) return Response.json({ error: "unknown entity" }, { status: 404 });
  const r = await db().execute({ sql: `DELETE FROM ${e.table} WHERE ${e.pk} = ?`, args: [params.id!] });
  if (!r.rowsAffected) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
};
