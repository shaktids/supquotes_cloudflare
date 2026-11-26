import type { APIRoute } from "astro";
import { randomQuote } from "../../../lib/content";

export const GET: APIRoute = async ({ url }) => {
  const q = await randomQuote(url.searchParams.get("topic"), url.searchParams.get("exclude"));
  if (!q) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(q, { headers: { "Cache-Control": "no-store" } });
};
