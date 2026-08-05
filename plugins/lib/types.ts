/**
 * Module 1 — Extraction · shared contract types.
 *
 * Input from AnurCloud (Handoff 1, see flow.html):
 *   POST /api/extract  (multipart/form-data)
 *   Authorization: Bearer <auth_token>
 *   fields: file (PDF/DOCX/JPG/PNG), profile_type   — no size limit
 *
 * Output is profile-type-shaped (Approach A): one rich superset schema per
 * type, every field optional → absent data comes back null/empty ("if present").
 * The field list lives in lib/schema.ts (single source of truth).
 */

export type ProfileType = "student" | "professional";

/* ── Reusable nested items (arrays of objects in the schema) ── */

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
export interface AchievementItem {
  title: string | null;
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
export interface ExtracurricularItem {
  activity: string | null;
  role: string | null;
}
export interface PublicationItem {
  title: string | null;
  venue: string | null;
  year: string | null;
  link: string | null;
}
export interface ExperienceItem {
  role: string | null;
  company: string | null;
  duration: string | null;
  location: string | null;
  highlights: string[];
}
export interface RegistrationItem {
  type: string | null;
  id: string | null;
}

/* ── Common core (extracted for both profile types) ── */

export interface BaseProfile {
  full_name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  skills: string[];
  languages: string[];
  social_links: SocialLink[];
  education: EducationItem[];
  certifications: CertificationItem[];
  achievements: AchievementItem[];
}

export interface StudentProfile extends BaseProfile {
  projects: ProjectItem[];
  internships: InternshipItem[];
  extracurriculars: ExtracurricularItem[];
  publications: PublicationItem[];
}

export interface ProfessionalProfile extends BaseProfile {
  current_company: string | null;
  experience: ExperienceItem[];
  total_years_experience: string | null;
  projects: ProjectItem[];
  portfolio_links: string[];
  publications: PublicationItem[];
  registrations: RegistrationItem[];
}

export type ExtractedProfile = StudentProfile | ProfessionalProfile;

/* ── Brand theme (colours + logo for the card templates) ── */

/** Where the theme came from — surfaced so the caller knows how much to trust it. */
export type BrandSource = "firecrawl" | "logo-image" | "favicon" | "default";

export type BrandConfidence = "high" | "medium" | "low";

/**
 * Colours and logo derived from the user's website or uploaded logo.
 *
 * Feeds the template package directly:
 *   renderCard(id, profile, { colors: { primary, accent }, logo: { url: logo_url } })
 *
 * `primary` is null only in the transitional case where a logo was found but no
 * colour could be derived; `withProfileDefaults()` in lib/brand.ts fills it in
 * before the value reaches a response.
 */
export interface BrandTheme {
  primary: string | null;
  accent: string | null;
  /** Ranked, deduplicated — up to 6. Lets the UI offer alternatives. */
  palette: string[];
  /** Absolute URL or a `data:` URI. Drops straight into the template's logo option. */
  logo_url: string | null;
  fonts: { heading: string | null; body: string | null } | null;
  source: BrandSource;
  confidence: BrandConfidence;
  /** Human-readable explanation when something fell back. Null on a clean run. */
  notes: string | null;
}

/* ── API response contract ── */

/** Per-field confidence (0–1), uncalibrated — use comparatively, not as absolute accuracy. */
export type ConfidenceScores = Record<string, number>;

export interface ExtractSuccess {
  status: "success";
  profile_type: ProfileType;
  data: ExtractedProfile;
  confidence_scores: ConfidenceScores;
  /** Fields whose confidence fell below the flag threshold (default 0.7). */
  flagged_fields: string[];
  /**
   * Brand colours + logo. Present on URL extraction, and on file extraction when
   * an optional `logo` was uploaded alongside the document. Null when neither
   * applies — a brand lookup never fails the extraction itself.
   */
  brand?: BrandTheme | null;
}

export interface ExtractError {
  status: "error";
  error: { code: string; message: string };
}

/**
 * Transitional response returned by the upload feature *before* the
 * extraction engine is configured. Confirms receipt + validation, and echoes
 * which schema (field set) would be used for the given profile_type.
 */
export interface ExtractReceived {
  status: "received";
  message: string;
  received: {
    file: { filename: string; size_bytes: number; mime_type: string };
    profile_type: ProfileType;
  };
  schema_preview: { profile_type: ProfileType; fields: string[] };
}

export type ExtractResponse = ExtractSuccess | ExtractError | ExtractReceived;
