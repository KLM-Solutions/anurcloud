/**
 * Public contract for @pxlbrain/insta-viz-templates.
 *
 * The `CardProfile` shape is intentionally aligned with the Insta VIZ pipeline
 * output (Module 1 Extraction + Module 3 Enhancement) so the host app can feed the
 * pipeline result in almost directly. Every field is optional — a template only
 * renders the sections it actually has data for.
 */

export type ProfileType = "student" | "professional";

/* ── Nested items (match plugins/lib/types.ts field names) ── */

export interface SocialLink {
  /** e.g. "linkedin", "instagram", "github", "x", "facebook", "website" */
  platform?: string | null;
  url?: string | null;
}

export interface EducationItem {
  degree?: string | null;
  field?: string | null;
  institution?: string | null;
  year?: string | null;
  grade?: string | null;
}

export interface ProjectItem {
  title?: string | null;
  description?: string | null;
  technologies?: string[];
  link?: string | null;
}

export interface InternshipItem {
  role?: string | null;
  organization?: string | null;
  duration?: string | null;
  description?: string | null;
}

export interface ExperienceItem {
  role?: string | null;
  company?: string | null;
  duration?: string | null;
  location?: string | null;
  highlights?: string[];
}

export interface CertificationItem {
  name?: string | null;
  issuer?: string | null;
  year?: string | null;
}

/** The person the card is for. Pass the pipeline profile straight in. */
export interface CardProfile {
  /** Drives audience-aware bits (motifs, which sections show). Defaults to "professional". */
  profileType?: ProfileType;

  fullName?: string | null;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;

  /** Short blurb. Prefer the Module 3 enhanced bio; falls back to summary. */
  bio?: string | null;
  summary?: string | null;

  /** Absolute URL to a profile photo. Falls back to initials if absent. */
  photoUrl?: string | null;

  skills?: string[];
  languages?: string[];
  socialLinks?: SocialLink[];
  website?: string | null;

  education?: EducationItem[];
  certifications?: CertificationItem[];

  /** Student-leaning */
  projects?: ProjectItem[];
  internships?: InternshipItem[];

  /** Professional-leaning */
  currentCompany?: string | null;
  totalYearsExperience?: string | null;
  experience?: ExperienceItem[];
}

/* ── Theme (answers Mithra's Q2 colour / Q3 logo / Q4 font / Q5 size) ── */

export interface ThemeColors {
  /** Header/base brand colour. A gradient is derived from this unless `gradient` is set. */
  primary?: string;
  /** Buttons, icon chips, highlights. */
  accent?: string;
  /** Card body background. */
  background?: string;
  /** Inner surface (contact block etc.). */
  surface?: string;
  /** Primary text colour. */
  text?: string;
  /** Secondary / label text colour. */
  muted?: string;
  /** Text/icon colour that sits on top of `primary` (the coloured header). */
  onPrimary?: string;
}

export interface ThemeLogo {
  /** Absolute URL to a logo image. If omitted, `text` is shown instead. */
  url?: string;
  /** Fallback text logo when no image url is given. */
  text?: string;
  /** Where the logo sits in the header. Default "top-left". */
  position?: "top-left" | "top-right";
  /** Rendered logo height in px. Default 22. */
  height?: number;
}

/** Named size presets map to card widths: sm 320 · md 380 · lg 440 (px). */
export type SizePreset = "sm" | "md" | "lg";

export interface ThemeFont {
  /** Font family for name/headings, e.g. "Poppins". */
  heading?: string;
  /** Font family for body text, e.g. "Inter". */
  body?: string;
}

export interface ThemeOptions {
  /** Palette. Pass a single hex string as shorthand for `{ primary }`. */
  colors?: ThemeColors | string;
  /** Explicit header gradient [from, to]. Overrides the auto-derived one. */
  gradient?: [string, string];
  /** Font families. Pass a single string to use it for both heading and body. */
  font?: ThemeFont | string;
  /** Typography scale multiplier (1 = default). Scales all text + spacing. */
  fontScale?: number;
  /** Card width: a preset ("sm"|"md"|"lg") or an explicit px number. Default "md". */
  size?: SizePreset | number;
  /** If true, the card fills its container width up to `size` (responsive). Default false (fixed). */
  responsive?: boolean;
  /** Corner radius in px. Default 20. */
  radius?: number;
  /** Logo shown in the header. */
  logo?: ThemeLogo;
  /** Optional explicit scope id (for SSR determinism). Auto-generated if omitted. */
  scopeId?: string;
}

/* ── Registry ── */

export interface TemplateInfo {
  /** The number the caller passes: renderCard(1, ...). */
  id: number;
  /** Stable string key, also accepted by renderCard. */
  key: string;
  name: string;
  description: string;
  /** Which profile pool this template belongs to. A template is offered to one audience only. */
  audience: ProfileType;
}
