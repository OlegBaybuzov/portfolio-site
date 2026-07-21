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

## Contact form

The form works out of the box with **zero setup**: submissions open the
visitor's own email app via a `mailto:` link, addressed to
`settings.json \u2192 contactEmail` (currently `olegfororders02@gmail.com`),
pre-filled with their name, email, and message. They just have to hit send
in their mail client.

To make it send **silently and automatically** instead (no click required
from the visitor), connect a free form service:

1. Sign up at [formspree.io](https://formspree.io) (or Web3Forms,
   or any service that accepts a plain `POST` with form fields).
2. Create a form and set its destination to `olegfororders02@gmail.com`
   \u2014 Formspree will send a one-time confirmation link to that address;
   click it to activate the form.
3. Copy the endpoint URL it gives you (looks like
   `https://formspree.io/f/xxxxxxxx`).
4. Paste it into `content/settings.json \u2192 contactFormEndpoint`.

That's it \u2014 no code changes. If the endpoint ever fails (wrong URL,
service down), the form automatically falls back to the `mailto:` link
rather than silently failing.

A hidden honeypot field (`_gotcha`) quietly drops obvious bot submissions
without bothering real visitors.

## Admin access

`/admin` is protected by a password gate (`admin/admin.js`). This is a
**client-side check**, which means it deters casual visitors but not a
determined one \u2014 anyone can view the JS and see the password hash. There
is no sensitive data behind it (only the same content that's already
public in `/content/*.json`), so this is a reasonable, honest trade-off
for a static site with no backend.

**Change the default password before deploying:**

1. Open `admin/hash-tool.html` in a browser.
2. Type your new password, copy the SHA-256 hash it prints.
3. Paste it into `admin/admin.js`, replacing the value of
   `ADMIN_PASSWORD_HASH`.

The default password is `changeme123` \u2014 change it.

Login state is stored in `sessionStorage`, so it clears when the browser
tab closes; use **Log out** in the admin bar to clear it manually.

If you ever need real, server-side access control (for example if the
admin starts touching anything more sensitive than portfolio copy), put
`/admin` behind your hosting provider's access control instead \u2014
Cloudflare Access, Netlify Identity, or similar \u2014 since that runs outside
the browser and can't be bypassed by reading the JS.

## Deployment

The whole thing is static files. Push the folder as-is to GitHub Pages,
Netlify, Vercel, or Cloudflare Pages \u2014 no build command, no environment
variables, no server. If you edited content through the admin's download
flow, just make sure the downloaded JSON files replace the ones in
`/content` before you deploy.

## Notes

- Fonts and animation libraries (GSAP, ScrollTrigger, Lenis) load from
  public CDNs; if you need a fully offline build, download and self-host
  them under `/assets`.