# SupQuotes

Quote and wish card maker: pick a quote or write a wish with a name, choose a style, and share the card
to WhatsApp Status or Instagram.

- **Site:** Astro (SSR) on Cloudflare (Workers with static assets, via `@astrojs/cloudflare`).
- **Data:** Turso (libSQL), read directly from the site with `@libsql/client/web`.
- **Cards:** drawn on `<canvas>` in the visitor's browser and never stored.
- **Art:** Internxt → `rclone serve s3` → Cloudflare Tunnel → CDN. See [docs/media-gateway](docs/media-gateway/README.md).
- **Link previews:** `workers/edge` draws OG images (workers-og / satori).
- **Daily cron:** also in `workers/edge`. Fills `daily_picks` and switches the homepage when a festival is on.
- **Admin:** `/admin` (Bearer token).

## Layout

```
astro.config.mjs, wrangler.jsonc   site config (vars: MEDIA_BASE_URL, OG_BASE_URL, SITE_TZ)
db/schema.sql, db/seed.sql         Turso schema + starter content
shared/layout.ts                   template layout_json format (site + OG worker)
shared/daily.ts                    daily pick / festival logic (cron + site fallback)
src/lib/render.ts                  browser canvas renderer
src/components/Generator.astro     the quote/wish maker + share buttons
src/pages/                         /, /q/:id, /wish/:id, /topic/:slug, /author/:slug, /wishes/:occasion, /admin
src/pages/api/                     public random endpoints + admin CRUD
workers/edge/                      OG images + cron
scripts/local-db-server.mjs        local Turso stand-in for dev (Hrana v2 over a SQLite file)
```

## Local development

```powershell
npm install
copy .dev.vars.example .dev.vars
copy .dev.vars.example workers\edge\.dev.vars
node scripts/migrate.mjs --seed --url file:supquotes.local.db
```

Run each of these in its own terminal:

```powershell
npm run db:local
```

```powershell
npm run dev
```

```powershell
npm run edge:dev
```

The site runs at http://localhost:4321. Admin is at http://localhost:4321/admin, with the token from `.dev.vars` (`change-me`).
In dev, OG images come from http://127.0.0.1:8788. Trigger the cron with `curl "http://127.0.0.1:8788/__scheduled?cron=35+18+*+*+*"`.
Link previews point at `OG_BASE_URL`. For local testing, set it in `.dev.vars`: `OG_BASE_URL=http://127.0.0.1:8788`.

## Deploy

1. **Turso:** create the database, apply the schema and seed it:
   ```powershell
   turso db create supquotes
   ```
   ```powershell
   $env:TURSO_DATABASE_URL = (turso db show supquotes --url); $env:TURSO_AUTH_TOKEN = (turso db tokens create supquotes); npm run db:seed
   ```
2. **Site secrets:**
   ```powershell
   npx wrangler secret put TURSO_DATABASE_URL
   ```
   ```powershell
   npx wrangler secret put TURSO_AUTH_TOKEN
   ```
   ```powershell
   npx wrangler secret put ADMIN_TOKEN
   ```
   Use a long random value for `ADMIN_TOKEN`. The placeholder `change-me` is refused in production.
3. **Edge worker secrets:** same `TURSO_*` values, with `-c workers/edge/wrangler.jsonc`.
4. **Deploy:**
   ```powershell
   npm run deploy
   ```
   ```powershell
   npm run edge:deploy
   ```
5. In the Cloudflare dashboard, attach `supquotes.com` to the `supquotes` Worker (Settings → Domains & Routes).
   `og.supquotes.com` is attached by `workers/edge/wrangler.jsonc`.
6. Set up the media gateway: [docs/media-gateway](docs/media-gateway/README.md).

The cron runs at 18:35 UTC (00:05 IST). If it hasn't run yet, the homepage computes today's pick on first
visit. A pick you set by hand in `/admin` → Daily picks is never overwritten by the cron. "Re-roll today" does overwrite it.

## Sharing

There is one main **Share** button, plus a small WhatsApp icon and a "⋯" menu.

| Control | Phone | Desktop |
|---|---|---|
| **Share** | Opens the system share sheet with the card PNG (in the selected size) and the text + link as caption. WhatsApp → Status or chat, Instagram → Story, Telegram, etc. | No file share sheet, so it opens the ⋯ menu |
| WhatsApp icon | `wa.me` chat with the text and a link to `/q/:id` or `/wish/:id`. The link preview image is drawn by the edge worker | same |
| ⋯ menu | Download image, Copy link, Copy text, Send on WhatsApp | same |

The shared image uses the size picked in the preview. A tip under the button says to pick **Status 9:16**
for WhatsApp Status or an Instagram Story. Neither app has a web API that posts straight to Status or
Story; the system share sheet (Web Share API with files) is the supported route on phones.

## Adding content

**From files (bulk):** keep `.txt` / `.csv` / `.yaml` files in a folder on your PC (folder = topic or occasion)
and upload it in `/admin` → Import files. Syncing from a URL is optional. Format and folder layout:
[docs/content-format.md](docs/content-format.md). A ready-made example is in `content-example/`.

**By hand:** use `/admin`. Wishes use `{name}` as the placeholder. Festivals are one row per year (`diwali-2027`,
`starts_on`/`ends_on` in site time). The `occasion` column ties a festival to its wishes and templates.
