/**
 * Module 1 extraction schema — the SINGLE SOURCE OF TRUTH for what we extract.
 *
 * Approach A: one rich superset per profile_type, every field optional. The
 * `description` on each field is what guides the AI engine to map
 * arbitrary document content onto the field — so descriptions matter.
 *
 * This drives: (1) the UI "fields we'll extract" preview, and (2) — next step —
 * the engine's JSON schema generation. Keep it aligned with lib/types.ts.
 */

import type { ProfileType } from "./types";

export type FieldType = "string" | "string[]" | "object[]";

export interface SubField {
  key: string;
  label: string;
  /** Sub-field value type; defaults to "string". */
  type?: "string" | "string[]";
  /** Guides the extraction engine — same role as SchemaField.description but for nested properties. */
  description?: string;
}

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  description: string;
  /** For `string[]` fields — guides the engine on what each individual item should contain. */
  itemDescription?: string;
  /** Present for `object[]` fields. */
  fields?: SubField[];
}

/* ── Common core (both profile types) ── */
const COMMON: SchemaField[] = [
  { key: "full_name", label: "Full name", type: "string", description: "The person's full name." },
  {
    key: "designation",
    label: "Designation / headline",
    type: "string",
    description:
      "Current primary role or headline, e.g. 'Senior Software Engineer' or 'Final-year MBBS Student'.",
  },
  { key: "email", label: "Email", type: "string", description: "Primary email address." },
  { key: "phone", label: "Phone", type: "string", description: "Primary contact number." },
  {
    key: "location",
    label: "Location",
    type: "string",
    description: "City / state / country of residence.",
  },
  {
    key: "summary",
    label: "Summary / bio",
    type: "string",
    description: "Short professional summary or objective, if present.",
  },
  {
    key: "skills",
    label: "Skills",
    type: "string[]",
    description: "Technical and professional skills mentioned.",
    itemDescription: "One skill per item in title case e.g. 'React', 'Node.js', 'Machine Learning'. Do not combine multiple skills into one item.",
  },
  {
    key: "languages",
    label: "Languages",
    type: "string[]",
    description: "Spoken/written languages mentioned.",
    itemDescription: "One language per item e.g. 'English', 'Tamil', 'Hindi'. Do not include proficiency level.",
  },
  {
    key: "social_links",
    label: "Social links",
    type: "object[]",
    description: "Profiles and links — LinkedIn, GitHub, portfolio, Twitter/X, etc. Extract both visible URLs and URLs written near platform names. If a URL is not visible, still record the platform with a null URL.",
    fields: [
      { key: "platform", label: "Platform", description: "Platform name e.g. LinkedIn, GitHub, Twitter/X, Behance, Dribbble, portfolio." },
      { key: "url", label: "URL", description: "Full URL to the profile or page. Include the scheme (https://). If only a partial URL is visible e.g. 'linkedin.com/in/username', expand it to the full URL. Return null if no URL is found." },
    ],
  },
  {
    key: "education",
    label: "Education",
    type: "object[]",
    description: "Academic history.",
    fields: [
      { key: "degree", label: "Degree", description: "Degree type e.g. B.Tech, M.Sc, MBA, MBBS, Ph.D, High School Diploma." },
      { key: "field", label: "Field of study", description: "Major or field of study e.g. Computer Science, Mechanical Engineering, Medicine." },
      { key: "institution", label: "Institution", description: "Full name of the university, college, or school." },
      { key: "year", label: "Year / duration", description: "Study period or graduation year e.g. '2021–2025' or '2023'." },
      { key: "grade", label: "GPA / grade", description: "Grade as stated on the document — include the scale e.g. '8.4/10', '3.8/4.0', '92%', 'First Class'. Do not convert or normalise." },
    ],
  },
  {
    key: "certifications",
    label: "Certifications",
    type: "object[]",
    description: "Certifications and licences.",
    fields: [
      { key: "name", label: "Name", description: "Full name of the certification or licence." },
      { key: "issuer", label: "Issuer", description: "Issuing organisation e.g. AWS, Google, Microsoft, Coursera, NASSCOM." },
      { key: "year", label: "Year", description: "Year the certification was issued or completed." },
    ],
  },
  {
    key: "achievements",
    label: "Achievements / awards",
    type: "object[]",
    description: "Awards, honours, and notable achievements.",
    fields: [
      { key: "title", label: "Title", description: "Name of the award, honour, or achievement." },
      { key: "year", label: "Year", description: "Year the achievement was received." },
    ],
  },
];

