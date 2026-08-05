/**
 * Colour maths for brand-theme derivation.
 *
 * Pure functions, no I/O and no server-only deps — safe to import from either side.
 * Shared by both brand paths in lib/brand.ts: filtering the palette Firecrawl
 * returns for a website, and ranking the colours counted out of a logo image.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  /** 0–360 */
  h: number;
  /** 0–1 */
  s: number;
  /** 0–1 */
  l: number;
}

/**
 * A colour under consideration for `primary`.
 *
 * `weight` is how much the candidate's own provenance is worth, 0–1, and it is
 * multiplied by saturation to rank it:
 *
 *  - image path — the fraction of opaque pixels the colour covers.
 *  - website path — a rank weight from lib/brand.ts, highest for the signals we
 *    trust most. This must be supplied. Leaving every website candidate at 1
 *    reduces ranking to "most saturated wins", and a pure #0000ee (the browser's
 *    default link colour) then beats every genuine brand colour on the page.
 */
export interface ColorCandidate {
  hex: string;
  weight?: number;
}

export interface BrandPick {
  primary: string;
  accent: string;
  palette: string[];
}

/* ── thresholds ──
 * Tuned against real logos and real sites, not picked arbitrarily:
 *
 * SAT_MIN 0.18  — rejects greys. Firecrawl handed back #5F647C (a grey) as
 *                 pxlbrain.com's "primary"; a brand colour it is not. Also
 *                 catches true blacks like the #010101 Zoho returned, which have
 *                 no saturation at all.
 * L_MAX   0.88  — rejects near-white. Started at 0.93 and anurcloud.com's favicon
 *                 produced #f8def3, a pale pink background, at L≈0.92.
 * L_MIN   0.07  — rejects black. NOTE: this does NOT reject a dark navy, and it
 *                 is not meant to. Stripe's #061B31 sits at L≈0.11 and passes,
 *                 which is correct — plenty of brands genuinely are dark navy
 *                 (AnurCloud's own #112042 is L≈0.16, and we want that one).
 *                 What keeps Stripe's body-text navy from becoming their
 *                 "primary" is the candidate WEIGHTING in lib/brand.ts, not this
 *                 filter: it arrives as `colors.primary` (weight 0.6) and loses
 *                 to their real #533AFD from the button (weight 1.0). Tightening
 *                 L_MIN to exclude it would take AnurCloud's navy with it.
 */
const SAT_MIN = 0.18;
const L_MAX = 0.88;
const L_MIN = 0.07;

/**
 * Lightness ceiling for a *monochrome* brand colour — see `isMonochromeBrandColor`.
 * 0.35 keeps blacks and charcoals and rejects mid-to-light greys, which are page
 * furniture (borders, muted text) on every site rather than anyone's brand.
 */
const MONO_L_MAX = 0.35;

/** Minimum hue separation (degrees) for `accent` to read as a different colour. */
const ACCENT_HUE_GAP = 30;

/**
 * Browser defaults for unstyled links, not brand colours — but maximally saturated,
 * so without this they outrank everything real on the page. Seen live: a site with
 * no styled buttons yielded #0000ee as its "primary".
 */
const UA_DEFAULT_COLORS = new Set(["#0000ee", "#0000ff", "#551a8b", "#ee0000", "#00ff00", "#ff0000"]);

export function parseHex(input: string): Rgb | null {
  const raw = String(input).trim().replace(/^#/, "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

const clamp255 = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));

export function toHex({ r, g, b }: Rgb): string {
  return "#" + [r, g, b].map((c) => clamp255(c).toString(16).padStart(2, "0")).join("");
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return { h: h * 360, s, l };
}

/** True when the colour could plausibly be a brand colour rather than background or text. */
export function isBrandColor(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  if (UA_DEFAULT_COLORS.has(hex.trim().toLowerCase())) return false;
  const { s, l } = rgbToHsl(rgb);
  return s >= SAT_MIN && l <= L_MAX && l >= L_MIN;
}

