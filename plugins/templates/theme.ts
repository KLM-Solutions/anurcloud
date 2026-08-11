/**
 * Theme resolution — turns loose ThemeOptions into concrete values plus the
 * CSS custom properties every card renders against.
 *
 * Colour maths is duplicated here rather than imported from `lib/color.ts` on
 * purpose: `templates/` must not depend on anything outside itself (DEV-3040).
 * This copy is deliberately small — hex only, no HSL ranking.
 */

import type { ProfileType, ThemeColors, ThemeFont, ThemeOptions, ThemeLogo } from "./types";

export interface ResolvedTheme {
  colors: Required<ThemeColors> & { primaryDark: string };
  gradient: [string, string];
  fontHeading: string;
  fontBody: string;
  scale: number;
  widthPx: number;
  responsive: boolean;
  radius: number;
  logo: ThemeLogo | null;
  scopeId: string;
  /** Inline style for the card root: custom properties + sizing. */
  rootStyle: string;
}

const SIZE_PX: Record<string, number> = { sm: 320, md: 380, lg: 440 };

const DEFAULT_COLORS = {
  background: "#f4f6fa",
  surface: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
};

/** Fallback brand colour when nothing was derived. Crimson, set 22 Jul 2026. */
const AUDIENCE_DEFAULTS: Record<ProfileType, { primary: string; accent: string }> = {
  professional: { primary: "#be123c", accent: "#e11d48" },
  student: { primary: "#be123c", accent: "#e11d48" },
};

let scopeCounter = 0;

/* ── colour maths (hex only) ──────────────────────────────────────────────── */

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((c) => clamp(c).toString(16).padStart(2, "0")).join("");
}

/** Lighten (percent > 0) or darken (percent < 0). Non-hex passes through. */
export function shade(color: string, percent: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const p = percent / 100;
  const mix = (c: number) => (p < 0 ? c * (1 + p) : c + (255 - c) * p);
  return toHex([mix(rgb[0]), mix(rgb[1]), mix(rgb[2])]);
}

/** Relative luminance (WCAG). Returns 0–1; null for an unparseable colour. */
export function luminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Pick dark or light text for legibility on top of `bg`.
 *
 * This is why `onPrimary` is derived rather than hardcoded to white: a brand
 * palette lifted from a logo can easily be pale yellow, and white-on-yellow
 * is unreadable.
 */
export function readableOn(bg: string): string {
  const lum = luminance(bg);
  if (lum === null) return "#ffffff";
  return lum > 0.5 ? "#0f172a" : "#ffffff";
}

/** WCAG contrast ratio between two colours. Null if either is unparseable. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* ── resolver ─────────────────────────────────────────────────────────────── */

/* ── input validation ─────────────────────────────────────────────────────────
 *
 * Theme options are untrusted. They arrive from the request body of
 * /api/template, and the colours are derived from a logo or a third-party
 * website — neither is under our control. Every one of these values is
 * interpolated into the card's `style` attribute or its scoped stylesheet, so a
 * value carrying a quote would break out of the attribute and turn a card into
 * an XSS payload in whatever page embeds it.
 *
 * The rule below is "re-emit, never pass through": a colour is parsed and
 * re-serialised from its own numbers, so the output is ours by construction and
 * cannot carry anything the caller wrote. Anything unparseable becomes null and
 * falls back to a default, exactly as a missing value would.
 */

/** Canonical `#rrggbb`, rebuilt from the parsed channels. Null if not a colour. */
function safeColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const rgb = parseHex(value);
  return rgb ? toHex(rgb) : null;
}

/**
 * A font family safe to place inside a quoted CSS font stack.
 *
 * Letters, digits, spaces and hyphens only — enough for every real family name
 * ("Playfair Display", "IBM Plex Sans") and short of anything that could close
 * the quote, end the declaration, or open a url().
 */
function safeFontFamily(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 48) return null;
  return /^[A-Za-z0-9][A-Za-z0-9 -]*$/.test(trimmed) ? trimmed : null;
}

/** A scope id becomes both a class name and a CSS selector, so keep it strict. */
function safeScopeId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return /^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(value) ? value : null;
}

/** Finite number inside a sane range, or null. Guards `NaN` and `Infinity` too. */
function safeNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value >= min && value <= max ? value : null;
}

