/**
 * interactions.js
 * -----------------------------------------------------------------------
 * All runtime behavior (preloader, cursor, smooth scroll, reveals, the
 * meridian draw-in, the contact form, etc). Every init function assumes
 * the DOM has already been populated by templates.js — call these from
 * main.js after rendering, not before.
 * -----------------------------------------------------------------------
 */

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let lenisInstance = null;

/* ---------- Preloader ---------- */
export function setPreloaderStep(text) {
  const line = document.getElementById("preloaderLine");
  if (line) line.textContent = text;
}

export function fadePreloader() {
  const el = document.getElementById("preloader");
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    const delay = prefersReducedMotion ? 0 : 300;
    setTimeout(() => {
      el.style.transition = "opacity 0.6s cubic-bezier(0.16,1,0.3,1)";
      el.style.opacity = "0";
      setTimeout(
        () => {
          el.style.display = "none";
          resolve();
        },
        prefersReducedMotion ? 0 : 600,
      );
    }, delay);
  });
}

export function showLoadError(message) {
  const el = document.getElementById("preloader");
  if (!el) return;
  el.innerHTML = `<div class="preloader__line preloader__line--error">${message}</div>`;
}

/* ---------- Smooth scroll (Lenis) ---------- */
export function initLenis() {
  if (prefersReducedMotion || !window.Lenis) return;
  lenisInstance = new Lenis({ lerp: 0.1, smoothWheel: true });
  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  if (window.gsap && window.ScrollTrigger) {
    lenisInstance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

/* ---------- Custom cursor ---------- */
export function initCursor() {
  const dot = document.getElementById("cursorDot");
  if (!dot || window.matchMedia("(hover: none)").matches) return;

  window.addEventListener("mousemove", (e) => {
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });

  document
    .querySelectorAll("a, button, .project-card, input, textarea")
    .forEach((elm) => {
      elm.addEventListener("mouseenter", () => dot.classList.add("is-hover"));
      elm.addEventListener("mouseleave", () =>
        dot.classList.remove("is-hover"),
      );
    });
}

/* ---------- Cursor spotlight over the dot-grid backdrop ---------- */
export function initSpotlight() {
  const el = document.getElementById("spotlight");
  if (!el || prefersReducedMotion) return;

  let raf = null;
  window.addEventListener("mousemove", (e) => {
    el.style.opacity = "1";
    if (raf) return;
    raf = requestAnimationFrame(() => {
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      raf = null;
    });
  });
  window.addEventListener("mouseleave", () => {
    el.style.opacity = "0";
  });
}

/* ---------- Live local time badge ---------- */
export function initLocalTime(settings) {
  const el = document.getElementById("timeValue");
  if (!el) return;

  const update = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: settings.timezone,
        hour: "2-digit",
        minute: "2-digit",
      });
      el.textContent = formatter.format(new Date());
    } catch {
      el.textContent = "\u2014:\u2014";
    }
  };
  update();
  setInterval(update, 30000);
}

/* ---------- Hero title reveal (call right after the preloader fades) ---------- */
export function runHeroReveal() {
  const lines = document.querySelectorAll(".hero__title .line > span");
  const items = document.querySelectorAll("[data-reveal-item]");
  const nav = document.getElementById("nav");

  if (prefersReducedMotion || !window.gsap) {
    lines.forEach((l) => (l.style.opacity = "1"));
    items.forEach((it) => it.classList.add("is-visible"));
    nav?.classList.add("is-visible");
    return;
  }

  gsap.set(lines, { yPercent: 110 });
  gsap.to(lines, {
    yPercent: 0,
    duration: 0.9,
    ease: "expo.out",
    stagger: 0.1,
    delay: 0.1,
  });

  if (nav) {
    gsap.to(nav, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "expo.out",
      delay: 0.15,
    });
    nav.classList.add("is-visible");
  }

  items.forEach((item, idx) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "expo.out",
      delay: 0.5 + idx * 0.12,
    });
  });
}

/* ---------- Scroll reveals for everything below the fold ---------- */
export function initScrollReveals() {
  const targets = document.querySelectorAll(
    "[data-reveal]:not(#nav), .skill-card, .project-card, .timeline-item, .testimonial-card",
  );

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );

  targets.forEach((t) => observer.observe(t));
}

