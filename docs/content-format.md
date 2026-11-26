# Adding quotes & wishes

All site content lives in the [`content/`](../content) folder of this repo. There is **no database**:
the build packs the folder into the site.

**To add or change content:** edit files in `content/`, then commit and push. The site redeploys
(or run `npm run deploy` yourself), and it's live in about a minute.

You can edit the files on your PC, or straight on github.com (open a file → ✏️ → Commit).

## Folder layout

```
content/
├── quotes/
│   ├── motivation.yaml        ← topic "motivation"
│   ├── success.txt            ← topic "success"
│   └── love/                  ← topic "love" (a folder lets one topic have many files)
│       ├── rumi.yaml
│       └── tagore.csv
├── wishes/
│   ├── birthday.txt           ← occasion "birthday"
│   └── diwali/                ← occasion "diwali"
│       ├── english.txt
│       └── hindi.yaml
├── festivals.yaml             ← festival & special-day dates (homepage switch)
└── templates.yaml             ← card styles
```

- `quotes/<topic>.<ext>` or `quotes/<topic>/<anything>.<ext>`: quotes for that topic. A new file or
  folder makes a new topic automatically. The name comes from the file or folder name
  ("good-vibes" → "Good Vibes"), or from `name:` in a YAML file.
- `wishes/<occasion>.<ext>` or `wishes/<occasion>/<anything>.<ext>`: wishes for that occasion.
  **Use the same occasion name as in `festivals.yaml`** so festival days pick them up
  (`diwali`, `eid`, `christmas`, `mothers-day`, …).
- Names: lowercase, words joined with `-`. Spaces and capitals are converted for you.
- Only one folder level under `quotes/` and `wishes/`.

## File formats

Pick whichever is easiest. Files must be UTF-8, so Hindi and other scripts work.

### `.txt`: one per line (easiest)

```
# quotes/motivation.txt
The secret of getting ahead is getting started. — Mark Twain
Small steps every day add up to big results.
```

- Quotes: put the author after ` — `. ` - `, ` -- ` and ` | ` also work. Leave it off for no author.
- Wishes: one wish per line. Write `{name}` where the person's name goes.
- Blank lines and lines starting with `#` are skipped.

### `.csv`: spreadsheet (Excel / Google Sheets → "Download as CSV")

```
text,author,lang,active
"Luck is what happens when preparation meets opportunity.",Seneca,en,yes
"A draft I'm not ready to publish.",,en,no
```

| column | required | meaning |
|---|---|---|
| `text` | yes | the quote or wish |
| `author` | no | quotes only |
| `lang` | no | `en` (default), `hi`, `ta`, … |
| `active` | no | `no` / `0` / `false` hides that row |

The header row is optional. Without one, column 1 = text and column 2 = author.

### `.yaml`: when you want a topic name, emoji or default author

```yaml
# quotes/love/rumi.yaml
name: Love            # optional: topic display name
emoji: "❤️"            # optional: topic emoji
author: Rumi          # optional: default author for all entries
quotes:
  - What you seek is seeking you.
  - text: Another one with a different author.
    author: Someone Else
  - text: Not ready yet
    active: false     # hidden
```

```yaml
# wishes/diwali/hindi.yaml
name: Diwali          # optional: occasion display name
lang: hi
wishes:
  - "{name}, आपको और आपके परिवार को दीपावली की हार्दिक शुभकामनाएं!"
```

Put text in quotes `"…"` if it contains `: ` or starts with `{`.

## festivals.yaml

One entry per occurrence. Add next year's dates as new entries.

```yaml
- slug: diwali-2027           # unique id
  name: Diwali
  occasion: diwali            # links to wishes/diwali and quotes/diwali
  starts: 2027-10-27          # YYYY-MM-DD, site time (Asia/Kolkata), inclusive
  ends: 2027-10-30
  headline: Happy Diwali! Light up their status    # homepage banner (optional)
  accent: "#a16207"           # banner colour (optional)
  art: festivals/diwali.jpg   # banner image key on the media gateway (optional)
  priority: 9                 # higher wins when dates overlap
```

On a festival day the homepage shows the banner and opens on that occasion's wishes. If there are no
wishes (e.g. World Cancer Day) it opens on that day's quotes instead.
**Lunar-calendar dates (Diwali, Holi, Eid, Navratri, …) for 2026–27 are estimates: check them.**

## templates.yaml

Card styles: a name, `kind` (`quote` / `wish` / `any`), an optional `occasion` (only offered then),
an optional `bg` (background image key) and a `layout` (see [`shared/layout.ts`](../shared/layout.ts)).
The easiest way to add one is to copy an existing entry and change the colours.

## How "today" works

The daily quote, wish and style are worked out from the date, so every visitor sees the same pick that
day, and no cron or database is needed. It cycles through all quotes before repeating. On festival days
it uses that festival's quotes, wishes and styles.

## Checks

- **Before you push:** run `npm run content`. It lists problems such as bad YAML (with its line number), a
  festival with a bad date, duplicates, or a wish without `{name}`.
- **On deploy:** errors stop the build, so broken content never goes live.
- **While you edit:** with `npm run dev` running, the site picks up changes to `content/` straight away.
- **Limits:** 1 MB per file and 500 characters per entry. A few thousand quotes is still well under 1 MB in total.

## Share links

Each quote and wish gets a short id from its text (e.g. `/q/ea74e4f4`). **Changing a quote's wording
changes its id**, so old share links to it show "not found". Fixing a typo is fine, but avoid rewording
popular quotes.
