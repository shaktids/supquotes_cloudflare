import type { APIRoute } from "astro";
import { db } from "../../../lib/db";
import { isAdmin, unauthorized } from "../../../lib/auth";
import { importUploaded, LIMITS } from "../../../../shared/content-sync";

const MAX_BODY = 5_000_000; // whole upload, bytes

// POST /api/admin/import {files: [{path, body}], fullSet?: boolean, force?: boolean}
// Imports quote/wish files uploaded from the admin page. Same formats as docs/content-format.md.
export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) return Response.json({ error: `upload too large (max ${MAX_BODY / 1_000_000} MB per upload)` }, { status: 413 });
  let body: { files?: { path: string; body: string }[]; fullSet?: boolean; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "expected JSON" }, { status: 400 });
  }
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length) return Response.json({ error: "no files" }, { status: 400 });
  if (files.length > LIMITS.files) return Response.json({ error: `max ${LIMITS.files} files per upload` }, { status: 400 });
  try {
    const report = await importUploaded(db(), files, { fullSet: !!body.fullSet, force: !!body.force });
    return Response.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
};
