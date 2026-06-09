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
}

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  description: string;
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
  },
  {
    key: "languages",
    label: "Languages",
    type: "string[]",
    description: "Spoken/written languages mentioned.",
  },
  {
    key: "social_links",
    label: "Social links",
    type: "object[]",
    description: "Profiles and links — LinkedIn, GitHub, portfolio, Twitter/X, etc.",
    fields: [
      { key: "platform", label: "Platform" },
      { key: "url", label: "URL" },
    ],
  },
  {
    key: "education",
    label: "Education",
    type: "object[]",
    description: "Academic history.",
    fields: [
      { key: "degree", label: "Degree" },
      { key: "field", label: "Field of study" },
      { key: "institution", label: "Institution" },
      { key: "year", label: "Year / duration" },
      { key: "grade", label: "GPA / grade" },
    ],
  },
  {
    key: "certifications",
    label: "Certifications",
    type: "object[]",
    description: "Certifications and licences.",
    fields: [
      { key: "name", label: "Name" },
      { key: "issuer", label: "Issuer" },
      { key: "year", label: "Year" },
    ],
  },
  {
    key: "achievements",
    label: "Achievements / awards",
    type: "object[]",
    description: "Awards, honours, and notable achievements.",
    fields: [
      { key: "title", label: "Title" },
      { key: "year", label: "Year" },
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
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "technologies", label: "Technologies / tools", type: "string[]" },
      { key: "link", label: "Link" },
    ],
  },
  {
    key: "internships",
    label: "Internships",
    type: "object[]",
    description: "Internship experiences.",
    fields: [
      { key: "role", label: "Role" },
      { key: "organization", label: "Organization" },
      { key: "duration", label: "Duration" },
      { key: "description", label: "Description" },
    ],
  },
  {
    key: "extracurriculars",
    label: "Extracurriculars",
    type: "object[]",
    description: "Clubs, sports, cultural and volunteer activities.",
    fields: [
      { key: "activity", label: "Activity" },
      { key: "role", label: "Role" },
    ],
  },
  {
    key: "publications",
    label: "Publications",
    type: "object[]",
    description: "Research papers / publications (research & medical students).",
    fields: [
      { key: "title", label: "Title" },
      { key: "venue", label: "Venue" },
      { key: "year", label: "Year" },
      { key: "link", label: "Link" },
    ],
  },
];

/* ── Professional-only ── */
const PROFESSIONAL_ONLY: SchemaField[] = [
  {
    key: "experience",
    label: "Work experience",
    type: "object[]",
    description: "Professional work history.",
    fields: [
      { key: "role", label: "Role" },
      { key: "company", label: "Company" },
      { key: "duration", label: "Duration" },
      { key: "location", label: "Location" },
      { key: "highlights", label: "Highlights", type: "string[]" },
    ],
  },
  {
    key: "total_years_experience",
    label: "Total years of experience",
    type: "string",
    description: "Total professional experience, e.g. '8 years'.",
  },
  {
    key: "projects",
    label: "Projects / portfolio",
    type: "object[]",
    description: "Notable portfolio or professional projects.",
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "technologies", label: "Technologies / tools", type: "string[]" },
      { key: "link", label: "Link" },
    ],
  },
  {
    key: "portfolio_links",
    label: "Portfolio links",
    type: "string[]",
    description: "Links to portfolio, website, or work samples.",
  },
  {
    key: "publications",
    label: "Publications",
    type: "object[]",
    description: "Research papers / publications (academics, researchers, doctors).",
    fields: [
      { key: "title", label: "Title" },
      { key: "venue", label: "Venue" },
      { key: "year", label: "Year" },
      { key: "link", label: "Link" },
    ],
  },
  {
    key: "registrations",
    label: "Professional registrations",
    type: "object[]",
    description:
      "Profession-specific registrations/memberships, e.g. Bar Council or Medical Council number.",
    fields: [
      { key: "type", label: "Type" },
      { key: "id", label: "ID / number" },
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
      return { type: "array", description: field.description, items: { type: "string" } };
    case "object[]": {
      const properties: JsonSchema = {};
      for (const sub of field.fields ?? []) {
        properties[sub.key] =
          sub.type === "string[]"
            ? { type: "array", items: { type: "string" } }
            : { type: "string" };
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
 * Every field is optional → absent data comes back null/empty ("if present").
 */
export function toJsonSchema(profileType: ProfileType): JsonSchema {
  const properties: JsonSchema = {};
  for (const field of EXTRACTION_SCHEMA[profileType]) {
    properties[field.key] = fieldToJsonSchema(field);
  }
  return { type: "object", properties };
}
