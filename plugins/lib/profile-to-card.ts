/**
 * Glue — extraction output → the profile a card renders.
 *
 * This file is one of only two places allowed to know about both sides
 * (the other is `brand-to-theme.ts`). `templates/` must never import from
 * `lib/`, which is what keeps the template set liftable. See DEV-3040.
 *
 * Two jobs:
 *
 *   1. CLEANING. Extraction returns every key whether or not the document had
 *      it, so nulls, blanks and junk arrive routinely — "N/A", "null", stray
 *      punctuation, truncated fragments, malformed URLs. All of it is stripped
 *      here so a card can trust that a present value is worth rendering.
 *
 *   2. TIMELINE DATES. Dates come back as free text ("2021–2025",
 *      "Summer 2024", "3 months"), so they cannot be sorted directly. A sort
 *      year is derived here; the original text is always what gets displayed.
 */

import type {
  CardProfile,
  EducationItem as CardEducation,
  ProjectItem as CardProject,
  InternshipItem as CardInternship,
  ExperienceItem as CardExperience,
  CertificationItem as CardCertification,
  AchievementItem as CardAchievement,
  PublicationItem as CardPublication,
  ExtracurricularItem as CardExtracurricular,
  RegistrationItem as CardRegistration,
  SocialLink as CardSocialLink,
  TimelineEntry,
} from "@/templates/types";
import type {
  ExtractedProfile,
  ProfessionalProfile,
  ProfileType,
  StudentProfile,
} from "@/lib/types";

/* ── cleaning ─────────────────────────────────────────────────────────────── */

/**
 * Values that mean "nothing here" but arrive as text. Compared lowercase after
 * stripping surrounding punctuation.
 */
const JUNK = new Set([
  "n/a",
  "na",
  "n.a.",
  "null",
  "nil",
  "none",
  "nan",
  "undefined",
  "-",
  "--",
  "—",
  "...",
  "tbd",
  "to be decided",
  "to be updated",
  "not specified",
  "not applicable",
  "not available",
  "unknown",
  "xxx",
  "xxxx",
  "abc",
  "test",
  "lorem ipsum",
  "your name",
  "your name here",
  "full name",
  "email address",
  "phone number",
]);

/**
 * Clean a free-text value.
 *
 * `minLength` guards against truncation artefacts — a stray "B" left behind by
 * a bad OCR pass is worse than showing nothing. Fields where one character is
 * legitimate (a grade) pass `minLength: 1`.
 */
