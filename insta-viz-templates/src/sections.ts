/** Reusable body sections shared by the templates (data-driven, audience-aware). */

import type { CardProfile } from "./types.js";
import {
  blurb,
  chips,
  contactRows,
  esc,
  nonEmpty,
  profileTypeOf,
  socialCount,
  socialIcons,
} from "./helpers.js";

export function bioBlock(profile: CardProfile): string {
  const text = blurb(profile);
  return nonEmpty(text) ? `<p class="iv-bio">${esc(text)}</p>` : "";
}

export function contactBlock(profile: CardProfile): string {
  const rows = contactRows(profile);
  if (!rows) return "";
  return `<div class="iv-contact">
    <div class="iv-ctitle">Contact Details</div>
    ${rows}
  </div>`;
}

export function skillsBlock(profile: CardProfile): string {
  return chips(profile.skills, 6);
}

export function socialBlock(profile: CardProfile): string {
  const count = socialCount(profile.socialLinks);
  const icons = socialIcons(profile.socialLinks, 4);
  if (count === 0) return "";
  return `<div class="iv-social">
    <div class="iv-scount"><b>${String(count).padStart(2, "0")}</b><span>Active social ${count === 1 ? "link" : "links"}</span></div>
    <div class="iv-sirow">${icons}</div>
  </div>`;
}

export function ctaBlock(profile: CardProfile): string {
  const wa = nonEmpty(profile.phone)
    ? `<a class="iv-btn iv-btn-wa" href="https://wa.me/${encodeURIComponent(profile.phone!.replace(/[^\d+]/g, ""))}">💬 WhatsApp</a>`
    : `<span class="iv-btn iv-btn-wa">💬 WhatsApp</span>`;
  return `<div class="iv-cta">
    ${wa}
    <span class="iv-btn iv-btn-accent">👤 About me</span>
  </div>`;
}

/** One education item, if present. */
export function educationBlock(profile: CardProfile): string {
  const ed = (profile.education ?? []).find((e) => nonEmpty(e.degree) || nonEmpty(e.institution));
  if (!ed) return "";
  const head = [ed.degree, ed.field].filter(nonEmpty).join(" · ");
  const meta = [ed.institution, ed.year].filter(nonEmpty).join(" · ");
  return `<div class="iv-sec">
    <div class="iv-sec-title">Education</div>
    <div class="iv-item">
      <div class="iv-item-h">${esc(head || ed.institution || "")}</div>
      ${meta ? `<div class="iv-item-meta">${esc(meta)}</div>` : ""}
    </div>
  </div>`;
}

/**
 * Audience-aware highlight: professionals show their latest experience;
 * students show a top project or internship.
 */
export function highlightBlock(profile: CardProfile): string {
  if (profileTypeOf(profile) === "professional") {
    const exp = (profile.experience ?? []).find((e) => nonEmpty(e.role) || nonEmpty(e.company));
    if (!exp) return "";
    const meta = [exp.company, exp.duration].filter(nonEmpty).join(" · ");
    const highlight = (exp.highlights ?? []).filter(nonEmpty)[0];
    return `<div class="iv-sec">
      <div class="iv-sec-title">Experience</div>
      <div class="iv-item">
        <div class="iv-item-h">${esc(exp.role ?? "")}</div>
        ${meta ? `<div class="iv-item-sub">${esc(meta)}</div>` : ""}
        ${nonEmpty(highlight) ? `<div class="iv-item-desc">${esc(highlight)}</div>` : ""}
      </div>
    </div>`;
  }

  const proj = (profile.projects ?? []).find((p) => nonEmpty(p.title));
  if (proj) {
    return `<div class="iv-sec">
      <div class="iv-sec-title">Project</div>
      <div class="iv-item">
        <div class="iv-item-h">${esc(proj.title ?? "")}</div>
        ${nonEmpty(proj.description) ? `<div class="iv-item-desc">${esc(proj.description)}</div>` : ""}
      </div>
    </div>`;
  }

  const intern = (profile.internships ?? []).find((i) => nonEmpty(i.role) || nonEmpty(i.organization));
  if (intern) {
    const meta = [intern.organization, intern.duration].filter(nonEmpty).join(" · ");
    return `<div class="iv-sec">
      <div class="iv-sec-title">Internship</div>
      <div class="iv-item">
        <div class="iv-item-h">${esc(intern.role ?? "")}</div>
        ${meta ? `<div class="iv-item-sub">${esc(meta)}</div>` : ""}
        ${nonEmpty(intern.description) ? `<div class="iv-item-desc">${esc(intern.description)}</div>` : ""}
      </div>
    </div>`;
  }
  return "";
}

