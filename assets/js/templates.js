/**
 * templates.js
 * -----------------------------------------------------------------------
 * Every function here takes the full `content` object (as returned by
 * content.js) and returns an HTML string for one region of the page.
 * main.js is responsible for injecting the string into the right
 * container. Keeping these pure and string-based means they're easy to
 * test, easy to read, and easy to extend without touching markup elsewhere.
 * -----------------------------------------------------------------------
 */

/** Turns "focused on {accent}clarity{/accent}." into real markup. */
function withAccent(line) {
  return line.replace(/\{accent\}(.*?)\{\/accent\}/g, "<em>$1</em>");
}

export function nav({ site }) {
  const links = site.nav.links
    .map((l) => `<a href="${l.href}">${l.label}</a>`)
    .join("");
  return `
    <a href="#top" class="nav__mark">${site.nav.mark}</a>
    <nav class="nav__links" aria-label="Primary">${links}</nav>
    <a href="${site.nav.cta.href}" class="nav__cta">${site.nav.cta.label}</a>
  `;
}

export function hero({ site, settings }) {
  const lines = site.hero.titleLines
    .map(
      (l) =>
        `<span class="line" data-line><span>${withAccent(l)}</span></span>`,
    )
    .join("");

  const availability = settings.availability
    ? `<div class="badge" data-reveal-item>
         <span class="badge__dot"></span>
         ${site.hero.badgeAvailable}
       </div>`
    : "";

  return `
    <div class="hero__inner">
      <div class="hero__top">
        ${availability}
        <div class="badge badge--mono" data-reveal-item>
          <span class="badge__label">${settings.timezoneLabel}</span>
          <span id="timeValue">\u2014:\u2014</span>
        </div>
      </div>

      <h1 class="hero__title">${lines}</h1>

      <p class="hero__subtitle" data-reveal-item>${site.hero.subtitle}</p>

      <div class="hero__actions" data-reveal-item>
        <a href="${site.hero.primaryCta.href}" class="btn btn--primary" data-magnetic>
          <span>${site.hero.primaryCta.label}</span>
        </a>
        <a href="${site.hero.secondaryCta.href}" class="btn btn--ghost">${site.hero.secondaryCta.label}</a>
      </div>
    </div>

    <div class="scroll-indicator" aria-hidden="true">
      <span class="scroll-indicator__track"><span class="scroll-indicator__fill" id="scrollFill"></span></span>
      <span class="scroll-indicator__label">Scroll</span>
    </div>
  `;
}

export function about({ site }) {
  const paragraphs = site.about.paragraphs
    .map((p) => `<p class="about__text" data-reveal>${p}</p>`)
    .join("");
  const values = site.about.values.map((v) => `<li>${v}</li>`).join("");

  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.about.eyebrow}</p>
      <h2 class="section-title" data-reveal>${site.about.title}</h2>
      <div class="about__grid">
        ${paragraphs}
        <ul class="about__values" data-reveal>${values}</ul>
      </div>
    </div>
  `;
}

export function meridian({ site }) {
  const { start, end } = site.meridian;
  return `
    <div class="meridian__inner" data-reveal>
      <div class="meridian__point">
        <span class="meridian__coord">${start.coord}</span>
        <span class="meridian__city">${start.city}</span>
      </div>
      <div class="meridian__line">
        <span class="meridian__line-fill" id="meridianFill"></span>
        <span class="meridian__marker" id="meridianMarker"></span>
      </div>
      <div class="meridian__point meridian__point--end">
        <span class="meridian__coord">${end.coord}</span>
        <span class="meridian__city">${end.city}</span>
      </div>
    </div>
  `;
}

export function skills({ site, skills }) {
  const cards = skills
    .map(
      (cat) => `
      <div class="skill-card" data-reveal>
        <div class="skill-card__head">
          <h3>${cat.category}</h3>
          <span class="skill-card__level">${cat.level}</span>
        </div>
        <ul class="skill-card__list">
          ${cat.items.map((i) => `<li>${i}</li>`).join("")}
        </ul>
      </div>`,
    )
    .join("");

  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.sections.skillsEyebrow}</p>
      <h2 class="section-title" data-reveal>${site.sections.skillsTitle}</h2>
      <div class="skills__grid">${cards}</div>
    </div>
  `;
}

