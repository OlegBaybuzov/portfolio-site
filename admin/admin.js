/**
 * admin.js
 * -----------------------------------------------------------------------
 * A tiny local "headless CMS" dashboard. It doesn't hand-code a form per
 * content file — instead it walks whatever JSON shape each file has
 * (objects, arrays of objects, arrays of strings, strings, numbers,
 * booleans, hex colors) and builds the right input automatically. Add a
 * new field to any JSON file and a matching input appears here with zero
 * changes to this script.
 *
 * Saving:
 *   - If the browser supports the File System Access API and you've
 *     connected the /content folder, "Save" writes the JSON file directly.
 *   - Otherwise "Save" downloads the file — replace the one in /content
 *     manually. This keeps the admin usable in every browser with zero
 *     backend, per the project's static-only constraint.
 * -----------------------------------------------------------------------
 */

import { loadContent, CONTENT_FILES } from "../assets/js/content.js";

/**
 * --- Access control -------------------------------------------------
 * This is a client-side password gate, not real authentication: the
 * hash below ships inside this file, so anyone determined enough can
 * read the source and brute-force offline. It exists to stop casual
 * visitors from opening /admin, not to protect sensitive data (there
 * isn't any here — it only edits public portfolio copy).
 *
 * To change the password:
 *   1. Open admin/hash-tool.html in a browser.
 *   2. Type your new password, copy the hash it prints.
 *   3. Paste it below, replacing ADMIN_PASSWORD_HASH.
 *
 * For real protection (e.g. if you add anything sensitive later), put
 * /admin behind your host's access control instead — Cloudflare
 * Access, Netlify Identity, or a platform login — since that runs
 * server-side and can't be bypassed by reading the JS.
 * ---------------------------------------------------------------------
 */
const ADMIN_PASSWORD_HASH =
  "e9bc026cda71afd287bea581d99a29298ad73de0831337eb65e2a896f599c2fe"; // default: "changeme123" — change this immediately
const AUTH_KEY = "ob_admin_authed";

async function sha256Hex(text) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function showGate() {
  const overlay = document.createElement("div");
  overlay.className = "admin-gate";
  overlay.innerHTML = `
    <form class="admin-gate__box">
      <span class="admin-gate__mark">OB</span>
      <h1>Admin access</h1>
      <p>This dashboard edits live site content. Enter the password to continue.</p>
      <input type="password" class="field-input" id="gatePassword" placeholder="Password" autocomplete="current-password" autofocus>
      <button type="submit" class="btn btn--primary btn--full">Unlock</button>
      <p class="admin-gate__error" id="gateError"></p>
    </form>
  `;
  document.body.append(overlay);

  const form = overlay.querySelector("form");
  const input = overlay.querySelector("#gatePassword");
  const error = overlay.querySelector("#gateError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(input.value);
    if (hash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(AUTH_KEY, "1");
      overlay.remove();
      boot();
    } else {
      error.textContent = "Incorrect password.";
      overlay.querySelector(".admin-gate__box").classList.add("is-shaking");
      setTimeout(
        () =>
          overlay
            .querySelector(".admin-gate__box")
            ?.classList.remove("is-shaking"),
        400,
      );
      input.value = "";
      input.focus();
    }
  });
}

function requireAuth() {
  if (isAuthed()) {
    boot();
  } else {
    showGate();
  }
}

const TAB_LABELS = {
  site: "Site copy",
  settings: "Settings & theme",
  projects: "Projects",
  skills: "Skills",
  experience: "Experience",
  socials: "Socials",
  testimonials: "Testimonials",
};

// Used only when a top-level array is empty and we need to guess the shape of a new item.
const EMPTY_ARRAY_TEMPLATES = {
  projects: {
    title: "",
    description: "",
    image: "",
    github: "",
    demo: "",
    stack: [],
    featured: false,
    year: new Date().getFullYear(),
    status: "",
    tags: [],
  },
  skills: { category: "", level: "", items: [] },
  experience: { period: "", role: "", org: "", description: "" },
  socials: { label: "", href: "" },
  testimonials: { quote: "", name: "", role: "" },
};

let store = {};
let dirHandle = null;
let activeTab = "site";
const dirty = new Set();

/* ---------- path helpers ---------- */
function getDeep(obj, path) {
  return path.reduce((cur, key) => cur[key], obj);
}
function setDeep(obj, path, value) {
  const parent = getDeep(obj, path.slice(0, -1));
  parent[path[path.length - 1]] = value;
}
function resetShape(value) {
  if (Array.isArray(value)) return [];
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resetShape(v)]),
    );
  }
  if (typeof value === "string") return "";
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return value;
}
function labelFor(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
function isHexColor(str) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str);
}

/* ---------- toast ---------- */
let toastTimer;
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
}

