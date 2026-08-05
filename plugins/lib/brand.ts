/**
 * Brand theme engine — turns a website or a logo image into the colours (and logo)
 * the card templates need.
 *
 * SERVER ONLY. Imports sharp and the Firecrawl client; never import from a client
 * component. Pure colour maths lives in lib/color.ts and is safe on either side.
 *
 * Two paths, both landing on the same `BrandTheme` shape:
 *
 *   website  → Firecrawl `branding` (default)  → falls back to reading the logo pixels
 *   logo file → read the logo pixels           (the only option; there is no site)
 *
 * Findings that shaped this file, all verified against live sites:
 *
 *  - The logo is at `branding.images.logo`. The top-level `branding.logo` is `null`
 *    on every site tested, despite being the field the SDK type advertises.
 *  - `branding.colors.primary` is NOT reliable — it returned a near-black text
 *    colour on stripe.com and a grey on pxlbrain.com. Every candidate goes through
 *    the filter in lib/color.ts rather than trusting Firecrawl's ranking.
 *  - `components.buttonPrimary.background` is the single most reliable signal, so
 *    it is offered first. Where the button is white with a coloured border
 *    (zoho.com), `borderColor` carries the brand colour instead.
 *  - A black-and-white site is not a failed lookup. Every candidate on
 *    devaklbog.vercel.app is #fff / #0f0f0f / a grey, so the normal filter rejects
 *    all of them; there is a second, narrow monochrome pass for exactly this case.
 *  - `branding` and `html` MUST be requested as two separate scrapes. Firecrawl
 *    runs a script inside the page to analyse branding and it can throw — it does
 *    on anurcloud.com. Bundled in one call, that failure takes the HTML and the
 *    favicon down with it and we get nothing at all.
 *  - The analysis is AI-assisted and not deterministic: zoho.com returned a
 *    different primary across runs. Results are cached per URL so a given user
 *    does not see the card colour change between visits.
 */

import sharp from "sharp";
import Firecrawl from "@mendable/firecrawl-js";
import {
  isBrandColor,
  pickBrand,
  pickMonochrome,
  toHex,
  type ColorCandidate,
} from "./color";
import type { BrandTheme, ProfileType } from "./types";

/* ── per-profile defaults ──
 * The last resort when a site or logo yields no usable colour. Deliberately
 * different per profile type so "a colour theme per profile" is real. */
const PROFILE_DEFAULTS: Record<ProfileType, { primary: string; accent: string }> = {
  professional: { primary: "#1d4ed8", accent: "#0ea4e9" },
  student: { primary: "#be123c", accent: "#e11d48" },
};

/** Cache TTL for site lookups. Firecrawl is slow, paid, and non-deterministic. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const siteCache = new Map<string, { at: number; theme: BrandTheme }>();

/* ── image fetching ──────────────────────────────────────────────────────── */

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Hosts we refuse to fetch. The image URL comes off a page we do not control, so
 * without this a crafted page could point us at a loopback or cloud-metadata
 * address and use us as a proxy into our own network.
 */
const BLOCKED_HOST = /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i;

/** Decode a `data:` URI. Stripe serves its logo inlined rather than as a URL. */
function decodeDataUri(src: string): Buffer | null {
  const comma = src.indexOf(",");
  if (comma < 0) return null;
  const header = src.slice(0, comma);
  const body = src.slice(comma + 1);
  return header.includes("base64")
    ? Buffer.from(body, "base64")
    : Buffer.from(decodeURIComponent(body), "utf8");
}

/**
 * Make a scraped image reference absolute against the page it was found on.
 * `data:` URIs pass through untouched. Returns null if it cannot be resolved.
 */
export function absolutise(src: string | null | undefined, baseUrl: string): string | null {
  if (!src || !src.trim()) return null;
  if (src.startsWith("data:")) return src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return null;
  }
}

