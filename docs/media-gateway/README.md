# Media gateway: Internxt → rclone → Cloudflare Tunnel → CDN

Internxt holds only **reusable art**: template backgrounds (`bg:` in `content/templates.yaml`) and festival banner art
(`art:` in `content/festivals.yaml`). It's optional: without it, cards use gradient styles. Visitor cards are drawn in the browser and are never stored anywhere.

```
Internxt Drive
   │  WebDAV (Internxt CLI, localhost)
   ▼
rclone serve s3  --read-only   (127.0.0.1:8080, path-style: /<bucket>/<key>)
   │
   ▼
cloudflared tunnel  →  https://media.supquotes.com
   │
   ▼
Cloudflare CDN (Cache Rule: cache everything, 30-day edge TTL)
   ├─ browsers (canvas, needs CORS)  → MEDIA_BASE_URL in wrangler.jsonc
   └─ supquotes-edge OG worker       → MEDIA_BASE_URL in workers/edge/wrangler.jsonc
```

Because almost every request is a CDN hit, the box running rclone only serves each object once per
edge location per month. It can be a small always-on machine (home PC, Pi, cheap VPS).

## 1. Internxt WebDAV

Install the Internxt CLI and enable its local WebDAV server:

```powershell
npm i -g @internxt/cli
internxt login
internxt webdav enable
internxt webdav status
```

`webdav status` prints the local URL. Default is `https://127.0.0.1:3005`, with a self-signed cert.

In Internxt, create a folder named `supquotes` with `backgrounds/` and `festivals/` inside it.
The folder name becomes the S3 bucket name.

## 2. rclone

Copy [`rclone.conf.example`](rclone.conf.example) into your rclone config (`rclone config file` shows where it is),
then check the remote:

```powershell
rclone lsd internxt:
rclone ls internxt:supquotes
```

Serve it read-only as S3:

```powershell
rclone serve s3 internxt: --addr 127.0.0.1:8080 --read-only --no-check-certificate `
  --vfs-cache-mode full --vfs-cache-max-age 720h --dir-cache-time 1h
```

With no `--auth-key`, reads are anonymous. That's intended: the server only listens on 127.0.0.1,
and the public can reach it only through the tunnel, which the WAF rules below lock down.
[`start-gateway.ps1`](start-gateway.ps1) starts rclone and the tunnel together.

## 3. Cloudflare Tunnel

```powershell
cloudflared tunnel login
cloudflared tunnel create supquotes-media
cloudflared tunnel route dns supquotes-media media.supquotes.com
```

Fill in [`cloudflared-config.yml.example`](cloudflared-config.yml.example) and save it as `~/.cloudflared/config.yml`.
Install cloudflared as a service with `cloudflared service install` so it survives reboots.

## 4. Cloudflare dashboard rules (zone `supquotes.com`)

| Rule | Where | Setting |
|---|---|---|
| Cache media | Caching → Cache Rules | `http.host eq "media.supquotes.com"` → Eligible for cache; Edge TTL: ignore origin, **30 days**; Browser TTL **7 days** |
| CORS for canvas | Rules → Transform Rules → Modify response header | `http.host eq "media.supquotes.com"` → set `Access-Control-Allow-Origin: https://supquotes.com` |
| Read only | Security → WAF custom rule | `http.host eq "media.supquotes.com" and not http.request.method in {"GET" "HEAD"}` → Block |
| No bucket listing | Security → WAF custom rule | `http.host eq "media.supquotes.com" and (ends_with(http.request.uri.path, "/") or not starts_with(http.request.uri.path, "/supquotes/"))` → Block |

Without the CORS header the art still shows in the preview. But the browser marks the canvas as tainted,
so **Download / WhatsApp Status / Instagram fail** on that style. The site shows a "Couldn't export"
message when that happens.

## 5. Using art

1. Upload e.g. `backgrounds/roses.jpg` into the Internxt `supquotes` folder. Keep it 1080–1600px wide, JPG/WebP, under 400 KB.
2. In `content/templates.yaml`, set `bg: backgrounds/roses.jpg` on a template. Add `"overlay": "rgba(0,0,0,0.35)"` to its `layout` so the text stays readable.
3. Festival banner: in `content/festivals.yaml`, set `art: festivals/diwali-2027.jpg` on that festival.
4. Commit, push and deploy.

Changing a file under the same key won't show up until the CDN cache expires. Upload changed art under a
**new key** (e.g. `roses-v2.jpg`), or purge that URL in the Cloudflare dashboard.
