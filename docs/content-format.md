# Adding quotes & wishes with files

Keep your quotes and wishes as plain files in a folder on your PC. The folder name or file name decides
the category. There are two ways to get them onto the site:

1. **Upload in admin (no cloud storage needed).** Open `/admin` → **Import files**, then:
   - **Whole folder:** pick your `SupQuotes` folder. It's imported as is, and `index.txt` isn't needed.
     With "This is my whole folder" ticked, quotes from files you deleted are hidden.
   - **Single files:** pick one or more files, then type their topic or occasion.

   Edit the files on your PC, then upload the folder again whenever you like. Unchanged files are skipped.
2. **Optional: sync from a URL.** If you ever host the folder somewhere with permanent direct file links
   (GitHub, a web server, R2/S3), set `CONTENT_BASE_URL`. It then syncs every 6 hours, or straight away
   with **Sync from URL**. This way needs `index.txt` (see below).

Both ways use the same folder layout and file formats.

## Folder layout

```
<your folder>/                      ← CONTENT_BASE_URL points here
├── index.txt                       ← list of files to import (required, see below)
├── quotes/
│   ├── motivation.txt              ← topic "motivation"
│   ├── success.csv                 ← topic "success"
│   └── love/                       ← topic "love" (a folder lets one topic have many files)
│       ├── rumi.yaml
│       └── tagore.txt
└── wishes/
    ├── birthday.txt                ← occasion "birthday"
    ├── anniversary.csv             ← occasion "anniversary"
    └── diwali/                     ← occasion "diwali"
        ├── english.txt
        └── hindi.yaml
```

- `quotes/<topic>.<ext>` or `quotes/<topic>/<anything>.<ext>`: quotes for that topic. A new topic is
  created automatically. Its name comes from the folder name ("good-vibes" → "Good Vibes"), or from `name:` in a YAML file.
- `wishes/<occasion>.<ext>` or `wishes/<occasion>/<anything>.<ext>`: wishes for that occasion.
  **Use the same occasion names the site uses** so festival days pick them up. These include:
  `birthday`, `anniversary`, `good-morning`, `good-night`, `congratulations`, `get-well`, `diwali`, `holi`, `eid`,
  `christmas`, `new-year`, `raksha-bandhan`, `mothers-day`, `fathers-day`, `teachers-day`, `friendship-day`,
  `independence-day`, `republic-day`, `valentines`, `ganesh-chaturthi`, `navratri`, `dussehra`, `sankranti`.
  The full list is on `/topics`.
- Names: lowercase, words joined with `-`. Spaces and capitals are converted for you ("Good Morning" → `good-morning`).
- Only one folder level under `quotes/` or `wishes/`.

## index.txt (URL sync only)

Not needed when you upload in admin. Plain HTTP storage can't list a folder, so for URL sync `index.txt`
lists the files to import, one path per line:

```
# lines starting with # are ignored
quotes/motivation.txt
quotes/success.csv
quotes/love/rumi.yaml
wishes/birthday.txt
wishes/diwali/hindi.yaml
```

To write it automatically from your local copy of the folder:

```powershell
node scripts/make-content-index.mjs "C:\path\to\your\folder"
```

Then upload `index.txt` along with your files.

**Removing a file from `index.txt` hides all its quotes and wishes** on the next sync.

## File formats

Pick whichever is easiest. All files must be UTF-8, so Hindi and other scripts work.

### `.txt`: one per line (easiest)

```
# quotes/motivation.txt
The secret of getting ahead is getting started. — Mark Twain
Well done is better than well said. — Benjamin Franklin
Small steps every day add up to big results.
```

- Quotes: put the author after ` — `. ` - `, ` -- ` and ` | ` also work. Leave it off for no author.
- Wishes: one wish per line. Write `{name}` where the person's name goes.
- Blank lines and lines starting with `#` are skipped.

### `.csv`: spreadsheet (Excel / Google Sheets → "Download as CSV")

```
text,author,lang,active
"Luck is what happens when preparation meets opportunity.",Seneca,en,yes
"Success is the sum of small efforts, repeated day in and day out.",,en,yes
"A draft I'm not ready to publish.",,en,no
```

| column | required | meaning |
|---|---|---|
| `text` | yes | the quote or wish |
| `author` | no | quotes only |
| `lang` | no | `en` (default), `hi`, `ta`, … |
| `active` | no | `no` / `0` / `false` hides that row |

The header row is optional. Without one, column 1 = text and column 2 = author.

### `.yaml`: when you want extra options

```yaml
# quotes/love/rumi.yaml
name: Love            # optional: topic display name
emoji: "❤️"            # optional: topic emoji
author: Rumi          # optional: default author for all entries
lang: en              # optional: default language
quotes:
  - What you seek is seeking you.
  - text: Let yourself be silently drawn by the strange pull of what you really love.
  - text: A line with a different author.
    author: Someone Else
```

```yaml
# wishes/diwali/hindi.yaml
lang: hi
wishes:
  - "{name}, आपको और आपके परिवार को दीपावली की हार्दिक शुभकामनाएं!"
```

Put text in quotes `"…"` if it contains `: ` or starts with `{`. YAML treats those specially.

## What happens on sync

- **New lines** are added. **Edited files** are re-imported. **Unchanged files** are skipped, using a checksum.
- **A line you delete** from a file disappears from the site on the next sync.
- **The same text in two places** isn't duplicated. The file synced last owns it.
- **Quotes you add in `/admin`** are never changed or hidden by a sync.
- **Limits:**
  - 1 MB per file, and 2,000 entries per file (split bigger lists across files in a topic folder)
  - 500 characters per entry
  - 200 files per sync
- **Problems** (a missing file, bad YAML, a wish without `{name}`) show in the admin sync report. They're also
  in the edge Worker's logs. One bad file never stops the others.

## Where to host the folder

The storage must give **a direct link to each file**, so that `CONTENT_BASE_URL + "/index.txt"` downloads the raw text.
A "share page" link that opens a web page won't work.

| Storage | Works? | CONTENT_BASE_URL |
|---|---|---|
| Internxt via the media gateway ([media-gateway](media-gateway/README.md)) | ✅ | `https://media.supquotes.com/supquotes/content` |
| Any web server / S3 / R2 public bucket | ✅ | the folder's public URL |
| GitHub repo | ✅ | `https://raw.githubusercontent.com/<user>/<repo>/main/content` |
| myHPcloud share link | ❌ | links are one-off SharePoint downloads that expire in about an hour |

**myHPcloud:** checked on 2026-11-26. Each download gets a fresh SharePoint link with a short-lived token,
and there's no path-based address, so URL sync can't use it. Upload in admin instead.

Set the URL in both `wrangler.jsonc` (for the admin button) and `workers/edge/wrangler.jsonc` (for the cron),
under `CONTENT_BASE_URL`. If the storage needs a token, add it as the secret `CONTENT_TOKEN`; it's sent as `Authorization: Bearer …`.
A ready-made example folder is in [`content-example/`](../content-example).
