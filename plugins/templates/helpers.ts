/**
 * Dependency-free render helpers shared by every card.
 *
 * The escaping and URL-sanitising here is load-bearing: profile data comes from
 * extracted résumés and crawled pages, so all of it is untrusted. Every value
 * interpolated into a template string must go through `esc()` / `attr()`, and
 * every href/src through `safeUrl()`.
 */

import type { CardProfile } from "./types";

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

/** Escape a value for use inside an HTML attribute. */
export function attr(value: unknown): string {
  return esc(value);
}

export function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** Strip whitespace + control chars without a regex (code point <= 0x20, or DEL). */
function stripControl(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

/**
 * Sanitize a URL for href/src. Allows only known-safe schemes, rejecting
 * `javascript:` and non-image `data:`. Returns null when unsafe.
 *
 * The returned value must STILL be attribute-escaped via attr().
 */
export function safeUrl(
  value: unknown,
  { allowDataImage = false }: { allowDataImage?: boolean } = {},
): string | null {
  if (!nonEmpty(value)) return null;
  // Control chars could hide a scheme, e.g. "java\tscript:" — strip them first.
  const cleaned = stripControl(value);
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (/^mailto:/i.test(cleaned) || /^tel:/i.test(cleaned)) return cleaned;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(cleaned)) {
    return cleaned;
  }
  // Protocol-relative //host → assume https.
  if (/^\/\//.test(cleaned)) return "https:" + cleaned;
  // Bare domain → assume https; reject anything carrying a foreign scheme.
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i.test(cleaned) && !/^[a-z][a-z0-9+.-]*:/i.test(cleaned)) {
    return "https://" + cleaned;
  }
  return null;
}

/** Up to two initials, for the photo fallback. */
export function initials(name?: string | null): string {
  if (!nonEmpty(name)) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** Photo, or an initials circle when there is none. */
export function avatar(profile: CardProfile, cls = ""): string {
  const src = safeUrl(profile.photoUrl, { allowDataImage: true });
  if (src) {
    return `<div class="iv-av ${esc(cls)}"><img src="${attr(src)}" alt="${attr(
      profile.fullName ?? "photo",
    )}" /></div>`;
  }
  return `<div class="iv-av iv-av-fallback ${esc(cls)}"><span>${esc(
    initials(profile.fullName),
  )}</span></div>`;
}

/** Logo image, text logo, or nothing. Never renders an empty placeholder. */
export function logoBlock(logo: { url?: string; text?: string; height?: number } | null): string {
  const src = safeUrl(logo?.url, { allowDataImage: true });
  if (src) {
    const h = logo?.height ?? 22;
    return `<img class="iv-logo-img" src="${attr(src)}" alt="" style="height:${Number(h) || 22}px" />`;
  }
  if (nonEmpty(logo?.text)) return `<span class="iv-logo-txt">${esc(logo!.text)}</span>`;
  return "";
}

/**
 * The logo in its **dedicated place in the layout**.
 *
 * This was an absolutely-positioned corner overlay, and that was the wrong
 * model: an overlay has no relationship to the design underneath it, so it
 * printed on top of whatever happened to be there — one card rendered
 * "JCATION" over its EDUCATION heading, another overprinted the name.
 *
 * Now each card calls this at a spot it has actually designed for a logo, and
 * the element participates in layout. Two consequences, both wanted:
 *   - with a logo, the surrounding content moves to accommodate it
 *   - with no logo this returns "", so nothing reserves space and the card is
 *     not left with a hole where a logo would have been
 *
 * `position` still decides which end it sits at (top-left / top-right), which is
 * a standing commitment to the client — the classes below resolve to alignment
 * inside whatever row or column the card places it in.
 */
export function logoSlot(
  logo: { url?: string; text?: string; height?: number; position?: "top-left" | "top-right" } | null,
): string {
  const inner = logoBlock(logo);
  if (!inner) return "";
  const pos = logo?.position === "top-right" ? "iv-logo-r" : "iv-logo-l";
  return `<div class="iv-logo-slot ${pos}">${inner}</div>`;
}

/** Join non-empty parts with a separator, skipping the blanks. */
export function joinParts(parts: Array<string | null | undefined>, sep = " · "): string {
  return parts.filter(nonEmpty).join(sep);
}
