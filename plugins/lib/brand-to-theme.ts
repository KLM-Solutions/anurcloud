/**
 * Glue — derived brand palette → card theme options.
 *
 * ── What this closes ──────────────────────────────────────────────────────
 * Mithra Murugesan (Anur Cloud), 3 Aug 2026:
 *
 *   "When a user gives us a logo or a website, we'd want that custom palette
 *    to come from your recommendation itself, generated automatically based on
 *    the logo or website, rather than something we have to work out and pass
 *    to you."
 *
 * Both halves already existed and neither was wired to the other: `lib/brand.ts`
 * derives a palette from a logo or a site, and the templates accept a palette.
 * This file is the join. Anur Cloud passes nothing — the colour just arrives.
 *
 * Direction matters: `lib/` may import from `templates/`, never the reverse.
 */

import type { ThemeOptions } from "@/templates/types";
import { contrastRatio, luminance, parseHex } from "@/templates/theme";
import type { BrandTheme } from "@/lib/types";

/** The card surface a brand colour has to hold its own against. */
const SURFACE = "#ffffff";

/**
 * Below this, a colour is too close to white to work as a brand colour: the
 * header band vanishes and the tinted chips turn invisible.
 */
const MIN_CONTRAST_ON_SURFACE = 1.5;

/** Near-white rejected outright, before contrast is even considered. */
const MAX_LUMINANCE = 0.9;

/**
 * Is this colour usable as the card's primary?
 *
 * Brand extraction is best-effort and occasionally returns something unusable —
 * a near-white from a logo's background, or a pale wash from a hero image.
 * Rendering it anyway produces an invisible header, so we fall back instead.
 */
export function isUsableBrandColor(hex: string | null | undefined): boolean {
  if (!hex || !parseHex(hex)) return false;
  const lum = luminance(hex);
  if (lum === null || lum > MAX_LUMINANCE) return false;
  const ratio = contrastRatio(hex, SURFACE);
  return ratio !== null && ratio >= MIN_CONTRAST_ON_SURFACE;
}

/** Why the derived palette was or wasn't used — surfaced for debugging. */
export interface BrandThemeOutcome {
  theme: ThemeOptions;
  /** True when the card is showing colours we derived from the user's brand. */
  applied: boolean;
  /** Null when applied; otherwise why we fell back. */
  reason: string | null;
}

export interface BrandToThemeOptions {
  /** Caller overrides. Anything set here wins over the derived palette. */
  overrides?: ThemeOptions;
  /** Use the brand's fonts too. Off by default — brand fonts are lower confidence. */
  useBrandFonts?: boolean;
  logoPosition?: "top-left" | "top-right";
  logoHeight?: number;
}

/**
 * Turn a derived brand into theme options, falling back safely.
 *
 * Fallback cases, all of them normal rather than exceptional:
 *   - no logo and no website supplied  → brand is null
 *   - the lookup failed or timed out   → brand is null
 *   - a colour came back but is unusable against the card surface
 *
 * In every one the card still renders, using the profile-type default. A brand
 * lookup must never break a card, exactly as it must never fail an extraction.
 */
export function brandToTheme(
  brand: BrandTheme | null | undefined,
  options: BrandToThemeOptions = {},
): BrandThemeOutcome {
  const { overrides = {}, useBrandFonts = false, logoPosition = "top-left", logoHeight } = options;

  const base: ThemeOptions = { ...overrides };
  const fallback = (reason: string): BrandThemeOutcome => ({
    theme: base,
    applied: false,
    reason,
  });

  if (!brand) return fallback("No logo or website supplied, or the brand lookup returned nothing.");

  const primary = brand.primary;
  if (!isUsableBrandColor(primary)) {
    // Try the ranked palette before giving up — the runner-up is often fine.
    const alternative = (brand.palette ?? []).find((c) => isUsableBrandColor(c));
    if (!alternative) {
      return fallback(
        primary
          ? `Derived colour ${primary} is unusable on the card surface (too pale or too low contrast).`
          : "No colour could be derived from the logo or website.",
      );
    }
    return applied(alternative, brand, base, { useBrandFonts, logoPosition, logoHeight });
  }

  return applied(primary!, brand, base, { useBrandFonts, logoPosition, logoHeight });
}

function applied(
  primary: string,
  brand: BrandTheme,
  base: ThemeOptions,
  opts: { useBrandFonts: boolean; logoPosition: "top-left" | "top-right"; logoHeight?: number },
): BrandThemeOutcome {
  // An accent is only worth taking if it is usable in its own right.
  const accent = isUsableBrandColor(brand.accent) ? brand.accent! : undefined;

  // Caller overrides win: an explicit colour beats anything we inferred.
  const overrideColors =
    typeof base.colors === "string" ? { primary: base.colors } : (base.colors ?? {});

  const colors = {
    primary,
    ...(accent ? { accent } : {}),
    ...overrideColors,
  };

  const theme: ThemeOptions = { ...base, colors };

  if (opts.useBrandFonts && brand.fonts && !base.font) {
    const heading = brand.fonts.heading ?? undefined;
    const body = brand.fonts.body ?? undefined;
    if (heading || body) theme.font = { ...(heading ? { heading } : {}), ...(body ? { body } : {}) };
  }

  // The logo drops straight in — it is already an absolute URL or a data URI.
  if (brand.logo_url && !base.logo) {
    theme.logo = {
      url: brand.logo_url,
      position: opts.logoPosition,
      ...(opts.logoHeight ? { height: opts.logoHeight } : {}),
    };
  }

  return { theme, applied: true, reason: null };
}
