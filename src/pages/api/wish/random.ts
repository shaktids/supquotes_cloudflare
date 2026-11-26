import type { APIRoute } from "astro";
import { randomWish } from "../../../lib/db";

export const GET: APIRoute = async ({ url }) => {
  const w = await randomWish(url.searchParams.get("occasion"), Number(url.searchParams.get("exclude")) || null);
  if (!w) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(w, { headers: { "Cache-Control": "no-store" } });
};