/* ── Student-only ── */
const STUDENT_ONLY: SchemaField[] = [
  {
    key: "projects",
    label: "Projects",
    type: "object[]",
    description: "Academic, personal, or hackathon projects.",
    fields: [
      { key: "title", label: "Title", description: "Project name." },
      { key: "description", label: "Description", description: "Brief description of what the project does or its purpose." },
      { key: "technologies", label: "Technologies / tools", type: "string[]", description: "Technologies, frameworks, and tools used; one item per technology." },
      { key: "link", label: "Link", description: "URL to the project, demo, or repository if present." },
    ],
  },
  {
    key: "internships",
    label: "Internships",
    type: "object[]",
    description: "Internship experiences.",
    fields: [
      { key: "role", label: "Role", description: "Job title or role during the internship." },
      { key: "organization", label: "Organization", description: "Name of the company or organisation." },
      { key: "duration", label: "Duration", description: "Duration or period e.g. 'Summer 2024', 'Jun–Aug 2023', '3 months'." },
      { key: "description", label: "Description", description: "Summary of work done, responsibilities, or key contributions." },
    ],
  },
  {
    key: "extracurriculars",
    label: "Extracurriculars",
    type: "object[]",
    description: "Clubs, sports, cultural and volunteer activities.",
    fields: [
      { key: "activity", label: "Activity", description: "Name of the club, sport, cultural activity, or volunteer programme." },
      { key: "role", label: "Role", description: "Role held e.g. President, Member, Volunteer, Captain. Leave empty if not stated." },
    ],
  },
  {
    key: "publications",
    label: "Publications",
    type: "object[]",
    description: "Research papers / publications (research & medical students).",
    fields: [
      { key: "title", label: "Title", description: "Full title of the paper, article, or publication." },
      { key: "venue", label: "Venue", description: "Journal name, conference, or platform where it was published." },
      { key: "year", label: "Year", description: "Year of publication." },
      { key: "link", label: "Link", description: "URL or DOI link to the publication if present." },
    ],
  },
];

/* ── Professional-only ── */
const PROFESSIONAL_ONLY: SchemaField[] = [
  {
    key: "current_company",
    label: "Current company",
    type: "string",
    description:
      "The professional's current or most recent employer. Identify it by finding the experience entry with the latest or ongoing date range (e.g. 'present', '2024–now'). Use the company name exactly as written. Do not pick the first listed company — resumes can be ordered oldest-first or newest-first.",
  },
  {
    key: "experience",
    label: "Work experience",
    type: "object[]",
    description: "Professional work history.",
    fields: [
      { key: "role", label: "Role", description: "Exact job title as written on the document e.g. 'Senior Software Engineer', 'Product Manager'." },
      { key: "company", label: "Company", description: "Employer name." },
      { key: "duration", label: "Duration", description: "Employment period e.g. 'Jan 2020 – Mar 2023', '2020–present'. Use 'present' if the role is ongoing." },
      { key: "location", label: "Location", description: "City or country of the role. Leave empty if not stated." },
      { key: "highlights", label: "Highlights", type: "string[]", description: "Key achievements or responsibilities; each bullet point or sentence is one array item. Do not merge multiple bullets into one item." },
    ],
  },
  {
    key: "total_years_experience",
    label: "Total years of experience",
    type: "string",
    description:
      "Total years of professional experience as a whole number followed by 'years', e.g. '5 years', '12 years'. Calculate from the earliest role start date to the present (or last role end date if no ongoing role). Round to the nearest whole year. If the document explicitly states a total, use that value directly instead of calculating.",
  },
  {
    key: "projects",
    label: "Projects / portfolio",
    type: "object[]",
    description: "Notable portfolio or professional projects.",
    fields: [
      { key: "title", label: "Title", description: "Project name." },
      { key: "description", label: "Description", description: "Brief description of the project's purpose or outcome." },
      { key: "technologies", label: "Technologies / tools", type: "string[]", description: "Technologies, frameworks, and tools used; one item per technology." },
      { key: "link", label: "Link", description: "URL to the project, demo, or repository if present." },
    ],
  },
  {
    key: "portfolio_links",
    label: "Portfolio links",
    type: "string[]",
    description: "Links to portfolio, personal website, or project demos.",
    itemDescription: "A direct URL to a portfolio, personal website, or project demo. Do not include LinkedIn, GitHub, or social profile URLs here — those belong in social_links.",
  },
  {
    key: "publications",
    label: "Publications",
    type: "object[]",
    description: "Research papers / publications (academics, researchers, doctors).",
    fields: [
      { key: "title", label: "Title", description: "Full title of the paper, article, or publication." },
      { key: "venue", label: "Venue", description: "Journal name, conference, or platform where it was published." },
      { key: "year", label: "Year", description: "Year of publication." },
      { key: "link", label: "Link", description: "URL or DOI link to the publication if present." },
    ],
  },
  {
    key: "registrations",
    label: "Professional registrations",
    type: "object[]",
    description:
      "Profession-specific registrations/memberships, e.g. Bar Council or Medical Council number.",
    fields: [
      { key: "type", label: "Type", description: "Registration type e.g. 'Bar Council Number', 'Medical Council ID', 'CPA License', 'ICAI Membership'." },
      { key: "id", label: "ID / number", description: "The registration number or identifier string exactly as written." },
    ],
  },
];

