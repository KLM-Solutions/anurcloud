"use client";

/**
 * Shared building blocks for the React (TSX) card components.
 *
 * Keeps the section model, the small presentational pieces, and the theme helpers
 * in one place so each card (SkillMeters, SplitHalves, …) reuses them instead of
 * repeating the field-by-field logic. Pure/presentational only — each card owns
 * its own layout and CSS.
 */

import { useState, type CSSProperties } from "react";
import type { CardProfile, SocialLink, ThemeOptions } from "@/templates/types";
import { safeUrl, initials } from "@/templates/helpers";
import { BRAND_ICONS } from "@/templates/icons";
import { socialKey } from "@/templates/sections";

export const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/* ── per-template default palette ─────────────────────────────────────────────
 * Each template has its own default colour, so the set does not read as one
 * crimson family when no brand colour was derived. A real brand colour (from the
 * logo/site) ALWAYS wins — this is only the fallback. Each is a strong hue that
 * carries white text; `accent` is a lighter sibling used in gradients.
 */
export const CARD_PALETTE: Record<string, { primary: string; accent: string }> = {
  "skill-meters": { primary: "#4f46e5", accent: "#6366f1" }, // indigo
  "split-halves": { primary: "#0d9488", accent: "#14b8a6" }, // teal
  overlap: { primary: "#ea580c", accent: "#f97316" }, // orange
  numbered: { primary: "#7c3aed", accent: "#8b5cf6" }, // violet
  "folder-tab": { primary: "#047857", accent: "#059669" }, // emerald
  "stat-strip": { primary: "#2563eb", accent: "#3b82f6" }, // blue
  "role-ladder": { primary: "#be123c", accent: "#e11d48" }, // rose (the original)
  letterhead: { primary: "#1e3a8a", accent: "#3b82f6" }, // navy (stationery)
  "edge-spine": { primary: "#0891b2", accent: "#06b6d4" }, // cyan
  "pull-quote": { primary: "#a21caf", accent: "#c026d3" }, // plum
  badge: { primary: "#dc2626", accent: "#ef4444" }, // red
  spotlight: { primary: "#b45309", accent: "#d97706" }, // amber

  // student pool — each its own default hue too
  "side-rail": { primary: "#0369a1", accent: "#0284c7" }, // sky
  "hero-split": { primary: "#7c3aed", accent: "#8b5cf6" }, // violet
  "centre-portrait": { primary: "#be123c", accent: "#e11d48" }, // rose
  timeline: { primary: "#0d9488", accent: "#14b8a6" }, // teal
  "tile-grid": { primary: "#c2410c", accent: "#ea580c" }, // orange
  "ticket-stub": { primary: "#9333ea", accent: "#a855f7" }, // purple
  "corner-wedge": { primary: "#0891b2", accent: "#06b6d4" }, // cyan
  "monogram-block": { primary: "#1e3a8a", accent: "#3b82f6" }, // navy
  "index-ledger": { primary: "#4d7c0f", accent: "#65a30d" }, // olive
  "column-flow": { primary: "#a21caf", accent: "#c026d3" }, // plum
};

/**
 * The theme a card should render with: the caller's brand theme when it carries a
 * colour, otherwise the template's default palette. Returns the options unchanged
 * when there is no palette entry for the key.
 */
export function cardTheme(key: string, provided?: ThemeOptions): ThemeOptions {
  const hasBrand =
    !!provided &&
    (typeof provided.colors === "string" || (typeof provided.colors === "object" && !!provided.colors?.primary));
  if (hasBrand) return provided!;
  const pal = CARD_PALETTE[key];
  if (!pal) return provided ?? {};
  const base = typeof provided?.colors === "object" ? provided.colors : {};
  return { ...(provided ?? {}), colors: { ...base, primary: pal.primary, accent: pal.accent } };
}

export const joinParts = (parts: Array<string | null | undefined>, sep = " · ") =>
  parts.filter(nonEmpty).join(sep);

