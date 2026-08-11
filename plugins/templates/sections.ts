/**
 * Reusable content blocks shared by every card.
 *
 * Every function here returns "" when it has nothing to show — never an empty
 * heading, an orphan rule or a blank tile. Cards compose these with
 * `section()` / `joinBlocks()` from guards.ts and stay free of presence checks.
 *
 * Layout-specific markup (a rail, a spine, a grid) belongs in the individual
 * card files, not here.
 */

import type { CardProfile, SocialLink, TimelineEntry } from "./types";
import { attr, esc, joinParts, nonEmpty, safeUrl } from "./helpers";
import {
  hasList,
  meaningfulEducation,
  meaningfulExperience,
  meaningfulInternship,
  meaningfulProject,
} from "./guards";

/* ── identity ─────────────────────────────────────────────────────────────── */

export function nameBlock(p: CardProfile): string {
  if (!nonEmpty(p.fullName)) return "";
  const sub = joinParts([p.designation, p.currentCompany]);
  return `<div class="iv-name">${esc(p.fullName)}</div>${
    sub ? `<div class="iv-role">${esc(sub)}</div>` : ""
  }`;
}

export function bio(p: CardProfile, maxChars = 240): string {
  if (!nonEmpty(p.bio)) return "";
  const text = p.bio.trim();
  const short = text.length > maxChars ? text.slice(0, maxChars).trimEnd() + "…" : text;
  return `<p class="iv-bio">${esc(short)}</p>`;
}

/* ── contact ──────────────────────────────────────────────────────────────── */

export function contactRows(p: CardProfile): string {
  const rows: Array<[string, string, string | null]> = [];
  if (nonEmpty(p.phone)) rows.push(["Mobile", p.phone, safeUrl(`tel:${p.phone.replace(/\s+/g, "")}`)]);
  if (nonEmpty(p.email)) rows.push(["E-mail", p.email, safeUrl(`mailto:${p.email}`)]);
  if (nonEmpty(p.location)) rows.push(["Location", p.location, null]);
  if (rows.length === 0) return "";
  return rows
    .map(([label, value, href]) => {
      const val = href
        ? `<a class="iv-cval" href="${attr(href)}">${esc(value)}</a>`
        : `<span class="iv-cval">${esc(value)}</span>`;
      return `<div class="iv-crow"><span class="iv-clabel">${esc(label)}</span>${val}</div>`;
    })
    .join("");
}

/** Compact inline contact line, for layouts with no room for rows. */
export function contactInline(p: CardProfile): string {
  const parts = [p.email, p.phone, p.location].filter(nonEmpty);
  if (parts.length === 0) return "";
  return `<div class="iv-cinline">${parts.map((v) => esc(v)).join(" · ")}</div>`;
}

/* ── chips ────────────────────────────────────────────────────────────────── */

export function chips(items: string[] | undefined, max = 8): string {
  const list = (items ?? []).filter(nonEmpty).slice(0, max);
  if (list.length === 0) return "";
  return `<div class="iv-chips">${list
    .map((s) => `<span class="iv-chip">${esc(s)}</span>`)
    .join("")}</div>`;
}

/* ── social ───────────────────────────────────────────────────────────────── */

/**
 * The icon circles.
 *
 * ⚠️ **Labels must be one or two characters.** The circle is a fixed 1.7em and the
 * label is centred in it with no room to spare: `"www"` measured 25.6px of text
 * inside a 16.9px circle and painted 8.7px of itself outside the disc, which is
 * what a user saw and reported on 11 Aug 2026. `.iv-si` now also clips, so a wide
 * label can no longer escape — but clipping is the backstop, not the design.
 * Keep new labels short.
 *
 * The generic mark is an arrow rather than lettering because it is the fallback
 * for *every* platform not listed here, so it has to mean "a link" rather than
 * name a specific service — and one glyph always fits.
 */