export function cleanText(
  value: unknown,
  { minLength = 2 }: { minLength?: number } = {},
): string | null {
  if (typeof value !== "string") return null;

  // Collapse whitespace, including the non-breaking spaces PDFs love.
  const collapsed = value.replace(/[\s ]+/g, " ").trim();
  if (!collapsed) return null;

  // Strip wrapping punctuation before the junk comparison so "-N/A-" is caught.
  const bare = collapsed.replace(/^[\s\-–—_.,:;"'()[\]]+|[\s\-–—_.,:;"'()[\]]+$/g, "");
  if (!bare) return null;
  if (JUNK.has(bare.toLowerCase())) return null;
  if (bare.length < minLength) return null;

  // A value with no letters and no digits carries no information.
  if (!/[\p{L}\p{N}]/u.test(bare)) return null;

  return collapsed;
}

/** Clean a list of strings, dropping junk and duplicates while keeping order. */
export function cleanStringList(items: unknown, max = 40): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = cleanText(raw);
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Keep only URLs a card can safely link to.
 *
 * Mirrors the sanitising in `templates/helpers.ts` deliberately: cleaning here
 * means the card never receives a dead link, and the card's own check remains
 * the last line of defence for anything passed in directly.
 */
export function cleanUrl(value: unknown): string | null {
  const v = cleanText(value, { minLength: 4 });
  if (!v) return null;
  const noSpace = v.replace(/\s+/g, "");
  if (/^https?:\/\/\S+\.\S+/i.test(noSpace)) return noSpace;
  if (/^\/\/\S+\.\S+/.test(noSpace)) return "https:" + noSpace;
  // Bare domain, no foreign scheme.
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i.test(noSpace) && !/^[a-z][a-z0-9+.-]*:/i.test(noSpace)) {
    return "https://" + noSpace;
  }
  return null;
}

export function cleanEmail(value: unknown): string | null {
  const v = cleanText(value, { minLength: 5 });
  if (!v) return null;
  const compact = v.replace(/\s+/g, "");
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(compact) ? compact : null;
}

export function cleanPhone(value: unknown): string | null {
  const v = cleanText(value, { minLength: 5 });
  if (!v) return null;
  // Needs enough digits to be dialable; rejects "phone:" and similar leftovers.
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? v : null;
}

/* ── dates (Timeline, DEV-3038) ───────────────────────────────────────────── */

/** Ongoing entries sort above every real year. Never displayed. */
const PRESENT = 9999;

const ONGOING = /\b(present|current|ongoing|now|till date|to date)\b/i;

/**
 * Derive a sort year from free-text date data.
 *
 * Rules (see DEV-3038):
 *   - "present" / "current" / "ongoing" sort newest
 *   - otherwise take the LATEST 4-digit year in the text, so a range like
 *     "2021–2025" sorts by when it ended
 *   - nothing recoverable → null, and the entry keeps document order at the end
 *
 * Years outside 1950–2100 are ignored as noise (a "2 x 3000 hours" style
 * fragment should not become a date).
 */
export function deriveSortYear(text: unknown): number | null {
  if (typeof text !== "string") return null;
  if (ONGOING.test(text)) return PRESENT;

  const matches = text.match(/\b(19|20)\d{2}\b/g);
  if (!matches || matches.length === 0) return null;

  const years = matches.map(Number).filter((y) => y >= 1950 && y <= 2100);
  if (years.length === 0) return null;

  return Math.max(...years);
}

/**
 * Build the Timeline spine: education, internships, projects and experience
 * merged into one chronological list.
 *
 * Dated entries come first, newest first. Undated entries follow in document
 * order — they still render, just without a year label.
 */
export function buildTimeline(p: CardProfile): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const e of p.education) {
    const title = [e.degree, e.field].filter(Boolean).join(", ");
    if (!title && !e.institution) continue;
    entries.push({
      kind: "education",
      title: title || e.institution!,
      subtitle: title ? e.institution : null,
      dateText: e.year,
      sortYear: deriveSortYear(e.year),
    });
  }

  for (const i of p.internships) {
    if (!i.role && !i.organization) continue;
    entries.push({
      kind: "internship",
      title: i.role ?? i.organization!,
      subtitle: i.role ? i.organization : null,
      dateText: i.duration,
      sortYear: deriveSortYear(i.duration),
    });
  }

  for (const x of p.experience) {
    if (!x.role && !x.company) continue;
    entries.push({
      kind: "experience",
      title: x.role ?? x.company!,
      subtitle: x.role ? x.company : null,
      dateText: x.duration,
      sortYear: deriveSortYear(x.duration),
    });
  }

  // Publications and achievements carry a year, so they belong on a spine
  // organised by time — and a researcher's papers are often the most substantial
  // thing on their CV. They were absent from the timeline because they were absent
  // from the card profile entirely.
  for (const pub of p.publications) {
    if (!pub.title) continue;
    entries.push({
      kind: "publication",
      title: pub.title,
      subtitle: pub.venue,
      dateText: pub.year,
      sortYear: deriveSortYear(pub.year),
    });
  }

  for (const ach of p.achievements) {
    if (!ach.title) continue;
    entries.push({
      kind: "achievement",
      title: ach.title,
      subtitle: null,
      dateText: ach.year,
      sortYear: deriveSortYear(ach.year),
    });
  }

  for (const pr of p.projects) {
    if (!pr.title) continue;
    entries.push({
      kind: "project",
      title: pr.title,
      subtitle: pr.description,
      dateText: null,
      sortYear: null,
    });
  }

  const dated = entries.filter((e) => e.sortYear !== null);
  const undated = entries.filter((e) => e.sortYear === null);
  dated.sort((a, b) => b.sortYear! - a.sortYear!);

  return [...dated, ...undated];
}

/* ── item mappers ─────────────────────────────────────────────────────────── */

function mapEducation(items: unknown): CardEducation[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((e: Record<string, unknown>) => ({
      degree: cleanText(e?.degree),
      field: cleanText(e?.field),
      institution: cleanText(e?.institution),
      year: cleanText(e?.year, { minLength: 4 }),
      // A grade can legitimately be a single character ("A", "S").
      grade: cleanText(e?.grade, { minLength: 1 }),
    }))
    .filter((e) => e.degree || e.field || e.institution);
}

function mapProjects(items: unknown): CardProject[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((p: Record<string, unknown>) => ({
      title: cleanText(p?.title),
      description: cleanText(p?.description),
      technologies: cleanStringList(p?.technologies, 10),
      link: cleanUrl(p?.link),
    }))
    .filter((p) => p.title || p.description);
}

function mapInternships(items: unknown): CardInternship[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((i: Record<string, unknown>) => ({
      role: cleanText(i?.role),
      organization: cleanText(i?.organization),
      duration: cleanText(i?.duration, { minLength: 3 }),
      description: cleanText(i?.description),
    }))
    .filter((i) => i.role || i.organization);
}

function mapExperience(items: unknown): CardExperience[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((x: Record<string, unknown>) => ({
      role: cleanText(x?.role),
      company: cleanText(x?.company),
      duration: cleanText(x?.duration, { minLength: 3 }),
      location: cleanText(x?.location),
      highlights: cleanStringList(x?.highlights, 6),
    }))
    .filter((x) => x.role || x.company);
}

function mapCertifications(items: unknown): CardCertification[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((c: Record<string, unknown>) => ({
      name: cleanText(c?.name),
      issuer: cleanText(c?.issuer),
      year: cleanText(c?.year, { minLength: 4 }),
    }))
    .filter((c) => c.name);
}