/** Fetch an image, guarded. Throws on anything we will not accept. */
export async function fetchImage(src: string, baseUrl?: string): Promise<Buffer> {
  if (src.startsWith("data:")) {
    const buf = decodeDataUri(src);
    if (!buf) throw new Error("malformed data URI");
    return buf;
  }

  // Relative paths (`/assets/logo.svg`) resolve against the page they came from.
  const resolved = baseUrl ? new URL(src, baseUrl) : new URL(src);
  if (!["http:", "https:"].includes(resolved.protocol)) throw new Error("unsupported protocol");
  if (BLOCKED_HOST.test(resolved.hostname)) throw new Error("blocked host");

  const res = await fetch(resolved.href, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("image exceeds 2 MB");
  return buf;
}

/* ── path 2: read the colours out of an image ────────────────────────────── */

/** Below this share of opaque pixels, the top colour is not really dominant. */
const LOW_CONFIDENCE_SHARE = 0.05;
const GOOD_CONFIDENCE_SHARE = 0.15;

/**
 * Count the colours in an image and rank them.
 *
 * `density: 200` matters for SVG — sharp rasterises it through librsvg, and at the
 * default density a vector logo comes out too small to sample meaningfully.
 * Transparent pixels are skipped: most logos are transparent PNGs, and counting
 * them means "transparent black" wins every time.
 */
export async function brandFromImage(buf: Buffer): Promise<BrandTheme | null> {
  let raw: Buffer;
  try {
    const out = await sharp(buf, { density: 200 })
      .resize(96, 96, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    raw = out.data;
  } catch (err) {
    // `.ico` lands here — sharp has no ICO decoder.
    console.warn("[brand] could not decode image:", err instanceof Error ? err.message : err);
    return null;
  }

  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  let opaque = 0;

  for (let i = 0; i < raw.length; i += 4) {
    if (raw[i + 3]! < 128) continue;
    opaque++;
    const r = raw[i]!;
    const g = raw[i + 1]!;
    const b = raw[i + 2]!;
    // 16 levels per channel groups near-identical shades into one bucket, so
    // anti-aliased edges don't fragment the real colour into dozens of entries.
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const entry = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    entry.n++;
    entry.r += r;
    entry.g += g;
    entry.b += b;
    buckets.set(key, entry);
  }

  // A vector that rasterised to nothing — an SVG using `currentColor`, or one
  // whose artwork is an external <image> reference we never resolved.
  if (opaque === 0) return null;

  const candidates: ColorCandidate[] = [];
  let topShare = 0;
  for (const e of buckets.values()) {
    const hex = toHex({ r: e.r / e.n, g: e.g / e.n, b: e.b / e.n });
    const share = e.n / opaque;
    if (!isBrandColor(hex)) continue;
    candidates.push({ hex, weight: share });
    if (share > topShare) topShare = share;
  }

  const pick = pickBrand(candidates);
  if (!pick) return null;

  return {
    primary: pick.primary,
    accent: pick.accent,
    palette: pick.palette,
    logo_url: null,
    fonts: null,
    source: "logo-image",
    confidence:
      topShare >= GOOD_CONFIDENCE_SHARE ? "high" : topShare >= LOW_CONFIDENCE_SHARE ? "medium" : "low",
    notes: null,
  };
}

/* ── path 1: ask Firecrawl about the website ─────────────────────────────── */

function firecrawl(): Firecrawl | null {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  return apiKey ? new Firecrawl({ apiKey }) : null;
}

/** Map Firecrawl's 0–1 overall score onto our three-step confidence. */
function scoreToConfidence(overall: number | undefined): BrandTheme["confidence"] {
  if (typeof overall !== "number") return "medium";
  if (overall >= 0.85) return "high";
  if (overall >= 0.6) return "medium";
  return "low";
}

interface BrandingShape {
  images?: { logo?: string | null; favicon?: string | null } | null;
  colors?: Record<string, string | undefined> | null;
  components?: { buttonPrimary?: Record<string, unknown> | null } | null;
  fonts?: Array<{ family?: string; role?: string }> | null;
  typography?: { fontFamilies?: { primary?: string; heading?: string } | null } | null;
  /** `buttons` and `colors` are per-signal sub-scores; `overall` is their roll-up. */
  confidence?: { overall?: number; buttons?: number; colors?: number } | null;
}

/**
 * Colour candidates, each weighted by how much its source is worth.
 *
 * The weights are the whole point — `pickBrand` multiplies them by saturation, so
 * without them ranking collapses to "most saturated wins" and a maximally saturated
 * browser-default link colour beats the real brand colour. Order comes from what
 * actually proved correct across the sites we tested:
 *
 *   buttonPrimary.background — correct on Stripe, Freshworks and TCS
 *   buttonPrimary.borderColor — carries the brand where the button is white (Zoho)
 *   colors.accent            — right on Stripe where `primary` was body-text black
 *   colors.primary / .link   — least trustworthy; `primary` was a grey on PxlBrain
 */
function colorCandidates(b: BrandingShape): ColorCandidate[] {
  const btn = (b.components?.buttonPrimary ?? {}) as Record<string, unknown>;
  const c = b.colors ?? {};
  const ranked: Array<[unknown, number]> = [
    [btn.background, 1.0],
    [btn.borderColor, 0.95],
    [c.accent, 0.9],
    [btn.textColor, 0.8],
    [c.secondary, 0.7],
    [c.primary, 0.6],
    [c.link, 0.4],
  ];
  return ranked
    .filter((pair): pair is [string, number] =>
      typeof pair[0] === "string" && pair[0].trim().length > 0,
    )
    .map(([hex, weight]) => ({ hex, weight }));
}

/**
 * Minimum `confidence.buttons` before a near-black button colour is allowed to
 * become the brand colour. Firecrawl reports 0 when it could not identify a button
 * at all (anurcloud.com), and whatever sits in `buttonPrimary` then is a guess —
 * exactly the case where we would rather use the profile default.
 */
const MONO_MIN_BUTTON_CONFIDENCE = 0.6;

/**
 * Candidates for the monochrome pass — the two signals that proved trustworthy,
 * and nothing else.
 *
 * `colors.primary`, `.link` and `.textPrimary` are deliberately excluded: they are
 * where every false positive came from (a body-text navy on Stripe, a grey on
 * PxlBrain), and on a monochrome site they are guaranteed to be black. Reading the
 * brand off them would mean "every site is black", which is why this pass only
 * trusts a colour Firecrawl actually found painted on a button.
 */
function monochromeCandidates(b: BrandingShape): ColorCandidate[] {
  const btn = (b.components?.buttonPrimary ?? {}) as Record<string, unknown>;
  const ranked: Array<[unknown, number]> = [
    [btn.background, 1.0],
    [btn.borderColor, 0.95],
  ];
  return ranked
    .filter((pair): pair is [string, number] =>
      typeof pair[0] === "string" && pair[0].trim().length > 0,
    )
    .map(([hex, weight]) => ({ hex, weight }));
}

function fontsFrom(b: BrandingShape): BrandTheme["fonts"] {
  const families = b.typography?.fontFamilies ?? null;
  const byRole = (role: string): string | null =>
    b.fonts?.find((f) => f.role === role)?.family ?? null;
  const heading = families?.heading ?? byRole("heading") ?? null;
  const body = families?.primary ?? byRole("body") ?? null;
  return heading || body ? { heading, body } : null;
}

/**
 * Derive a brand theme from a website.
 *
 * Ladder: Firecrawl branding → the logo image it identified → the site favicon →
 * null (caller applies the profile default). Never throws; a brand lookup must not
 * be able to fail an extraction request.
 */
export async function brandFromSite(url: string): Promise<BrandTheme | null> {
  const cacheKey = url.trim().toLowerCase();
  const hit = siteCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.theme;

  const fc = firecrawl();
  if (!fc) return null;

  let branding: BrandingShape | null = null;
  let favicon: string | null = null;
  const notes: string[] = [];

  // Separate call — see the header note. Bundling this with `html` means one
  // in-page crash costs us the favicon fallback as well.
  try {
    const doc = await fc.scrape(url, { formats: ["branding"] });
    branding = (doc.branding ?? null) as BrandingShape | null;
    favicon = doc.metadata?.favicon ?? null;
  } catch (err) {
    console.warn("[brand] branding scrape failed:", err instanceof Error ? err.message : err);
    notes.push("Brand analysis failed for this site; derived the colour from its icon instead.");
    try {
      const doc = await fc.scrape(url, { formats: ["html"] });
      favicon = doc.metadata?.favicon ?? null;
    } catch {
      notes.push("Could not read the site at all.");
    }
  }

  // Absolutise against the page it came from. Firecrawl can hand back a relative
  // path (`/assets/logo.png`), and a relative src in the response would resolve
  // against OUR origin in the caller's browser and 404.
  const logoUrl = absolutise(branding?.images?.logo ?? favicon ?? null, url);
  const fonts = branding ? fontsFrom(branding) : null;

  let theme: BrandTheme | null = null;

  let pick = branding ? pickBrand(colorCandidates(branding)) : null;

  // Nothing chromatic survived. Before giving up, consider that the site may simply
  // be black-and-white — a real and common design choice, not a failed lookup.
  // devaklbog.vercel.app is entirely #fff/#0f0f0f/greys and used to land on the
  // profile default, which looked like a bug to anyone who had seen the site.
  let monochrome = false;
  if (!pick && branding && (branding.confidence?.buttons ?? 0) >= MONO_MIN_BUTTON_CONFIDENCE) {
    pick = pickMonochrome(monochromeCandidates(branding));
    if (pick) {
      monochrome = true;
      notes.push("This site's design is monochrome; used the colour of its primary button.");
    }
  }

  if (pick) {
    theme = {
      primary: pick.primary,
      accent: pick.accent,
      palette: pick.palette,
      logo_url: logoUrl,
      fonts,
      source: "firecrawl",
      // A derived monochrome primary is a judgement call, so it is never reported as
      // high confidence however sure Firecrawl was about the button itself.
      confidence: monochrome ? "medium" : scoreToConfidence(branding?.confidence?.overall),
      notes: notes.length ? notes.join(" ") : null,
    };
  } else if (logoUrl) {
    // No usable colour from the site's design — read the logo image instead.
    if (branding) {
      notes.push("No usable brand colour in the site design; read it from the logo image.");
    }
    try {
      const fromImage = await brandFromImage(await fetchImage(logoUrl, url));
      if (fromImage) {
        theme = {
          ...fromImage,
          logo_url: logoUrl,
          fonts,
          source: branding ? "logo-image" : "favicon",
          notes: notes.length ? notes.join(" ") : null,
        };
      }
    } catch (err) {
      console.warn("[brand] logo fetch failed:", err instanceof Error ? err.message : err);
    }
  }

  // Still return the logo even when no colour could be derived — the card can show
  // the logo against a default palette, which beats showing neither.
  if (!theme && logoUrl) {
    theme = {
      primary: null,
      accent: null,
      palette: [],
      logo_url: logoUrl,
      fonts,
      source: branding ? "firecrawl" : "favicon",
      confidence: "low",
      notes: [...notes, "Found a logo but no brand colour; a default palette will be used."].join(" "),
    };
  }

  if (theme) siteCache.set(cacheKey, { at: Date.now(), theme });
  return theme;
}

/* ── shared helper ───────────────────────────────────────────────────────── */

/** Fill in the per-profile default where no colour could be derived. */
export function withProfileDefaults(
  theme: BrandTheme | null,
  profileType: ProfileType,
): BrandTheme {
  const fallback = PROFILE_DEFAULTS[profileType];
  if (!theme) {
    return {
      primary: fallback.primary,
      accent: fallback.accent,
      palette: [fallback.primary, fallback.accent],
      logo_url: null,
      fonts: null,
      source: "default",
      confidence: "low",
      notes: "No brand colour could be derived; using the default theme for this profile type.",
    };
  }
  if (theme.primary) return theme;
  return {
    ...theme,
    primary: fallback.primary,
    accent: fallback.accent,
    palette: theme.palette.length ? theme.palette : [fallback.primary, fallback.accent],
    source: "default",
  };
}

/** Detect an image we can actually decode, for the optional logo upload. */
export function isSupportedLogo(file: { name: string; type: string }): boolean {
  const lower = file.name.toLowerCase();
  const okExt = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif", ".gif"].some((e) =>
    lower.endsWith(e),
  );
  const okMime = /^image\/(png|jpeg|webp|svg\+xml|avif|gif)$/.test(file.type);
  return okExt || okMime;
}