/* ── audience-differentiated layout ── */

/** Professional-only stat tiles (years of experience, current company). */
export function statStrip(profile: CardProfile): string {
  if (profileTypeOf(profile) !== "professional") return "";
  const tiles: Array<[string, string]> = [];
  if (nonEmpty(profile.totalYearsExperience)) {
    const yrs = profile.totalYearsExperience!.trim();
    tiles.push(["Experience", /year|yr/i.test(yrs) ? yrs : `${yrs} yrs`]);
  }
  if (nonEmpty(profile.currentCompany)) tiles.push(["Company", profile.currentCompany!.trim()]);
  if (tiles.length === 0) return "";
  return `<div class="iv-stats">${tiles
    .map(([l, v]) => `<div class="iv-stat"><div class="iv-stat-v">${esc(v)}</div><div class="iv-stat-l">${esc(l)}</div></div>`)
    .join("")}</div>`;
}

/** Up to two roles (professional). */
export function experienceSection(profile: CardProfile): string {
  const items = (profile.experience ?? []).filter((e) => nonEmpty(e.role) || nonEmpty(e.company)).slice(0, 2);
  if (items.length === 0) return "";
  const rows = items
    .map((exp) => {
      const meta = [exp.company, exp.duration].filter(nonEmpty).join(" · ");
      const hl = (exp.highlights ?? []).filter(nonEmpty)[0];
      return `<div class="iv-item"><div class="iv-item-h">${esc(exp.role ?? "")}</div>${meta ? `<div class="iv-item-sub">${esc(meta)}</div>` : ""}${nonEmpty(hl) ? `<div class="iv-item-desc">${esc(hl)}</div>` : ""}</div>`;
    })
    .join("");
  return `<div class="iv-sec"><div class="iv-sec-title">Experience</div>${rows}</div>`;
}

/** Up to two projects (student), falling back to internships. */
export function projectsSection(profile: CardProfile): string {
  const projects = (profile.projects ?? []).filter((p) => nonEmpty(p.title)).slice(0, 2);
  if (projects.length > 0) {
    const rows = projects
      .map((p) => `<div class="iv-item"><div class="iv-item-h">${esc(p.title ?? "")}</div>${nonEmpty(p.description) ? `<div class="iv-item-desc">${esc(p.description)}</div>` : ""}</div>`)
      .join("");
    return `<div class="iv-sec"><div class="iv-sec-title">Projects</div>${rows}</div>`;
  }
  const interns = (profile.internships ?? []).filter((i) => nonEmpty(i.role) || nonEmpty(i.organization)).slice(0, 2);
  if (interns.length === 0) return "";
  const rows = interns
    .map((i) => {
      const meta = [i.organization, i.duration].filter(nonEmpty).join(" · ");
      return `<div class="iv-item"><div class="iv-item-h">${esc(i.role ?? i.organization ?? "")}</div>${meta ? `<div class="iv-item-sub">${esc(meta)}</div>` : ""}${nonEmpty(i.description) ? `<div class="iv-item-desc">${esc(i.description)}</div>` : ""}</div>`;
    })
    .join("");
  return `<div class="iv-sec"><div class="iv-sec-title">Internships</div>${rows}</div>`;
}

/**
 * Audience-ordered card body (shared by all templates).
 * Professional → stats + experience first, then skills. Student → skills + projects first.
 */
export function audienceBody(profile: CardProfile): string {
  if (profileTypeOf(profile) === "professional") {
    return [
      bioBlock(profile),
      statStrip(profile),
      experienceSection(profile),
      skillsBlock(profile),
      educationBlock(profile),
      contactBlock(profile),
      socialBlock(profile),
      ctaBlock(profile),
    ].join("\n");
  }
  return [
    bioBlock(profile),
    skillsBlock(profile),
    projectsSection(profile),
    educationBlock(profile),
    contactBlock(profile),
    socialBlock(profile),
    ctaBlock(profile),
  ].join("\n");
}