/*
 * The four mappers below close a gap that ran from the start: `achievements`,
 * `publications`, `extracurriculars` and `registrations` were all extracted by
 * Module 1, typed in lib/types.ts, and never mapped here — so a CV listing awards
 * or papers lost them without a trace. Adding a field to `lib/schema.ts` means
 * adding it here and to `templates/types.ts`, or it is extracted and discarded.
 */

function mapAchievements(items: unknown): CardAchievement[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((a: Record<string, unknown>) => ({
      title: cleanText(a?.title),
      year: cleanText(a?.year, { minLength: 4 }),
    }))
    .filter((a) => a.title);
}

function mapPublications(items: unknown): CardPublication[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((p: Record<string, unknown>) => ({
      title: cleanText(p?.title),
      venue: cleanText(p?.venue),
      year: cleanText(p?.year, { minLength: 4 }),
      link: cleanUrl(p?.link),
    }))
    .filter((p) => p.title);
}

function mapExtracurriculars(items: unknown): CardExtracurricular[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((e: Record<string, unknown>) => ({
      activity: cleanText(e?.activity),
      role: cleanText(e?.role),
    }))
    .filter((e) => e.activity);
}

function mapRegistrations(items: unknown): CardRegistration[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((r: Record<string, unknown>) => ({
      type: cleanText(r?.type),
      // A registration number is the one field where a short string is the whole
      // point, so it is allowed down to a single character.
      id: cleanText(r?.id, { minLength: 1 }),
    }))
    .filter((r) => r.type || r.id);
}

function mapSocialLinks(items: unknown): CardSocialLink[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: CardSocialLink[] = [];
  for (const s of items as Array<Record<string, unknown>>) {
    const url = cleanUrl(s?.url);
    if (!url) continue;
    const k = url.toLowerCase().replace(/\/+$/, "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ platform: cleanText(s?.platform, { minLength: 1 }), url });
  }
  return out;
}

/* ── entry point ──────────────────────────────────────────────────────────── */

export interface ProfileToCardInput {
  profile: ExtractedProfile | Record<string, unknown>;
  profile_type: ProfileType;
  /** Module 3 output. Its bio wins over the extracted summary when present. */
  enhanced?: { bio?: string | null } | null;
  /** Supplied by AnurCloud — not something extraction produces. */
  photo_url?: string | null;
}

/**
 * Convert an extracted (and ideally human-reviewed) profile into the cleaned,
 * card-ready shape. Safe to call on partial or messy input.
 */
export function profileToCard(input: ProfileToCardInput): CardProfile {
  const raw = (input.profile ?? {}) as Partial<StudentProfile & ProfessionalProfile> &
    Record<string, unknown>;
  const profileType: ProfileType = input.profile_type === "student" ? "student" : "professional";

  // The enhanced bio is written for display; the extracted summary is a fallback.
  const bio = cleanText(input.enhanced?.bio) ?? cleanText(raw.summary);

  const card: CardProfile = {
    profileType,
    fullName: cleanText(raw.full_name),
    designation: cleanText(raw.designation),
    email: cleanEmail(raw.email),
    phone: cleanPhone(raw.phone),
    location: cleanText(raw.location),
    bio,
    photoUrl: cleanUrl(input.photo_url),
    website: null,
    websites: [],
    // 40 rather than 20: a senior CV routinely lists more, and the card decides
    // how many to SHOW. Truncating here would throw the rest away before any
    // layout got a chance to use them.
    skills: cleanStringList(raw.skills, 40),
    languages: cleanStringList(raw.languages, 15),
    socialLinks: mapSocialLinks(raw.social_links),
    education: mapEducation(raw.education),
    certifications: mapCertifications(raw.certifications),
    achievements: mapAchievements(raw.achievements),
    publications: mapPublications(raw.publications),
    projects: mapProjects(raw.projects),
    internships: mapInternships(raw.internships),
    extracurriculars: mapExtracurriculars(raw.extracurriculars),
    currentCompany: cleanText(raw.current_company),
    totalYearsExperience: cleanText(raw.total_years_experience, { minLength: 1 }),
    experience: mapExperience(raw.experience),
    registrations: mapRegistrations(raw.registrations),
    timeline: [],
  };

  // Professionals carry their sites in portfolio_links; students in social_links.
  // Every one is kept — a CV listing a portfolio, a case-study site and a demo
  // used to lose all but the first.
  const portfolio = Array.isArray(raw.portfolio_links)
    ? raw.portfolio_links.map(cleanUrl).filter((u): u is string => u !== null)
    : [];
  const fromSocial = card.socialLinks
    .filter((s) => /web|site|port/i.test(s.platform ?? ""))
    .map((s) => s.url!);
  card.websites = [...new Set([...portfolio, ...fromSocial])];
  card.website = card.websites[0] ?? null;

  // Built last — it reads from the already-cleaned lists.
  card.timeline = buildTimeline(card);

  return card;
}