const SOCIAL: Record<string, { label: string; bg: string }> = {
  linkedin: { label: "in", bg: "#0A66C2" },
  instagram: { label: "ig", bg: "#E1306C" },
  facebook: { label: "f", bg: "#1877F2" },
  x: { label: "X", bg: "#111111" },
  github: { label: "gh", bg: "#181717" },
  youtube: { label: "yt", bg: "#FF0000" },
  behance: { label: "Be", bg: "#1769FF" },
  dribbble: { label: "dr", bg: "#EA4C89" },
  medium: { label: "M", bg: "#000000" },
  stackoverflow: { label: "so", bg: "#F48024" },
  telegram: { label: "tg", bg: "#26A5E4" },
  whatsapp: { label: "wa", bg: "#25D366" },
  website: { label: "↗", bg: "#334155" },
};

/**
 * Map a free-text platform name onto an icon.
 *
 * Platform names are extracted from CVs and crawled pages, so they arrive as
 * whatever the document said — "LinkedIn", "linked-in", "Behance portfolio". The
 * design ones matter in practice: designers and photographers are a real slice of
 * the audience, and before this they all collapsed into the generic mark.
 */
function socialKey(platform?: string | null): string {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("linked")) return "linkedin";
  if (p.includes("insta")) return "instagram";
  if (p.includes("face")) return "facebook";
  if (p === "x" || p.includes("twitter")) return "x";
  if (p.includes("git")) return "github";
  if (p.includes("you")) return "youtube";
  if (p.includes("behance")) return "behance";
  if (p.includes("dribbb")) return "dribbble";
  if (p.includes("medium")) return "medium";
  if (p.includes("stack")) return "stackoverflow";
  if (p.includes("telegram")) return "telegram";
  if (p.includes("whatsapp")) return "whatsapp";
  return "website";
}