/** Parse the resolved inline var string into a React style object. */
export function styleObject(rootStyle: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of rootStyle.split(";")) {
    const i = decl.indexOf(":");
    if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim();
  }
  return out as CSSProperties;
}

/* ── presentational pieces (JSX; text is auto-escaped by React) ──────────────── */

/**
 * The identity circle (React path). Mirrors the string `avatar()` helper: a logo
 * fills the circle when supplied, else an uploaded photo, else the initials. Only
 * the two avatar cards (Badge, Spotlight) use this.
 */
export function Avatar({ profile, cls = "", logoUrl }: { profile: CardProfile; cls?: string; logoUrl?: string | null }) {
  const logo = logoUrl ? safeUrl(logoUrl, { allowDataImage: true }) : null;
  if (logo) {
    return (
      <div className={`iv-av iv-av-logo ${cls}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${nonEmpty(profile.fullName) ? profile.fullName + " " : ""}logo`} />
      </div>
    );
  }
  const src = profile.photoUrl ? safeUrl(profile.photoUrl, { allowDataImage: true }) : null;
  if (src) {
    return (
      <div className={`iv-av ${cls}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={profile.fullName ?? "photo"} />
      </div>
    );
  }
  return (
    <div className={`iv-av iv-av-fallback ${cls}`}>
      <span>{initials(profile.fullName)}</span>
    </div>
  );
}

export function Chips({ items }: { items: string[] }) {
  const list = (items ?? []).filter(nonEmpty);
  if (!list.length) return null;
  return (
    <div className="iv-chips">
      {list.map((c, i) => (
        <span key={i} className="iv-chip">
          {c}
        </span>
      ))}
    </div>
  );
}

/**
 * Brand-icon circles for social links (React path). Same geometry + colours as the
 * string cards (`BRAND_ICONS` / `socialKey`): a stored `path` draws the SVG glyph
 * white on the brand fill; otherwise the ≤2-char text label shows. Missing → null.
 */
export function SocialIcons({ links, big = false }: { links: SocialLink[] | undefined; big?: boolean }) {
  const list = (links ?? [])
    .map((l) => ({ platform: l.platform, href: safeUrl(l.url) }))
    .filter((l): l is { platform: string | null; href: string } => l.href !== null);
  if (!list.length) return null;
  return (
    <div className={big ? "iv-socials iv-social-lg" : "iv-socials"}>
      {list.map((l, i) => {
        const meta = BRAND_ICONS[socialKey(l.platform)] ?? BRAND_ICONS.website!;
        return (
          <a
            key={i}
            className="iv-si"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: meta.bg }}
            aria-label={l.platform ?? "link"}
          >
            {meta.path ? (
              <svg className="iv-si-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={meta.path} />
              </svg>
            ) : (
              meta.label
            )}
          </a>
        );
      })}
    </div>
  );
}

export interface Row {
  title?: string | null;
  meta?: string | null;
  desc?: string | null;
  bullets?: string[];
  href?: string | null;
}

export function Items({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((r, i) => {
        const href = r.href ? safeUrl(r.href) : null;
        return (
          <div key={i} className="iv-item">
            {nonEmpty(r.title) &&
              (href ? (
                <a className="iv-item-t" href={href} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
              ) : (
                <div className="iv-item-t">{r.title}</div>
              ))}
            {nonEmpty(r.meta) && <div className="iv-item-m">{r.meta}</div>}
            {nonEmpty(r.desc) && <div className="iv-item-d">{r.desc}</div>}
            {r.bullets && r.bullets.length > 0 && (
              <ul className="iv-hl">
                {r.bullets.filter(nonEmpty).map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Accordion — tap-to-expand section rows. Each row toggles its content inline (no
 * separate screen); multiple rows can be open at once. `firstOpen` opens the first
 * row on mount so the body never starts fully collapsed.
 */
export interface AccRow {
  key: string;
  label: string;
  node: React.ReactNode;
}
export function Accordion({ rows, firstOpen = true }: { rows: AccRow[]; firstOpen?: boolean }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    firstOpen && rows[0] ? { [rows[0].key]: true } : {},
  );
  return (
    <div className="iv-acc">
      {rows.map((r) => {
        const isOpen = !!open[r.key];
        return (
          <div key={r.key} className={`iv-acc-row${isOpen ? " iv-acc-open" : ""}`}>
            <button
              type="button"
              className="iv-acc-head"
              aria-expanded={isOpen}
              onClick={() => setOpen((s) => ({ ...s, [r.key]: !s[r.key] }))}
            >
              <span className="iv-acc-label">{r.label}</span>
              <span className="iv-acc-chev" aria-hidden>{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && <div className="iv-acc-body">{r.node}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ── section model ──────────────────────────────────────────────────────────── */

export type Kind = "long" | "list" | "chips";
export interface Section {
  key: string;
  label: string;
  node: React.ReactNode;
  count: number;
  kind: Kind;
}

/** A big section (>4) gets its own screen; a small one is shown in full inline. */
export function isBig(sec: Section): boolean {
  if (sec.kind === "long") return true;
  if (sec.kind === "chips") return Math.ceil(sec.count / 4) > 4;
  return sec.count * 2 > 4;
}

/**
 * The section set for a professional profile, in order. Only sections with content
 * are returned (a missing field produces no section). Skills is included as a
 * section here; cards that also draw a chart (Skill Meters) render that separately.
 */
export function professionalSections(p: CardProfile): Section[] {
  const s: Section[] = [];
  const add = (sec: Section, present: boolean) => {
    if (present) s.push(sec);
  };

  add(
    {
      key: "experience",
      label: "Experience",
      count: p.experience.length,
      kind: "long",
      node: (
        <Items
          rows={p.experience.map((e) => ({
            title: joinParts([e.role, e.company]),
            meta: joinParts([e.duration, e.location]),
            bullets: e.highlights,
          }))}
        />
      ),
    },
    p.experience.length > 0,
  );
  add(
    {
      key: "projects",
      label: "Projects",
      count: p.projects.length,
      kind: "list",
      node: (
        <Items
          rows={p.projects.map((pr) => ({
            title: pr.title,
            href: pr.link,
            desc: pr.description,
            meta: (pr.technologies ?? []).filter(nonEmpty).join(" · "),
          }))}
        />
      ),
    },
    p.projects.length > 0,
  );
  add({ key: "skills", label: "Skills", count: p.skills.length, kind: "chips", node: <Chips items={p.skills} /> }, p.skills.length > 0);
  add(
    {
      key: "education",
      label: "Education",
      count: p.education.length,
      kind: "list",
      node: <Items rows={p.education.map((e) => ({ title: joinParts([e.degree, e.field], ", "), meta: joinParts([e.institution, e.year, e.grade]) }))} />,
    },
    p.education.length > 0,
  );
  add(
    {
      key: "certs",
      label: "Certifications",
      count: p.certifications.length,
      kind: "list",
      node: <Items rows={p.certifications.map((c) => ({ title: c.name, meta: joinParts([c.issuer, c.year]) }))} />,
    },
    p.certifications.length > 0,
  );
  add(
    {
      key: "awards",
      label: "Awards",
      count: p.achievements.length,
      kind: "list",
      node: <Items rows={p.achievements.map((a) => ({ title: a.title, meta: a.year ?? "" }))} />,
    },
    p.achievements.length > 0,
  );
  add(
    {
      key: "papers",
      label: "Publications",
      count: p.publications.length,
      kind: "list",
      node: <Items rows={p.publications.map((pub) => ({ title: pub.title, href: pub.link, meta: joinParts([pub.venue, pub.year]) }))} />,
    },
    p.publications.length > 0,
  );
  add(
    {
      key: "registrations",
      label: "Registrations",
      count: p.registrations.length,
      kind: "chips",
      node: <Items rows={p.registrations.map((r) => ({ title: r.type, meta: r.id ?? "" }))} />,
    },
    p.registrations.length > 0,
  );
  add({ key: "languages", label: "Languages", count: p.languages.length, kind: "chips", node: <Chips items={p.languages} /> }, p.languages.length > 0);

  // Social links live in the hero (see each card's header). The Links section
  // carries only websites, so the two do not duplicate.
  const websiteRows: Row[] = p.websites.map((u) => ({ title: u.replace(/^https?:\/\//i, ""), href: u }));
  add(
    { key: "links", label: "Links", count: websiteRows.length, kind: "chips", node: <Items rows={websiteRows} /> },
    websiteRows.length > 0,
  );

  const contact = [p.email, p.phone, p.location].filter(nonEmpty);
  add({ key: "contact", label: "Contact", count: contact.length, kind: "chips", node: <Chips items={contact} /> }, contact.length > 0);

  return s;
}

/**
 * The section set for a STUDENT profile, in order. Same shape as the professional
 * set but with the student families — education leads, plus internships and
 * activities (extcurriculars), and no experience/registrations. Only sections with
 * content are returned.
 */
export function studentSections(p: CardProfile): Section[] {
  const s: Section[] = [];
  const add = (sec: Section, present: boolean) => {
    if (present) s.push(sec);
  };

  add(
    {
      key: "education",
      label: "Education",
      count: p.education.length,
      kind: "list",
      node: <Items rows={p.education.map((e) => ({ title: joinParts([e.degree, e.field], ", "), meta: joinParts([e.institution, e.year, e.grade]) }))} />,
    },
    p.education.length > 0,
  );
  add(
    {
      key: "projects",
      label: "Projects",
      count: p.projects.length,
      kind: "list",
      node: (
        <Items
          rows={p.projects.map((pr) => ({
            title: pr.title,
            href: pr.link,
            desc: pr.description,
            meta: (pr.technologies ?? []).filter(nonEmpty).join(" · "),
          }))}
        />
      ),
    },
    p.projects.length > 0,
  );
  add(
    {
      key: "internships",
      label: "Internships",
      count: p.internships.length,
      kind: "list",
      node: <Items rows={p.internships.map((i) => ({ title: joinParts([i.role, i.organization]), meta: i.duration, desc: i.description }))} />,
    },
    p.internships.length > 0,
  );
  add(
    {
      key: "certs",
      label: "Certifications",
      count: p.certifications.length,
      kind: "list",
      node: <Items rows={p.certifications.map((c) => ({ title: c.name, meta: joinParts([c.issuer, c.year]) }))} />,
    },
    p.certifications.length > 0,
  );
  add({ key: "skills", label: "Skills", count: p.skills.length, kind: "chips", node: <Chips items={p.skills} /> }, p.skills.length > 0);
  add(
    {
      key: "awards",
      label: "Awards",
      count: p.achievements.length,
      kind: "list",
      node: <Items rows={p.achievements.map((a) => ({ title: a.title, meta: a.year ?? "" }))} />,
    },
    p.achievements.length > 0,
  );
  add(
    {
      key: "papers",
      label: "Publications",
      count: p.publications.length,
      kind: "list",
      node: <Items rows={p.publications.map((pub) => ({ title: pub.title, href: pub.link, meta: joinParts([pub.venue, pub.year]) }))} />,
    },
    p.publications.length > 0,
  );
  add(
    {
      key: "activities",
      label: "Activities",
      count: p.extracurriculars.length,
      kind: "list",
      node: <Items rows={p.extracurriculars.map((x) => ({ title: x.activity, meta: x.role ?? "" }))} />,
    },
    p.extracurriculars.length > 0,
  );
  add({ key: "languages", label: "Languages", count: p.languages.length, kind: "chips", node: <Chips items={p.languages} /> }, p.languages.length > 0);

  const websiteRows: Row[] = p.websites.map((u) => ({ title: u.replace(/^https?:\/\//i, ""), href: u }));
  add(
    { key: "links", label: "Links", count: websiteRows.length, kind: "chips", node: <Items rows={websiteRows} /> },
    websiteRows.length > 0,
  );

  const contact = [p.email, p.phone, p.location].filter(nonEmpty);
  add({ key: "contact", label: "Contact", count: contact.length, kind: "chips", node: <Chips items={contact} /> }, contact.length > 0);

  return s;
}
