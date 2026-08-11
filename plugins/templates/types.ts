/**
 * Insta VIZ smart-card templates — the card-side contract.
 *
 * ⚠️ SELF-CONTAINED FOLDER. Nothing in `templates/` may import from `lib/` or
 * `app/`. Everything that knows about both sides lives in the glue:
 * `lib/profile-to-card.ts` and `lib/brand-to-theme.ts`.
 *
 * This keeps the template set liftable — deliverable on its own, or publishable
 * as a package later — without touching a line. See DEV-3040.
 */

export type ProfileType = "student" | "professional";

/* ── Nested items ─────────────────────────────────────────────────────────── */

export interface SocialLink {
  platform: string | null;
  url: string | null;
}

export interface EducationItem {
  degree: string | null;
  field: string | null;
  institution: string | null;
  year: string | null;
  grade: string | null;
}

export interface CertificationItem {
  name: string | null;
  issuer: string | null;
  year: string | null;
}

export interface ProjectItem {
  title: string | null;
  description: string | null;
  technologies: string[];
  link: string | null;
}

export interface InternshipItem {
  role: string | null;
  organization: string | null;
  duration: string | null;
  description: string | null;
}

export interface ExperienceItem {
  role: string | null;
  company: string | null;
  duration: string | null;
  location: string | null;
  highlights: string[];
}

/**
 * The four families below were extracted by Module 1 from the start and never
 * reached a card — the template set was built against a subset of the schema, so
 * a CV listing awards, papers, clubs or a Bar Council number lost all of it
 * silently. Found and closed 11 Aug 2026.
 *
 * `lib/schema.ts` is the source of truth for what can arrive. When a field is
 * added there it has to appear here too, or it is extracted and thrown away.
 */

/** Awards and honours. Common to both audiences. */
export interface AchievementItem {
  title: string | null;
  year: string | null;
}

/** Papers. Real for medical, research and academic profiles in both pools. */
export interface PublicationItem {
  title: string | null;
  venue: string | null;
  year: string | null;
  link: string | null;
}

/** Clubs, sport, volunteering. Student-side. */
export interface ExtracurricularItem {
  activity: string | null;
  role: string | null;
}

/** Bar Council / Medical Council / ICAI style registrations. Professional-side. */
export interface RegistrationItem {
  type: string | null;
  id: string | null;
}

/**
 * One entry on the Timeline card's spine (DEV-3038).
 *
 * Built and sorted in `lib/profile-to-card.ts` — the card never parses a date.
 * `dateText` is always what gets displayed; `sortYear` exists only to order the
 * list and is null when nothing usable could be recovered from the text.
 */
export interface TimelineEntry {
  kind: "education" | "internship" | "project" | "experience" | "achievement" | "publication";
  title: string;
  subtitle: string | null;
  dateText: string | null;
  sortYear: number | null;
}

/* ── The profile a card receives ──────────────────────────────────────────── */

/**
 * Already cleaned by `lib/profile-to-card.ts`: blanks, "N/A", placeholder text,
 * malformed URLs and junk values are stripped before a card ever sees them.
 *
 * A card may therefore trust that any present value is worth rendering — but
 * must still assume any field can be absent. Real profiles are patchy.
 */
export interface CardProfile {
  profileType: ProfileType;

  fullName: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;

  /** Enhanced bio (Module 3) if present, else the extracted summary. */
  bio: string | null;

  photoUrl: string | null;
  /** First portfolio link — the one shown as a single line. */
  website: string | null;
  /**
   * Every portfolio link, in order. `website` is `websites[0]`.
   *
   * A professional CV routinely lists several (a portfolio, a case-study site, a
   * demo); keeping only the first threw the rest away.
   */
  websites: string[];

  skills: string[];
  languages: string[];
  socialLinks: SocialLink[];

  education: EducationItem[];
  certifications: CertificationItem[];
  /** Common to both audiences. */
  achievements: AchievementItem[];
  publications: PublicationItem[];

  /** Student-leaning */
  projects: ProjectItem[];
  internships: InternshipItem[];
  extracurriculars: ExtracurricularItem[];

  /** Professional-leaning */
  currentCompany: string | null;
  totalYearsExperience: string | null;
  experience: ExperienceItem[];
  registrations: RegistrationItem[];

  /** Pre-merged and pre-sorted for the Timeline card. Newest first. */
  timeline: TimelineEntry[];
}

/* ── Theme ────────────────────────────────────────────────────────────────── */

export interface ThemeColors {
  /** Brand colour. A gradient is derived from this unless `gradient` is set. */
  primary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  /** Text/icon colour sitting on top of `primary`. */
  onPrimary?: string;
}

export interface ThemeLogo {
  url?: string;
  /** Fallback when no image url is given. */
  text?: string;
  position?: "top-left" | "top-right";
  /** Rendered height in px. Default 22. */
  height?: number;
}

export interface ThemeFont {
  heading?: string;
  body?: string;
}

/** Named presets map to card widths: sm 320 · md 380 · lg 440 (px). */
export type SizePreset = "sm" | "md" | "lg";

/**
 * The full option set. Every template accepts all of it, identically —
 * a standing commitment to the client (answered 22 Jul, accepted 3 Aug 2026).
 * No template may be more limited than another.
 */
export interface ThemeOptions {
  /** Pass a hex string as shorthand for `{ primary }`. */
  colors?: ThemeColors | string;
  gradient?: [string, string];
  /** Pass a string to use one family for both heading and body. */
  font?: ThemeFont | string;
  /** Typography scale multiplier (1 = default). */
  fontScale?: number;
  /** Preset, or an explicit px width. Default "md". */
  size?: SizePreset | number;
  /** Fill the container up to `size` instead of a fixed width. Default false. */
  responsive?: boolean;
  radius?: number;
  logo?: ThemeLogo;
  /** Explicit scope id for SSR determinism. Auto-generated if omitted. */
  scopeId?: string;
}

/* ── Registry ─────────────────────────────────────────────────────────────── */

/**
 * Stable keys for the v1 set. Cards register against these.
 *
 * Two pools, and a template belongs to exactly one (`TemplateInfo.audience`).
 * The professional keys are not variants of the student ones — the client's
 * 3 Aug 2026 note was that our first prototypes shared a skeleton, so the
 * professional set is designed against the student set as much as against
 * itself.
 */
export type TemplateKey =
  /* student */
  | "side-rail"
  | "hero-split"
  | "centre-portrait"
  | "timeline"
  | "tile-grid"
  | "footer-anchor"
  | "corner-wedge"
  | "monogram-block"
  | "index-ledger"
  | "column-flow"
  /* professional, in catalogue order */
  | "skill-meters"
  | "split-halves"
  | "overlap"
  | "numbered"
  | "folder-tab"
  | "stat-strip"
  | "role-ladder"
  | "letterhead"
  | "edge-spine"
  | "pull-quote";

export interface TemplateInfo {
  /** The number the caller passes: renderCard(1, ...). */
  id: number;
  key: TemplateKey;
  name: string;
  description: string;
  /** A template belongs to one audience pool only. */
  audience: ProfileType;
  /** Human-readable minimum, surfaced to the caller alongside eligibility. */
  minimum: string;
}

/** Why a template was excluded from a recommendation. */
export interface TemplateEligibility {
  id: number;
  key: TemplateKey;
  name: string;
  eligible: boolean;
  /** Null when eligible. */
  reason: string | null;
}
