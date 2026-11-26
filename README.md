# SupQuotes

Quote and wish card maker: pick a quote or write a wish with a name, choose a style, and share the card
to WhatsApp Status or Instagram.

- **Site:** Astro (SSR) on Cloudflare Workers with static assets (`@astrojs/cloudflare`).
- **Content: no database.** Quotes, wishes, festivals and card styles are plain files in [`content/`](content).
  The build packs them into `generated/content.json`, which ships inside the Worker.
- **Today's pick and the festival switch** are worked out from the date: no cron, the same for every visitor.
- **Cards:** drawn on `<canvas>` in the visitor's browser and never stored.
- **Link previews:** `workers/edge` draws OG images (workers-og / satori) from the same bundled content.
- **Art (optional):** Internxt → `rclone serve s3` → Cloudflare Tunnel → CDN. See [docs/media-gateway](docs/media-gateway/README.md).

## Layout

```
content/                           quotes/, wishes/, festivals.yaml, templates.yaml  ← edit these
scripts/build-content.mjs          content/ → generated/content.json (validates; fails the build on errors)
scripts/content-parse.mjs          .txt / .csv / .yaml parsers
shared/content.ts                  content types + date-based daily pick / festival logic
shared/layout.ts                   card layout format (site + OG worker)
src/lib/content.ts                 site data access (reads the bundled JSON)
src/lib/render.ts                  browser canvas renderer
src/components/Generator.astro     the quote/wish maker + share buttons
src/pages/                         /, /q/:id, /wish/:id, /topics, /topic/:slug, /author/:slug, /wishes/:occasion
src/pages/api/                     /api/quote/random, /api/wish/random
workers/edge/                      OG link-preview images
```

## Adding content

Edit files in `content/`, check them with `npm run content`, then commit and push. The format, folder
layout, festivals and styles are all in [docs/content-format.md](docs/content-format.md).

## Local development

```powershell
npm install
```

```powershell
npm run dev
```

The site runs at http://localhost:4321 and reloads when you edit `content/`.
For link-preview images, run this in a second terminal (http://127.0.0.1:8788):

```powershell
npm run edge:dev
```

## Deploy

No database and no secrets. Log in once with `npx wrangler login`, then:

```powershell
npm run deploy
```

```powershell
npm run edge:deploy
```

- In the Cloudflare dashboard, attach `supquotes.com` to the `supquotes` Worker (Settings → Domains & Routes).
  `og.supquotes.com` is attached by `workers/edge/wrangler.jsonc`, so the domain must be on the same Cloudflare account.
- Link-preview images need more than the free plan's 10 ms CPU per request: use Workers Paid ($5/month).
  Everything else runs on the free plan.

**Optional: deploy on every push.** In the Cloudflare dashboard → Workers → `supquotes` → Settings → Builds,
connect this GitHub repo. Use build command `npm run build` and deploy command `npx wrangler deploy`.
For `supquotes-edge`, use build command `npm run content` and deploy command
`npx wrangler deploy -c workers/edge/wrangler.jsonc`. After that, editing `content/` on GitHub is all
it takes to update the site.

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