/**
 * True for a dark neutral — black or charcoal — that a deliberately monochrome
 * brand can legitimately use as its primary.
 *
 * `isBrandColor` rejects these, and must keep doing so for the general case: on a
 * site that HAS a colour, a near-black is its body text (Stripe's #061B31) and a
 * grey is chrome (PxlBrain's #5F647C). But a black-and-white site really has black
 * as its brand colour, so it gets a second, much narrower pass — dark only (a white
 * primary is unusable behind white card text), and in lib/brand.ts only from the
 * top-weight button signals and only when nothing chromatic survived.
 */
export function isMonochromeBrandColor(hex: string): boolean {
  const rgb = parseHex(hex);
  if (!rgb) return false;
  if (UA_DEFAULT_COLORS.has(hex.trim().toLowerCase())) return false;
  const { s, l } = rgbToHsl(rgb);
  return s < SAT_MIN && l <= MONO_L_MAX;
}

/**
 * Pick a primary from dark-neutral candidates.
 *
 * Separate from `pickBrand` because that scores `weight × saturation`, which is 0
 * for every grey — greys can only be ranked by how much their source is worth, then
 * by darkness. The accent is always derived: a monochrome site has no second hue.
 */
export function pickMonochrome(candidates: ColorCandidate[]): BrandPick | null {
  const scored = candidates
    .filter((c) => isMonochromeBrandColor(c.hex))
    .map((c) => ({ hex: c.hex.toLowerCase(), weight: c.weight ?? 1, l: rgbToHsl(parseHex(c.hex)!).l }))
    .sort((a, b) => b.weight - a.weight || a.l - b.l);

  const primary = scored[0];
  if (!primary) return null;

  const accent = shade(primary.hex, 22);
  return { primary: primary.hex, accent, palette: [primary.hex, accent] };
}

/** Shortest distance between two hues, in degrees (0–180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Lighten (percent > 0) or darken (percent < 0) a hex colour. Non-hex passes through. */
export function shade(hex: string, percent: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const p = percent / 100;
  const mix = (c: number): number => (p < 0 ? c * (1 + p) : c + (255 - c) * p);
  return toHex({ r: mix(rgb.r), g: mix(rgb.g), b: mix(rgb.b) });
}

/**
 * Pick `primary` and `accent` from a candidate list.
 *
 * Scored by `weight × saturation`. The saturation term matters on the image path:
 * raw pixel frequency favours muddy fills, so a genuine brand colour would lose to
 * a large desaturated area. The weight term matters on the website path, where it
 * carries how much the source of each candidate is worth.
 *
 * Returns null when nothing survives the brand filter — a monochrome logo, for
 * instance — and the caller falls back to a default.
 */
export function pickBrand(candidates: ColorCandidate[]): BrandPick | null {
  const scored = candidates
    .filter((c) => isBrandColor(c.hex))
    .map((c) => {
      const hsl = rgbToHsl(parseHex(c.hex)!);
      return { hex: c.hex.toLowerCase(), hue: hsl.h, score: (c.weight ?? 1) * hsl.s };
    })
    .sort((a, b) => b.score - a.score);

  // Collapse duplicates while keeping rank order (Firecrawl often repeats a colour
  // across primary/accent/link; the same is true of near-identical pixel buckets).
  const unique: typeof scored = [];
  for (const c of scored) {
    if (!unique.some((u) => u.hex === c.hex)) unique.push(c);
  }
  if (unique.length === 0) return null;

  const primary = unique[0]!;
  const accent = unique.find((c) => hueDistance(c.hue, primary.hue) >= ACCENT_HUE_GAP);

  return {
    primary: primary.hex,
    // A single-hue logo or site has no second colour to offer, so derive one.
    accent: accent ? accent.hex : shade(primary.hex, 22),
    palette: unique.slice(0, 6).map((c) => c.hex),
  };
}