/* ---------- generic field builders ---------- */
function buildPrimitive(value, path) {
  const key = path[path.length - 1];

  if (typeof value === "boolean") {
    const wrap = document.createElement("label");
    wrap.className = "field-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = value;
    input.addEventListener("change", () => {
      setDeep(store, path, input.checked);
      markDirty();
    });
    const span = document.createElement("span");
    span.textContent = value ? "Yes" : "No";
    input.addEventListener(
      "change",
      () => (span.textContent = input.checked ? "Yes" : "No"),
    );
    wrap.append(input, span);
    return wrap;
  }

  if (typeof value === "number") {
    const input = document.createElement("input");
    input.className = "field-input";
    input.type = "number";
    input.value = value;
    input.addEventListener("input", () => {
      setDeep(store, path, input.value === "" ? 0 : Number(input.value));
      markDirty();
    });
    return input;
  }

  const str = String(value ?? "");

  if (isHexColor(str)) {
    const row = document.createElement("div");
    row.className = "field-color-row";
    const color = document.createElement("input");
    color.type = "color";
    color.value =
      str.length === 4
        ? `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`
        : str;
    const text = document.createElement("input");
    text.className = "field-input";
    text.type = "text";
    text.value = str;
    color.addEventListener("input", () => {
      text.value = color.value;
      setDeep(store, path, color.value);
      markDirty();
    });
    text.addEventListener("input", () => {
      setDeep(store, path, text.value);
      if (isHexColor(text.value)) color.value = text.value;
      markDirty();
    });
    row.append(color, text);
    return row;
  }

  const useTextarea =
    str.length > 60 || /description|paragraph|quote|subtitle|bio/i.test(key);
  const input = document.createElement(useTextarea ? "textarea" : "input");
  input.className = useTextarea ? "field-textarea" : "field-input";
  if (!useTextarea)
    input.type = key.toLowerCase().includes("email") ? "email" : "text";
  input.value = str;
  input.addEventListener("input", () => {
    setDeep(store, path, input.value);
    markDirty();
  });
  return input;
}