export const EXTRACTION_SCHEMA: Record<ProfileType, SchemaField[]> = {
  student: [...COMMON, ...STUDENT_ONLY],
  professional: [...COMMON, ...PROFESSIONAL_ONLY],
};

/** Fields grouped into the shared "core" set and the profile-specific set (for UI display). */
export const SCHEMA_GROUPS: Record<ProfileType, { common: SchemaField[]; specific: SchemaField[] }> = {
  student: { common: COMMON, specific: STUDENT_ONLY },
  professional: { common: COMMON, specific: PROFESSIONAL_ONLY },
};

export function schemaFieldKeys(profileType: ProfileType): string[] {
  return EXTRACTION_SCHEMA[profileType].map((f) => f.key);
}

/* ── JSON Schema generation (fed to the engine as `data_schema`) ── */

type JsonSchemaValue =
  | { [key: string]: JsonSchemaValue }
  | JsonSchemaValue[]
  | string
  | number
  | boolean
  | null;
export type JsonSchema = { [key: string]: JsonSchemaValue };

function fieldToJsonSchema(field: SchemaField): JsonSchema {
  switch (field.type) {
    case "string":
      return { type: "string", description: field.description };
    case "string[]":
      return {
        type: "array",
        description: field.description,
        items: field.itemDescription
          ? { type: "string", description: field.itemDescription }
          : { type: "string" },
      };
    case "object[]": {
      const properties: JsonSchema = {};
      for (const sub of field.fields ?? []) {
        if (sub.type === "string[]") {
          properties[sub.key] = sub.description
            ? { type: "array", items: { type: "string" }, description: sub.description }
            : { type: "array", items: { type: "string" } };
        } else {
          properties[sub.key] = sub.description
            ? { type: "string", description: sub.description }
            : { type: "string" };
        }
      }
      return {
        type: "array",
        description: field.description,
        items: { type: "object", properties },
      };
    }
  }
}

/**
 * Builds the JSON Schema for a profile type from the field catalog above.
 * All fields are marked required so LlamaExtract always returns every key
 * (null or [] when absent) — prevents silent field omission on uncertain fields.
 */
export function toJsonSchema(profileType: ProfileType): JsonSchema {
  const properties: JsonSchema = {};
  const required: string[] = [];
  for (const field of EXTRACTION_SCHEMA[profileType]) {
    properties[field.key] = fieldToJsonSchema(field);
    required.push(field.key);
  }
  return { type: "object", properties, required, additionalProperties: false };
}