export function socialIcons(links: SocialLink[] | undefined, max = 5): string {
  const list = (links ?? [])
    .map((l) => ({ platform: l.platform, href: safeUrl(l.url) }))
    .filter((l): l is { platform: string | null; href: string } => l.href !== null)
    .slice(0, max);
  if (list.length === 0) return "";
  return `<div class="iv-socials">${list
    .map((l) => {
      const meta = SOCIAL[socialKey(l.platform)] ?? SOCIAL.website!;
      return `<a class="iv-si" href="${attr(l.href)}" target="_blank" rel="noopener noreferrer" style="background:${
        meta.bg
      }" aria-label="${attr(l.platform ?? "link")}">${esc(meta.label)}</a>`;
    })
    .join("")}</div>`;
}

/* ── lists ────────────────────────────────────────────────────────────────── */

export function educationList(p: CardProfile, max = 3): string {
  if (!hasList(p.education, meaningfulEducation)) return "";
  return p.education
    .filter(meaningfulEducation)
    .slice(0, max)
    .map((e) => {
      const head = joinParts([e.degree, e.field], ", ");
      const meta = joinParts([e.institution, e.year, e.grade]);
      return `<div class="iv-item">${head ? `<div class="iv-item-t">${esc(head)}</div>` : ""}${
        meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""
      }</div>`;
    })
    .join("");
}

export function projectList(p: CardProfile, max = 3, withDescription = true): string {
  if (!hasList(p.projects, meaningfulProject)) return "";
  return p.projects
    .filter(meaningfulProject)
    .slice(0, max)
    .map((pr) => {
      const href = safeUrl(pr.link);
      const title = nonEmpty(pr.title)
        ? href
          ? `<a class="iv-item-t" href="${attr(href)}" target="_blank" rel="noopener noreferrer">${esc(
              pr.title,
            )}</a>`
          : `<div class="iv-item-t">${esc(pr.title)}</div>`
        : "";
      const desc =
        withDescription && nonEmpty(pr.description)
          ? `<div class="iv-item-d">${esc(
              pr.description.length > 120 ? pr.description.slice(0, 120).trimEnd() + "…" : pr.description,
            )}</div>`
          : "";
      const tech = (pr.technologies ?? []).filter(nonEmpty).slice(0, 4);
      const techRow = tech.length
        ? `<div class="iv-item-m">${esc(tech.join(" · "))}</div>`
        : "";
      return `<div class="iv-item">${title}${desc}${techRow}</div>`;
    })
    .join("");
}

export function internshipList(p: CardProfile, max = 3): string {
  if (!hasList(p.internships, meaningfulInternship)) return "";
  return p.internships
    .filter(meaningfulInternship)
    .slice(0, max)
    .map((i) => {
      const head = joinParts([i.role, i.organization], " · ");
      return `<div class="iv-item">${head ? `<div class="iv-item-t">${esc(head)}</div>` : ""}${
        nonEmpty(i.duration) ? `<div class="iv-item-m">${esc(i.duration)}</div>` : ""
      }</div>`;
    })
    .join("");
}

export function experienceList(p: CardProfile, max = 3): string {
  if (!hasList(p.experience, meaningfulExperience)) return "";
  return p.experience
    .filter(meaningfulExperience)
    .slice(0, max)
    .map((e) => {
      const head = joinParts([e.role, e.company], " · ");
      const meta = joinParts([e.duration, e.location]);
      return `<div class="iv-item">${head ? `<div class="iv-item-t">${esc(head)}</div>` : ""}${
        meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""
      }</div>`;
    })
    .join("");
}

/**
 * Roles **with their highlight bullets** — the professional set's core block.
 *
 * `experienceList` above is the compact form (role · company + dates) used where
 * there is no room for detail. This is the expanded form: it is the only place
 * `experience[].highlights` reaches a card, and highlights are the field the
 * student schema does not have at all. Cards built on this block therefore
 * cannot be rendered by a student profile, which is the point — the two pools
 * differ in what they can show, not only in how they arrange it.
 */
export function experienceHighlights(p: CardProfile, maxRoles = 3, maxHighlights = 2): string {
  if (!hasList(p.experience, meaningfulExperience)) return "";
  return p.experience
    .filter(meaningfulExperience)
    .slice(0, maxRoles)
    .map((e) => {
      const head = joinParts([e.role, e.company], " · ");
      const meta = joinParts([e.duration, e.location]);
      const points = (e.highlights ?? []).filter(nonEmpty).slice(0, maxHighlights);
      const bullets = points.length
        ? `<ul class="iv-hl">${points
            .map(
              (h) =>
                `<li>${esc(h.length > 110 ? h.slice(0, 110).trimEnd() + "…" : h)}</li>`,
            )
            .join("")}</ul>`
        : "";
      return `<div class="iv-item">${head ? `<div class="iv-item-t">${esc(head)}</div>` : ""}${
        meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""
      }${bullets}</div>`;
    })
    .join("");
}

/**
 * The one line a professional card can show that a student card cannot: the
 * portfolio or personal site. Cleaned upstream, so a present value is linkable.
 */
export function websiteLine(p: CardProfile): string {
  const href = safeUrl(p.website);
  if (!href) return "";
  // Show the host, not the full URL — a card has no room for a query string.
  const label = href.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `<a class="iv-cinline" href="${attr(href)}" target="_blank" rel="noopener noreferrer">${esc(
    label,
  )}</a>`;
}

export function certificationList(p: CardProfile, max = 3): string {
  if (!hasList(p.certifications, (c) => nonEmpty(c.name))) return "";
  return p.certifications
    .filter((c) => nonEmpty(c.name))
    .slice(0, max)
    .map((c) => {
      const meta = joinParts([c.issuer, c.year]);
      return `<div class="iv-item"><div class="iv-item-t">${esc(c.name)}</div>${
        meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""
      }</div>`;
    })
    .join("");
}

/* ── the four families that used to be dropped ────────────────────────────── */

/** Awards and honours. Common to both audiences. */
export function achievementList(p: CardProfile, max = 4): string {
  const list = p.achievements.filter((a) => nonEmpty(a.title)).slice(0, max);
  if (list.length === 0) return "";
  return list
    .map(
      (a) =>
        `<div class="iv-item"><div class="iv-item-t">${esc(a.title)}</div>${
          nonEmpty(a.year) ? `<div class="iv-item-m">${esc(a.year)}</div>` : ""
        }</div>`,
    )
    .join("");
}

/**
 * Papers. Often the most substantial thing on a researcher's or doctor's CV, and
 * the title is the part that matters — so it is not truncated the way a project
 * description is.
 */
export function publicationList(p: CardProfile, max = 4): string {
  const list = p.publications.filter((pub) => nonEmpty(pub.title)).slice(0, max);
  if (list.length === 0) return "";
  return list
    .map((pub) => {
      const href = safeUrl(pub.link);
      const title = href
        ? `<a class="iv-item-t" href="${attr(href)}" target="_blank" rel="noopener noreferrer">${esc(pub.title)}</a>`
        : `<div class="iv-item-t">${esc(pub.title)}</div>`;
      const meta = joinParts([pub.venue, pub.year]);
      return `<div class="iv-item">${title}${meta ? `<div class="iv-item-m">${esc(meta)}</div>` : ""}</div>`;
    })
    .join("");
}

/** Clubs, sport, volunteering. Student-side. */
export function extracurricularList(p: CardProfile, max = 4): string {
  const list = p.extracurriculars.filter((e) => nonEmpty(e.activity)).slice(0, max);
  if (list.length === 0) return "";
  return list
    .map(
      (e) =>
        `<div class="iv-item"><div class="iv-item-t">${esc(e.activity)}</div>${
          nonEmpty(e.role) ? `<div class="iv-item-m">${esc(e.role)}</div>` : ""
        }</div>`,
    )
    .join("");
}

/**
 * Bar Council / Medical Council / ICAI registrations.
 *
 * Rendered as label-and-value rows rather than as a list, because the number is
 * the content — a lawyer's enrolment number is the single most checkable fact on
 * their card, and burying it in a bullet list hides it.
 */
export function registrationRows(p: CardProfile, max = 3): string {
  const list = p.registrations.filter((r) => nonEmpty(r.type) || nonEmpty(r.id)).slice(0, max);
  if (list.length === 0) return "";
  return list
    .map(
      (r) =>
        `<div class="iv-crow"><span class="iv-clabel">${esc(
          r.type ?? "Reg.",
        )}</span><span class="iv-cval">${esc(r.id ?? "")}</span></div>`,
    )
    .join("");
}

/** Every portfolio link, not just the first. */
export function websiteList(p: CardProfile, max = 3): string {
  const list = p.websites
    .map((u) => safeUrl(u))
    .filter((u): u is string => u !== null)
    .slice(0, max);
  if (list.length === 0) return "";
  return list
    .map(
      (href) =>
        `<a class="iv-cinline iv-wlink" href="${attr(href)}" target="_blank" rel="noopener noreferrer">${esc(
          href.replace(/^https?:\/\//i, "").replace(/\/+$/, ""),
        )}</a>`,
    )
    .join("");
}

/* ── timeline ─────────────────────────────────────────────────────────────── */

/**
 * The spine rows for the Timeline card. Already merged and sorted upstream in
 * `lib/profile-to-card.ts` — this only renders.
 *
 * `dateText` is shown verbatim; the derived sort year never reaches the user.
 */
export function timelineRows(entries: TimelineEntry[], max = 8): string {
  const list = entries.slice(0, max);
  if (list.length === 0) return "";
  return list
    .map((e) => {
      const date = nonEmpty(e.dateText) ? `<span class="iv-tl-d">${esc(e.dateText)}</span>` : "";
      const sub = nonEmpty(e.subtitle) ? `<div class="iv-item-m">${esc(e.subtitle)}</div>` : "";
      return `<div class="iv-tl-row"><span class="iv-tl-dot" aria-hidden="true"></span><div class="iv-tl-body">${date}<div class="iv-item-t">${esc(
        e.title,
      )}</div>${sub}</div></div>`;
    })
    .join("");
}
