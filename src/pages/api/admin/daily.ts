import type { APIRoute } from "astro";
import { db, siteTz } from "../../../lib/db";
import { isAdmin, unauthorized } from "../../../lib/auth";
import { dayInTz, setDailyPick } from "../../../../shared/daily";

// POST /api/admin/daily {day?: "YYYY-MM-DD"} → re-roll that day's pick (same logic as the cron).
export const POST: APIRoute = async ({ request }) => {
  if (!isAdmin(request)) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { day?: string };
  const day = body.day && /^\d{4}-\d{2}-\d{2}$/.test(body.day) ? body.day : dayInTz(siteTz());
  return Response.json({ ok: true, pick: await setDailyPick(db(), day, true) });
};
