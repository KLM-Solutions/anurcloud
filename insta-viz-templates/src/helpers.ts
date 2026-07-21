/** Shared, dependency-free render helpers used by every template. */

import type { CardProfile, ProfileType, SocialLink } from "./types.js";

/** HTML-escape untrusted text before interpolating into a template string. */
export function esc(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape a value for use inside an HTML attribute (e.g. url, style). */
export function attr(value: unknown): string {
  return esc(value);
}

export function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** Remove whitespace + control chars (code point <= 0x20, or DEL) without a regex. */
function stripControl(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

/**
 * Sanitize a URL for use in href/src. Profile data comes from extracted résumés
 * and crawled pages (untrusted), so we allow only known-safe schemes and reject
 * `javascript:`, `data:` (non-image), etc. Returns null if the URL is unsafe.
 * The returned value must still be HTML-attribute-escaped via attr()/esc().
 */
export function safeUrl(
  value: unknown,
  { allowDataImage = false }: { allowDataImage?: boolean } = {},
): string | null {
  if (!nonEmpty(value)) return null;
  // control chars (tab/newline/etc.) could hide a scheme e.g. "java\tscript:" — strip them first
  const cleaned = stripControl(value);
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (/^mailto:/i.test(cleaned) || /^tel:/i.test(cleaned)) return cleaned;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(cleaned)) return cleaned;
  // protocol-relative //host → assume https
  if (/^\/\//.test(cleaned)) return "https:" + cleaned;
  // bare domain (no scheme) → assume https; reject anything carrying a foreign scheme
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i.test(cleaned) && !/^[a-z][a-z0-9+.-]*:/i.test(cleaned)) {
    return "https://" + cleaned;
  }
  return null;
}

/** Up to two initials from a name, for the photo fallback. */
export function initials(name?: string | null): string {
  if (!nonEmpty(name)) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

export function profileTypeOf(profile: CardProfile): ProfileType {
  return profile.profileType === "student" ? "student" : "professional";
}

/** Best available short blurb: enhanced bio first, then summary. */
export function blurb(profile: CardProfile): string | null {
  if (nonEmpty(profile.bio)) return profile.bio!.trim();
  if (nonEmpty(profile.summary)) return profile.summary!.trim();
  return null;
}

/**
 * Audience-differentiating header pill.
 * professional → years of experience / current company; student → graduating class.
 */
export function credentialPill(profile: CardProfile): string {
  if (profileTypeOf(profile) === "professional") {
    let label = "Professional";
    if (nonEmpty(profile.totalYearsExperience)) {
      const yrs = profile.totalYearsExperience!.trim();
      label = /year|yr/i.test(yrs) ? yrs : `${yrs} yrs exp`;
    } else if (nonEmpty(profile.currentCompany)) {
      label = profile.currentCompany!.trim();
    }
    return `<span class="iv-cred">💼 ${esc(label)}</span>`;
  }
  const year = (profile.education ?? []).map((e) => e.year).find(nonEmpty);
  const label = nonEmpty(year) ? `Class of ${year!.trim()}` : "Student";
  return `<span class="iv-cred">🎓 ${esc(label)}</span>`;
}

/* ── social icons (inline SVG so no external deps / fonts) ── */

const SOCIAL: Record<string, { label: string; bg: string }> = {
  linkedin: { label: "in", bg: "#0A66C2" },
  instagram: { label: "ig", bg: "#E1306C" },
  facebook: { label: "f", bg: "#1877F2" },
  x: { label: "𝕏", bg: "#111111" },
  twitter: { label: "𝕏", bg: "#111111" },
  github: { label: "gh", bg: "#181717" },
  youtube: { label: "yt", bg: "#FF0000" },
  website: { label: "🌐", bg: "#334155" },
  portfolio: { label: "🌐", bg: "#334155" },
};

function socialKey(platform?: string | null): string {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("insta")) return "instagram";
  if (p.includes("face")) return "facebook";
  if (p === "x" || p.includes("twitter")) return "x";
  if (p.includes("git")) return "github";
  if (p.includes("you")) return "youtube";
  if (p.includes("port") || p.includes("web") || p.includes("site")) return "website";
  return "website";
}

export function socialIcons(links: SocialLink[] | undefined, max = 4): string {
  const list = (links ?? [])
    .map((l) => ({ platform: l.platform, href: safeUrl(l.url) }))
    .filter((l): l is { platform: string | null | undefined; href: string } => l.href !== null)
    .slice(0, max);
  if (list.length === 0) return "";
  return list
    .map((l) => {
      const meta = SOCIAL[socialKey(l.platform)] ?? SOCIAL.website!;
      return `<a class="iv-si" href="${attr(l.href)}" target="_blank" rel="noopener noreferrer" style="background:${meta.bg}" aria-label="${attr(l.platform ?? "link")}">${esc(meta.label)}</a>`;
    })
    .join("");
}

/** Count of links that survive URL sanitization (matches what socialIcons renders). */
export function socialCount(links: SocialLink[] | undefined): number {
  return (links ?? []).filter((l) => safeUrl(l.url) !== null).length;
}

/* ── contact rows ── */

export function contactRows(profile: CardProfile): string {
  const rows: Array<[string, string]> = [];
  if (nonEmpty(profile.phone)) rows.push(["Mobile", profile.phone!]);
  if (nonEmpty(profile.email)) rows.push(["E-mail", profile.email!]);
  if (nonEmpty(profile.location)) rows.push(["Location", profile.location!]);
  if (rows.length === 0) return "";
  return rows
    .map(
      ([label, value]) =>
        `<div class="iv-crow"><span class="iv-clabel">${esc(label)}</span><span class="iv-cval">${esc(value)}</span></div>`,
    )
    .join("");
}

/* ── skill / tech chips ── */

export function chips(items: string[] | undefined, max = 6): string {
  const list = (items ?? []).filter(nonEmpty).slice(0, max);
  if (list.length === 0) return "";
  return `<div class="iv-chips">${list.map((s) => `<span class="iv-chip">${esc(s)}</span>`).join("")}</div>`;
}

/* ── logo block ── */

export function logoBlock(
  logo: { url?: string; text?: string; height?: number } | null,
): string {
  const src = safeUrl(logo?.url, { allowDataImage: true });
  if (src) {
    const h = logo?.height ?? 22;
    return `<img class="iv-logo-img" src="${attr(src)}" alt="logo" style="height:${h}px" />`;
  }
  const text = logo?.text;
  if (nonEmpty(text)) return `<span class="iv-logo-txt">${esc(text)}</span>`;
  return `<span class="iv-logo-txt iv-logo-empty">Logo</span>`;
}

/* ── audience motif banner (student vs professional) ── */

export function bannerSVG(profileType: ProfileType, vertical = false): string {
  const vb = vertical ? "0 0 60 200" : "0 0 300 80";
  const style = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.32;z-index:0";
  const common = `xmlns="http://www.w3.org/2000/svg" style="${style}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice"`;

  if (profileType === "student") {
    return `<svg ${common}><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(18,10) rotate(-14)"><polygon points="9,2 17,6 9,10 1,6" fill="#fff" stroke="none" opacity=".55"/><line x1="9" y1="6" x2="9" y2="13" stroke-width="1.4"/><path d="M5,9.5 Q5,14 9,14 Q13,14 13,9.5" stroke-width="1.3"/></g>
      <g transform="translate(70,6) rotate(6) scale(.9)" stroke-width="1.2"><path d="M1,2 Q7,0 9,3 Q11,0 17,2 L17,14 Q11,12 9,15 Q7,12 1,14 Z"/><line x1="9" y1="3" x2="9" y2="15"/></g>
      <g transform="translate(120,14) rotate(28)" stroke-width="1.2"><rect x="3.5" y="1" width="5" height="12" rx="1"/><polygon points="3.5,13 8.5,13 6,17.5" fill="#fff" stroke="none"/></g>
      <g transform="translate(170,6) rotate(8)" stroke-width="1.1"><path d="M9,0 L10.5,7 L18,9 L10.5,11 L9,18 L7.5,11 L0,9 L7.5,7 Z" fill="#fff" opacity=".35" stroke="none"/><path d="M9,0 L10.5,7 L18,9 L10.5,11 L9,18 L7.5,11 L0,9 L7.5,7 Z"/></g>
      <g transform="translate(224,10) rotate(10) scale(.8)"><polygon points="9,2 17,6 9,10 1,6" fill="#fff" stroke="none" opacity=".45"/><line x1="9" y1="6" x2="9" y2="13" stroke-width="1.6"/></g>
      <g transform="translate(270,6) rotate(-5) scale(.78)" stroke-width="1.3"><path d="M1,2 Q7,0 9,3 Q11,0 17,2 L17,14 Q11,12 9,15 Q7,12 1,14 Z"/><line x1="9" y1="3" x2="9" y2="15"/></g>
    </g></svg>`;
  }

  return `<svg ${common}><g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(16,9) rotate(-9)" stroke-width="1.3"><rect x="1" y="6" width="16" height="11" rx="2"/><path d="M6,6 L6,3.5 Q6,1.5 9,1.5 Q12,1.5 12,3.5 L12,6"/><line x1="1" y1="11" x2="17" y2="11"/></g>
    <g transform="translate(66,8) rotate(4)"><rect x="0" y="10" width="3.5" height="8" fill="#fff" opacity=".55"/><rect x="5.5" y="7" width="3.5" height="11" fill="#fff" opacity=".65"/><rect x="11" y="3" width="3.5" height="15" fill="#fff" opacity=".75"/></g>
    <g transform="translate(114,6) rotate(3)" stroke-width="1.2"><rect x="2" y="1" width="13" height="17" rx="1"/><rect x="4" y="4" width="2" height="2" fill="#fff" stroke="none" opacity=".6"/><rect x="8.5" y="4" width="2" height="2" fill="#fff" stroke="none" opacity=".6"/><rect x="4" y="8" width="2" height="2" fill="#fff" stroke="none" opacity=".6"/></g>
    <g transform="translate(160,7) rotate(5)" stroke-width="1.2"><polygon points="9,1 18,8 9,18 0,8"/><line x1="0" y1="8" x2="18" y2="8"/></g>
    <g transform="translate(210,9) rotate(0)" stroke-width="1.2"><circle cx="9" cy="9" r="4.5"/><line x1="9" y1="0" x2="9" y2="4.5"/><line x1="9" y1="13.5" x2="9" y2="18"/><line x1="0" y1="9" x2="4.5" y2="9"/><line x1="13.5" y1="9" x2="18" y2="9"/></g>
    <g transform="translate(260,8) rotate(12) scale(.85)" stroke-width="1.4"><rect x="1" y="6" width="16" height="11" rx="2"/><path d="M6,6 L6,3.5 Q6,1.5 9,1.5 Q12,1.5 12,3.5 L12,6"/></g>
  </g></svg>`;
}

/* ── photo / avatar ── */

export function avatar(profile: CardProfile, cls = ""): string {
  const src = safeUrl(profile.photoUrl, { allowDataImage: true });
  if (src) {
    return `<div class="iv-av ${cls}"><img src="${attr(src)}" alt="${attr(profile.fullName ?? "photo")}" /></div>`;
  }
  return `<div class="iv-av iv-av-fallback ${cls}"><span>${esc(initials(profile.fullName))}</span></div>`;
}
