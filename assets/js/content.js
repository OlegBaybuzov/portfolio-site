/*
 * content.js
 * Fault-tolerant content loader
 */

export const CONTENT_FILES = [
  "site",
  "settings",
  "projects",
  "skills",
  "experience",
  "socials",
  "testimonials",
];

const DEFAULTS = {
  site: {},
  settings: {},
  projects: [],
  skills: {},
  experience: [],
  socials: {},
  testimonials: [],
};

async function loadFile(base, name) {
  try {
    const res = await fetch(`${base}${name}.json`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(
        `${name}.json not found (HTTP ${res.status}). Using defaults.`,
      );
      return [name, DEFAULTS[name]];
    }

    const text = await res.text();

    if (!text.trim()) {
      console.warn(`${name}.json is empty. Using defaults.`);
      return [name, DEFAULTS[name]];
    }

    try {
      return [name, JSON.parse(text)];
    } catch (err) {
      console.warn(`${name}.json contains invalid JSON. Using defaults.`, err);
      return [name, DEFAULTS[name]];
    }
  } catch (err) {
    console.warn(`Failed to load ${name}.json`, err);
    return [name, DEFAULTS[name]];
  }
}

export async function loadContent(base = "content/") {
  const entries = await Promise.all(
    CONTENT_FILES.map((name) => loadFile(base, name)),
  );

  return Object.fromEntries(entries);
}