function normalizeColors(input: ThemeColors | string | undefined): ThemeColors {
  const raw: ThemeColors = typeof input === "string" ? { primary: input } : (input ?? {});
  const out: ThemeColors = {};
  for (const key of [
    "primary",
    "accent",
    "background",
    "surface",
    "text",
    "muted",
    "onPrimary",
  ] as const) {
    const ok = safeColor(raw[key]);
    if (ok) out[key] = ok;
  }
  return out;
}

function normalizeFont(input: ThemeFont | string | undefined): ThemeFont {
  const raw: ThemeFont = typeof input === "string" ? { heading: input, body: input } : (input ?? {});
  const heading = safeFontFamily(raw.heading);
  const body = safeFontFamily(raw.body);
  return { ...(heading ? { heading } : {}), ...(body ? { body } : {}) };
}

export function resolveTheme(
  options: ThemeOptions = {},
  profileType: ProfileType = "professional",
): ResolvedTheme {
  const audience = AUDIENCE_DEFAULTS[profileType];
  const c = normalizeColors(options.colors);

  const primary = c.primary ?? audience.primary;
  const accent = c.accent ?? audience.accent;
  const primaryDark = shade(primary, -24);
  // Derived, not assumed — a pale brand colour needs dark text on top of it.
  const onPrimary = c.onPrimary ?? readableOn(primary);

  const colors = {
    primary,
    accent,
    background: c.background ?? DEFAULT_COLORS.background,
    surface: c.surface ?? DEFAULT_COLORS.surface,
    text: c.text ?? DEFAULT_COLORS.text,
    muted: c.muted ?? DEFAULT_COLORS.muted,
    onPrimary,
    primaryDark,
  };

  // Both stops validated independently — a caller may supply one usable colour
  // and one that is not, and half a gradient is still an injection.
  const gradFrom = safeColor(options.gradient?.[0]);
  const gradTo = safeColor(options.gradient?.[1]);
  const gradient: [string, string] =
    gradFrom && gradTo ? [gradFrom, gradTo] : [shade(primary, 10), primaryDark];

  const font = normalizeFont(options.font);
  const fontHeading = font.heading ?? "Poppins";
  const fontBody = font.body ?? "Inter";

  const scale = safeNumber(options.fontScale, 0.5, 3) ?? 1;

  const widthPx =
    safeNumber(options.size, 200, 2000) ??
    (typeof options.size === "string" ? SIZE_PX[options.size] : undefined) ??
    SIZE_PX.md!;

  const responsive = options.responsive === true;
  const radius = safeNumber(options.radius, 0, 200) ?? 20;
  const scopeId = safeScopeId(options.scopeId) ?? `ivc${(scopeCounter += 1)}`;

  const stack = (family: string) =>
    `'${family}', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`;

  const vars = [
    `--iv-primary:${colors.primary}`,
    `--iv-primary-dark:${colors.primaryDark}`,
    `--iv-accent:${colors.accent}`,
    `--iv-bg:${colors.background}`,
    `--iv-surface:${colors.surface}`,
    `--iv-text:${colors.text}`,
    `--iv-muted:${colors.muted}`,
    `--iv-onp:${colors.onPrimary}`,
    // The card's outer edge. Tinted toward the brand rather than a flat grey, so
    // a navy card gets a navy-grey hairline instead of a foreign-looking one.
    // Mixed against the surface (opaque) rather than transparent: a translucent
    // border is unreliable in print, and this card has to survive a PDF.
    `--iv-edge:color-mix(in srgb, ${colors.primary} 26%, ${colors.surface})`,
    `--iv-grad:linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    `--iv-radius:${radius}px`,
    `--iv-font-h:${stack(fontHeading)}`,
    `--iv-font-b:${stack(fontBody)}`,
  ].join(";");

  const sizing = responsive ? `width:100%;max-width:${widthPx}px` : `width:${widthPx}px`;
  const rootStyle = `${vars};${sizing};font-size:${(16 * scale).toFixed(2)}px`;

  return {
    colors,
    gradient,
    fontHeading,
    fontBody,
    scale,
    widthPx,
    responsive,
    radius,
    logo: options.logo ?? null,
    scopeId,
    rootStyle,
  };
}
