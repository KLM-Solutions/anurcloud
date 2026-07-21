/** Theme resolution: turns loose ThemeOptions into concrete values + CSS variables. */

import type { ProfileType, ThemeColors, ThemeFont, ThemeLogo, ThemeOptions } from "./types.js";

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
  /** Inline style string for the card root (CSS custom properties + sizing). */
  rootStyle: string;
}

const SIZE_PX: Record<string, number> = { sm: 320, md: 380, lg: 440 };

const DEFAULT_COLORS = {
  background: "#f4f6fa",
  surface: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  onPrimary: "#ffffff",
};

const AUDIENCE_DEFAULTS: Record<ProfileType, { primary: string; accent: string }> = {
  professional: { primary: "#be123c", accent: "#e11d48" },
  student: { primary: "#be123c", accent: "#e11d48" },
};

let scopeCounter = 0;

/* ── colour math (hex only) ── */

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((c) => clamp(c).toString(16).padStart(2, "0")).join("");
}

/** Shade a hex colour. percent > 0 lightens, < 0 darkens. Non-hex passes through. */
export function shade(color: string, percent: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const p = percent / 100;
  const mix = (c: number) => (p < 0 ? c * (1 + p) : c + (255 - c) * p);
  return toHex([mix(rgb[0]), mix(rgb[1]), mix(rgb[2])]);
}

/** Pick black or white for legible text on top of `bg`. */
export function readableOn(bg: string): string {
  const rgb = parseHex(bg);
  if (!rgb) return "#ffffff";
  // relative luminance
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#0f172a" : "#ffffff";
}

/* ── resolver ── */

function normalizeColors(input: ThemeColors | string | undefined, profileType: ProfileType): ThemeColors {
  if (typeof input === "string") return { primary: input };
  return input ?? {};
}

function normalizeFont(input: ThemeFont | string | undefined): ThemeFont {
  if (typeof input === "string") return { heading: input, body: input };
  return input ?? {};
}

export function resolveTheme(options: ThemeOptions = {}, profileType: ProfileType = "professional"): ResolvedTheme {
  const audience = AUDIENCE_DEFAULTS[profileType];
  const c = normalizeColors(options.colors, profileType);

  const primary = c.primary ?? audience.primary;
  const accent = c.accent ?? audience.accent;
  const onPrimary = c.onPrimary ?? DEFAULT_COLORS.onPrimary;
  const primaryDark = shade(primary, -24);

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

  const gradient: [string, string] = options.gradient ?? [shade(primary, 10), primaryDark];

  const font = normalizeFont(options.font);
  const fontHeading = font.heading ?? "Poppins";
  const fontBody = font.body ?? "Inter";

  const scale = options.fontScale && options.fontScale > 0 ? options.fontScale : 1;

  const widthPx =
    typeof options.size === "number"
      ? options.size
      : SIZE_PX[options.size ?? "md"] ?? SIZE_PX.md!;

  const responsive = options.responsive ?? false;
  const radius = options.radius ?? 20;
  const scopeId = options.scopeId ?? `ivc${(scopeCounter += 1)}`;

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
    `--iv-grad:linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    `--iv-radius:${radius}px`,
    `--iv-font-h:${stack(fontHeading)}`,
    `--iv-font-b:${stack(fontBody)}`,
  ].join(";");

  const sizing = responsive
    ? `width:100%;max-width:${widthPx}px`
    : `width:${widthPx}px`;

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
