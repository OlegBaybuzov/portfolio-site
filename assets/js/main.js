/**
 * main.js
 * -----------------------------------------------------------------------
 * Orchestrates the whole page:
 *   1. load content JSON
 *   2. apply theme tokens as CSS variables
 *   3. render every section from templates.js
 *   4. wire up interactions.js
 *
 * Nothing content-related lives in this file — if you want to change
 * copy, projects, skills, colors, etc. edit the JSON in /content (or use
 * /admin), not this script.
 *
 * IMPORTANT — cache busting: the imports below and the <script> tag in
 * index.html both end in "?v=2". GitHub Pages' CDN caches .js files for
 * a while, so after you edit any file under assets/js/, bump that number
 * (here AND in index.html's script tag) so visitors' browsers fetch the
 * new version instead of a stale cached one. JSON files in /content
 * don't need this — they're fetched with cache: 'no-store'.
 * -----------------------------------------------------------------------
 */

import { loadContent } from "./content.js?v=2";
import * as tpl from "./templates.js?v=2";
import * as ix from "./interactions.js?v=2";

const SECTION_RENDERERS = {
  nav: tpl.nav,
  hero: tpl.hero,
  about: tpl.about,
  meridian: tpl.meridian,
  skills: tpl.skills,
  work: tpl.work,
  experience: tpl.experience,
  testimonials: tpl.testimonials,
  contact: tpl.contact,
  footer: tpl.footer,
};

/** Converts "#rrggbb" to "rgba(r,g,b,alpha)"; passes through anything else untouched. */
function hexToRgba(hex, alpha) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return hex;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme(theme = {}) {
  const root = document.documentElement.style;
  Object.entries(theme).forEach(([key, value]) => {
    root.setProperty(`--${key}`, value);
  });
  // Derived tokens — editing "accent" alone is enough to keep the glow/spotlight in sync.
  if (theme.accent) {
    root.setProperty("--accent-dim", hexToRgba(theme.accent, 0.2));
  }
}

function renderSections(content) {
  Object.entries(SECTION_RENDERERS).forEach(([id, render]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const html = render(content);
    el.innerHTML = html;
    el.style.display = html.trim() ? "" : "none";
  });
}

async function main() {
  ix.setPreloaderStep("connecting\u2026");

  const content = await loadContent();

  document.title = content.settings.siteTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc)
    metaDesc.setAttribute("content", content.settings.siteDescription || "");

  ix.setPreloaderStep("calibrating type\u2026");
  applyTheme(content.settings.theme);
  renderSections(content);

  // Give the browser a beat to paint the rendered DOM before revealing it.
  await new Promise((r) => setTimeout(r, 150));

  ix.setPreloaderStep("ready.");
  await ix.fadePreloader();

  ix.initLenis();
  ix.initCursor();
  ix.initSpotlight();
  ix.initLocalTime(content.settings);
  ix.initScrollReveals();
  ix.initMeridian();
  ix.initScrollIndicator();
  ix.initMagnetic();
  ix.initContactForm();
  ix.initBackToTop();
  ix.runHeroReveal();
}

main().catch((err) => {
  console.error(err);
  ix.showLoadError(
    "Couldn't load site content. If you opened this file directly from disk, " +
      "browsers block JSON loading over file://\u2014 serve the folder instead, " +
      "e.g. run <code>npx serve</code> in this directory and open the printed " +
      "localhost address.",
  );
});
