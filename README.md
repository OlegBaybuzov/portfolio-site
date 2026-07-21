# Oleg Baibuzov \u2014 Portfolio

A static, content-driven portfolio. No build step, no backend, no database.
Every word, project, skill, and color lives in `/content/*.json` and is
rendered into the page at runtime by `assets/js/main.js`.

## Structure

```
index.html               structural shell only \u2014 empty section containers
admin/index.html         local content editor (optional, no auth)
admin/admin.js
admin/admin.css
content/
  site.json               nav, hero, about copy, section headings, footer tagline
  settings.json           theme colors, timezone, availability, contact email
  projects.json           project cards
  skills.json             skill categories
  experience.json         timeline entries (empty array \u2192 section hides itself)
  socials.json             footer / contact links
  testimonials.json        empty by default \u2192 section hides itself
assets/
  css/style.css           the entire design system (tokens + components)
  js/
    content.js             fetches every file in /content into one object
    templates.js            pure functions: content \u2192 HTML string, per section
    interactions.js          cursor, smooth scroll, reveals, the meridian, form, etc.
    main.js                  orchestrates load \u2192 render \u2192 wire-up
  images/                  put project screenshots etc. here, reference by path in JSON
```

**To change content, edit JSON. Never edit HTML/CSS/JS for a content change.**
Example: change `"name": "Oleg Baibuzov"` in `site.json` and it updates
everywhere the name is used (currently the `<title>`; add it to more
templates if you want it to appear elsewhere).

## Running locally

Browsers block `fetch()` of local JSON files when a page is opened directly
from disk (`file://`). Serve the folder instead:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed `http://localhost:...` address. If you forget this
step, the site shows a clear on-screen message instead of a blank page.

## Editing content

**Option A \u2014 edit the JSON directly.** Open any file in `/content`, change
values, save, refresh the site. This always works, in any editor, on any OS.

**Option B \u2014 use the admin dashboard.** Open `/admin/index.html` (via the
same local server) for a generic form editor: it reads each JSON file's
actual shape and builds matching inputs \u2014 text fields, textareas for long
copy, a color picker for hex values, checkboxes for booleans, and
add/remove/reorder controls for lists like projects or skills.

- **Save button** downloads the updated JSON file by default \u2014 works in
  every browser. Replace the file in `/content` with the download.
- **"Connect /content folder"** (Chrome/Edge, via the File System Access
  API) lets Save write directly back to the file on disk instead \u2014 pick
  the project's root folder when prompted. This is a browser capability,
  not a server: nothing is installed and nothing runs in the background.
- The admin has no login. It's meant for local, single-user editing \u2014
  don't deploy `/admin` publicly if that matters to you (or just don't
  link to it; there's nothing sensitive inside).

## Adding a project

Open `content/projects.json` (directly or via `/admin`) and add an object:

```json
{
  "id": "unique-id",
  "title": "Project name",
  "description": "One or two sentences.",
  "image": "assets/images/project-name.jpg",
  "github": "https://github.com/...",
  "demo": "https://...",
  "stack": ["React", "TypeScript"],
  "featured": true,
  "year": 2026,
  "status": "Shipped",
  "tags": ["case-study"]
}
```

Leave `"image": ""` to show the elegant placeholder instead of a real
screenshot. A card is generated automatically \u2014 no HTML to touch.

## Theme

`settings.json \u2192 theme` holds every color as a CSS variable value
(`accent`, `bg`, `surface`, `text`, etc). Changing `accent` alone is enough
\u2014 the glow and cursor-spotlight colors are derived from it automatically
in `main.js`.

## Deployment

The whole thing is static files. Push the folder as-is to GitHub Pages,
Netlify, Vercel, or Cloudflare Pages \u2014 no build command, no environment
variables, no server. If you edited content through the admin's download
flow, just make sure the downloaded JSON files replace the ones in
`/content` before you deploy.

## Notes

- The contact form is front-end only (it shows a success state locally).
  Wire it to a real service (Formspree, a serverless function, etc.) when
  you're ready to receive submissions \u2014 there's no backend here by design.
- Fonts and animation libraries (GSAP, ScrollTrigger, Lenis) load from
  public CDNs; if you need a fully offline build, download and self-host
  them under `/assets`.
