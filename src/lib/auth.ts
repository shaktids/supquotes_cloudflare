import { env } from "cloudflare:workers";

/** Constant-time check of `Authorization: Bearer <ADMIN_TOKEN>`. */
export function isAdmin(request: Request): boolean {
  const expected = env.ADMIN_TOKEN;
  // Refuse the placeholder token outside local dev.
  if (!expected || (expected === "change-me" && !import.meta.env.DEV)) return false;
  const got = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = new TextEncoder().encode(got);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401 });