function buildStringArray(value, path) {
  const wrap = document.createElement("div");
  wrap.className = "strarr-editor";

  const renderChips = () => {
    wrap.innerHTML = "";
    value.forEach((str, i) => {
      const chip = document.createElement("span");
      chip.className = "strarr-chip";
      const input = document.createElement("input");
      input.value = str;
      input.size = Math.max(4, str.length);
      input.addEventListener("input", () => {
        value[i] = input.value;
        markDirty();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "\u00d7";
      remove.setAttribute("aria-label", "Remove");
      remove.addEventListener("click", () => {
        value.splice(i, 1);
        markDirty();
        renderChips();
      });
      chip.append(input, remove);
      wrap.append(chip);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "strarr-add";
    add.textContent = "+ Add";
    add.addEventListener("click", () => {
      value.push("");
      markDirty();
      renderChips();
      wrap.querySelectorAll(".strarr-chip input").forEach((el) => {}); // no-op, keeps lint happy
      wrap.querySelector(".strarr-chip:last-of-type input")?.focus();
    });
    wrap.append(add);
  };

  renderChips();
  return wrap;
}

function itemDisplayName(item, index) {
  return (
    item.title ||
    item.category ||
    item.role ||
    item.label ||
    item.name ||
    `Item ${index + 1}`
  );
}

function buildArrayOfObjects(value, path) {
  const wrap = document.createElement("div");
  wrap.className = "arr-editor";

  value.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "arr-item";

    const head = document.createElement("div");
    head.className = "arr-item__head";
    const title = document.createElement("span");
    title.className = "arr-item__title";
    title.textContent = itemDisplayName(item, i);

    const controls = document.createElement("div");
    controls.className = "arr-item__controls";

    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "\u2191";
    up.title = "Move up";
    up.disabled = i === 0;
    up.addEventListener("click", () => {
      [value[i - 1], value[i]] = [value[i], value[i - 1]];
      markDirty();
      renderPanel();
    });

    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "\u2193";
    down.title = "Move down";
    down.disabled = i === value.length - 1;
    down.addEventListener("click", () => {
      [value[i + 1], value[i]] = [value[i], value[i + 1]];
      markDirty();
      renderPanel();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "\u00d7";
    remove.title = "Remove";
    remove.addEventListener("click", () => {
      value.splice(i, 1);
      markDirty();
      renderPanel();
    });

    controls.append(up, down, remove);
    head.append(title, controls);

    const body = buildObject(item, [...path, i]);
    card.append(head, body);
    wrap.append(card);
  });

  const add = document.createElement("button");
  add.type = "button";
  add.className = "arr-add";
  add.textContent = "+ Add item";
  add.addEventListener("click", () => {
    const template = value.length
      ? resetShape(value[value.length - 1])
      : EMPTY_ARRAY_TEMPLATES[path[0]] || {};
    value.push(JSON.parse(JSON.stringify(template)));
    markDirty();
    renderPanel();
  });
  wrap.append(add);

  return wrap;
}

function buildObject(value, path) {
  const wrap = document.createElement("div");
  wrap.className = "obj-editor";

  Object.keys(value).forEach((key) => {
    const child = buildNode(value[key], [...path, key]);
    const field = document.createElement("div");
    field.className = "obj-field";
    if (
      Array.isArray(value[key]) ||
      (value[key] !== null && typeof value[key] === "object")
    ) {
      field.classList.add("obj-field--nested");
    }
    const label = document.createElement("label");
    label.textContent = labelFor(key);
    field.append(label, child);
    wrap.append(field);
  });

  return wrap;
}

function buildNode(value, path) {
  if (Array.isArray(value)) {
    if (
      value.length === 0 &&
      path.length === 1 &&
      EMPTY_ARRAY_TEMPLATES[path[0]]
    ) {
      return buildArrayOfObjects(value, path);
    }
    if (value.length && typeof value[0] === "object" && value[0] !== null) {
      return buildArrayOfObjects(value, path);
    }
    return buildStringArray(value, path);
  }
  if (value !== null && typeof value === "object")
    return buildObject(value, path);
  return buildPrimitive(value, path);
}

/* ---------- dirty tracking ---------- */
function markDirty() {
  dirty.add(activeTab);
  renderTabs();
}

/* ---------- saving ---------- */
async function writeToDisk(name, json) {
  const contentDir = await dirHandle.getDirectoryHandle("content");
  const fileHandle = await contentDir.getFileHandle(`${name}.json`, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(json);
  await writable.close();
}

function downloadJSON(name, json) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function saveActiveTab() {
  const json = JSON.stringify(store[activeTab], null, 2);
  if (dirHandle) {
    try {
      await writeToDisk(activeTab, json);
      dirty.delete(activeTab);
      renderTabs();
      toast(`Saved content/${activeTab}.json`);
      return;
    } catch (err) {
      console.error(err);
      toast("Could not write to disk \u2014 downloading instead");
    }
  }
  downloadJSON(activeTab, json);
  toast(`Downloaded ${activeTab}.json \u2014 replace it in /content`);
}

/* ---------- folder connection (optional, Chrome/Edge) ---------- */
async function pickFolder() {
  if (!window.showDirectoryPicker) {
    toast(
      "Your browser doesn\u2019t support direct file saving \u2014 use Chrome or Edge, or keep using Save to download.",
    );
    return;
  }
  try {
    const handle = await window.showDirectoryPicker();
    await handle.getDirectoryHandle("content"); // confirms this is the right folder
    dirHandle = handle;
    document.getElementById("folderStatus").textContent =
      "Connected \u2014 Save writes directly to /content";
  } catch (err) {
    if (err.name !== "AbortError") {
      toast(
        "Could not connect that folder \u2014 make sure it contains a /content directory",
      );
    }
  }
}

/* ---------- rendering ---------- */
function renderTabs() {
  const nav = document.getElementById("tabs");
  nav.innerHTML = "";
  CONTENT_FILES.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = name === activeTab ? "is-active" : "";
    if (dirty.has(name)) btn.classList.add("is-dirty");
    btn.innerHTML = `<span>${TAB_LABELS[name] || name}</span><span class="dirty-dot"></span>`;
    btn.addEventListener("click", () => {
      activeTab = name;
      renderTabs();
      renderPanel();
    });
    nav.append(btn);
  });
}

function renderPanel() {
  const panel = document.getElementById("panel");
  panel.innerHTML = "";

  const head = document.createElement("div");
  head.className = "panel-head";
  const h2 = document.createElement("h2");
  h2.textContent = TAB_LABELS[activeTab] || activeTab;
  const actions = document.createElement("div");
  actions.className = "panel-head__actions";
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn--primary btn--sm";
  saveBtn.textContent = dirHandle ? "Save to disk" : "Download JSON";
  saveBtn.addEventListener("click", saveActiveTab);
  actions.append(saveBtn);
  head.append(h2, actions);

  panel.append(head, buildNode(store[activeTab], [activeTab]));
}

/* ---------- boot ---------- */
async function boot() {
  try {
    store = await loadContent("../content/");
  } catch (err) {
    document.getElementById("panel").innerHTML =
      `<p class="admin-empty">Couldn\u2019t load content from ../content/. Serve this folder over http (e.g. <code>npx serve</code>) rather than opening it as a file.</p>`;
    console.error(err);
    return;
  }

  renderTabs();
  renderPanel();
}

document.getElementById("pickFolderBtn").addEventListener("click", pickFolder);
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_KEY);
  location.reload();
});

requireAuth();
