import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { db } from "../../../lib/db";
import { isAdmin, unauthorized } from "../../../lib/auth";
import { syncContent } from "../../../../shared/content-sync";

// POST /api/admin/sync {force?: boolean} → import quotes/wishes from CONTENT_BASE_URL now.
export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  if (!env.CONTENT_BASE_URL) {
    return Response.json({ error: "CONTENT_BASE_URL is not set in wrangler.jsonc / .dev.vars" }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { force?: boolean };
  try {
    const report = await syncContent(db(), env.CONTENT_BASE_URL, { token: env.CONTENT_TOKEN, force: !!body.force });
    return Response.json({ ok: true, report }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
};