function projectCard(project) {
  const media = project.image
    ? `<img src="${project.image}" alt="${project.title}" loading="lazy">`
    : `<div class="project-card__placeholder">${project.status || "Case study"}</div>`;

  const stack = project.stack.map((s) => `<span>${s}</span>`).join("");
  const primaryLink = project.demo || project.github || "#work";

  return `
    <article class="project-card" data-reveal>
      <a class="project-card__media" href="${primaryLink}" ${project.demo || project.github ? 'target="_blank" rel="noopener"' : 'tabindex="-1" aria-hidden="true"'}>
        ${media}
        <span class="project-card__tag" data-tag>View</span>
      </a>
      <div class="project-card__body">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-card__stack">${stack}</div>
      </div>
    </article>
  `;
}

export function work({ site, projects }) {
  const sorted = [...projects].sort(
    (a, b) => (b.featured === true) - (a.featured === true),
  );
  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.sections.workEyebrow}</p>
      <h2 class="section-title" data-reveal>${site.sections.workTitle}</h2>
      <div class="work__list">${sorted.map(projectCard).join("")}</div>
    </div>
  `;
}

export function experience({ site, experience }) {
  if (!experience.length) return "";
  const items = experience
    .map(
      (e) => `
      <div class="timeline-item" data-reveal>
        <span class="timeline-item__period">${e.period}</span>
        <div class="timeline-item__body">
          <h3>${e.role}</h3>
          <span class="timeline-item__org">${e.org}</span>
          <p>${e.description}</p>
        </div>
      </div>`,
    )
    .join("");

  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.sections.experienceEyebrow}</p>
      <h2 class="section-title" data-reveal>${site.sections.experienceTitle}</h2>
      <div class="timeline">${items}</div>
    </div>
  `;
}

export function testimonials({ site, testimonials }) {
  if (!testimonials.length) return "";
  const cards = testimonials
    .map(
      (t) => `
      <figure class="testimonial-card" data-reveal>
        <blockquote>\u201c${t.quote}\u201d</blockquote>
        <figcaption>${t.name}${t.role ? `, ${t.role}` : ""}</figcaption>
      </figure>`,
    )
    .join("");

  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.sections.testimonialsEyebrow}</p>
      <h2 class="section-title" data-reveal>${site.sections.testimonialsTitle}</h2>
      <div class="testimonials__grid">${cards}</div>
    </div>
  `;
}

export function contact({ site, settings }) {
  const endpoint = settings?.contactFormEndpoint?.trim();
  const base =
    typeof window !== "undefined"
      ? window.location.href.split("?")[0].split("#")[0]
      : "";

  return `
    <div class="section-inner">
      <p class="eyebrow" data-reveal>${site.sections.contactEyebrow}</p>
      <h2 class="section-title" data-reveal>${site.sections.contactTitle}</h2>
      <p class="contact__subtitle" data-reveal>${site.sections.contactSubtitle}</p>

      <form class="contact-form" id="contactForm" data-reveal action="${endpoint}" method="POST">
        <input type="hidden" name="_subject" value="New message from ${site.name}'s portfolio">
        <input type="hidden" name="_next" value="${base}?sent=1#contact">
        <input type="text" name="_gotcha" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">

        <div class="field">
          <input type="text" id="name" name="name" required autocomplete="name" placeholder=" ">
          <label for="name">Your name</label>
        </div>
        <div class="field">
          <input type="email" id="email" name="email" required autocomplete="email" placeholder=" ">
          <label for="email">Email address</label>
        </div>
        <div class="field">
          <textarea id="message" name="message" rows="4" required placeholder=" "></textarea>
          <label for="message">Message</label>
        </div>

        <button type="submit" class="btn btn--primary btn--full" data-magnetic>
          <span>Send message</span>
        </button>
      </form>

      <div class="contact-form__success" id="formSuccess" aria-live="polite">
        <svg viewBox="0 0 52 52" class="success-check">
          <circle class="success-check__circle" cx="26" cy="26" r="24" fill="none"/>
          <path class="success-check__mark" fill="none" d="M14 27l7 7 16-16"/>
        </svg>
        <p>Message sent. I'll reply soon.</p>
      </div>
    </div>
  `;
}

export function footer({ site, socials }) {
  const links = socials
    .filter((s) => s.href)
    .map(
      (s) =>
        `<a href="${s.href}" ${s.href.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'}>${s.label}</a>`,
    )
    .join("");

  return `
    <div class="section-inner footer__inner">
      <span class="footer__mono">${site.footer.tagline}</span>
      <div class="footer__links">${links}</div>
      <button class="footer__top" id="backToTop" aria-label="Back to top">\u2191</button>
    </div>
  `;
}