/* ---------- Meridian — draws in once, the site's signature moment ---------- */
export function initMeridian() {
  const line = document.getElementById("meridianFill");
  const marker = document.getElementById("meridianMarker");
  const section = document.getElementById("meridian");
  if (!line || !marker || !section) return;

  const draw = () => {
    if (prefersReducedMotion) {
      line.style.width = "100%";
      marker.style.left = "100%";
      return;
    }
    line.style.transition = "width 1.8s cubic-bezier(0.16,1,0.3,1)";
    marker.style.transition = "left 1.8s cubic-bezier(0.16,1,0.3,1)";
    line.style.width = "100%";
    marker.style.left = "100%";
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          draw();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.5 },
  );
  observer.observe(section);
}

/* ---------- Scroll progress fill inside the hero ---------- */
export function initScrollIndicator() {
  const fill = document.getElementById("scrollFill");
  const hero = document.getElementById("hero");
  if (!fill || !hero) return;

  const update = () => {
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.6)));
    fill.style.height = `${progress * 100}%`;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- Magnetic effect, primary CTAs only ---------- */
export function initMagnetic() {
  if (prefersReducedMotion || window.matchMedia("(hover: none)").matches)
    return;
  const strength = 0.25;

  document.querySelectorAll("[data-magnetic]").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      btn.style.transform = `translate(${relX * strength}px, ${relY * strength}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transition = "transform 0.4s cubic-bezier(0.16,1,0.3,1)";
      btn.style.transform = "translate(0, 0)";
      setTimeout(() => (btn.style.transition = ""), 400);
    });
  });
}

/* ---------- Contact form ----------
 * If settings.contactFormEndpoint is set (e.g. a Formspree endpoint),
 * submissions POST there silently and arrive by email automatically.
 * If it's left empty, the form falls back to opening the visitor's own
 * email app via a mailto: link, pre-filled and addressed to
 * settings.contactEmail — this always works, with zero setup, on any
 * static host. See README.md for how to enable silent sending.
 */
export function initContactForm(settings) {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  const successText = document.getElementById("formSuccessText");
  if (!form) return;

  const endpoint = settings?.contactFormEndpoint?.trim();
  const contactEmail = (settings?.contactEmail || "").trim();

  function reveal(message) {
    Array.from(form.elements).forEach((el) => (el.style.display = "none"));
    if (successText) successText.textContent = message;
    success.classList.add("is-visible");
  }

  function openMailto(data) {
    const subject = encodeURIComponent(
      `New message from ${data.get("name") || "your portfolio"}`,
    );
    const body = encodeURIComponent(
      `${data.get("message") || ""}\n\n\u2014 ${data.get("name") || ""} (${data.get("email") || ""})`,
    );
    const mailtoUrl = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

    // A real <a> click is more reliable than setting window.location.href
    // directly \u2014 some mobile mail apps (notably iOS Mail) fail to
    // populate the "To" field when the mailto: navigation is triggered
    // by a location assignment instead of an anchor click.
    const link = document.createElement("a");
    link.href = mailtoUrl;
    link.style.position = "fixed";
    link.style.left = "-9999px";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 500);

    reveal(
      "Your email app should now be open \u2014 hit send and I'll get it.",
    );
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (form.querySelector('[name="_gotcha"]').value) return; // honeypot tripped, silently drop

    const data = new FormData(form);

    if (!endpoint) {
      openMailto(data);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"] span');
    const originalLabel = submitBtn?.textContent;
    if (submitBtn) submitBtn.textContent = "Sending\u2026";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!res.ok) throw new Error(`Form service responded ${res.status}`);
      reveal("Message sent. I'll reply soon.");
    } catch (err) {
      console.error(
        "Contact form AJAX submit failed, falling back to a plain form POST:",
        err,
      );
      // form.submit() bypasses this JS entirely and does a normal browser
      // POST straight to the endpoint already set as the form's action —
      // a different, more basic code path than fetch(), so it survives
      // whatever caused the fetch to fail (CORS quirk, ad blocker, etc).
      if (submitBtn) submitBtn.textContent = originalLabel;
      form.submit();
      return;
    } finally {
      if (submitBtn) submitBtn.textContent = originalLabel;
    }
  });
}

/* ---------- Back to top ---------- */
export function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (lenisInstance) lenisInstance.scrollTo(0);
    else
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
  });
}
