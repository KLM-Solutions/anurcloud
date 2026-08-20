/**
 * Golden set — the fixed profiles the quality eval runs against.
 *
 * These are the SAME six people used by `build-preview.mts` (student &
 * professional, each at thin / typical / rich), lifted here as the raw
 * extraction-shaped `profile` objects the two LLM jobs actually consume:
 *   - enhancement  → EnhanceRequest  ({ profile, profile_type })
 *   - card-picking → runs on the CardProfile derived from the SAME profile,
 *     with the enhanced bio threaded in (mirrors production order).
 *
 * Why a fixed set and not the sample PDFs: extraction is a third-party service
 * and non-deterministic, so re-extracting each run would make the eval measure
 * the extractor, not the model. The golden inputs are frozen JSON so the ONLY
 * thing that changes between runs is the model + prompt — which is what we want
 * to measure. Add real, hand-verified profiles here over time to widen coverage.
 */

import type { ProfileType } from "@/templates";

export interface GoldenCase {
  /** Stable id used in result files and the compare report. */
  id: string;
  profile_type: ProfileType;
  /**
   * Raw, extraction-shaped profile — the enhancement input. Typed loosely on
   * purpose: real extraction output carries nulls and extra keys the strict
   * request types don't model, and both `enhanceProfile` (index signature) and
   * `profileToCard` (Record<string, unknown>) accept exactly this shape.
   */
  profile: Record<string, unknown>;
  /** One line on what this case is meant to stress. */
  notes: string;
}

export const GOLDEN: GoldenCase[] = [
  {
    id: "student-thin",
    profile_type: "student",
    notes: "Name + one education line only. The common thin case; bio must still be written.",
    profile: {
      full_name: "Arun Kumar",
      designation: "B.Sc Physics",
      education: [
        { degree: "B.Sc", field: "Physics", institution: "Loyola College", year: "2023", grade: null },
      ],
    },
  },
  {
    id: "student-typical",
    profile_type: "student",
    notes: "A handful of fields — one project with a description to enhance.",
    profile: {
      full_name: "Karthik S",
      designation: "B.Com",
      email: "karthik@example.com",
      location: "Coimbatore",
      education: [
        { degree: "B.Com", field: null, institution: "MCC", year: "2022–2025", grade: "8.1" },
      ],
      skills: ["Excel", "Tally", "GST"],
      projects: [
        { title: "Inventory tracker", description: "Stock levels for a family shop.", technologies: [], link: null },
      ],
    },
  },
  {
    id: "student-rich",
    profile_type: "student",
    notes: "Most fields filled — multiple projects/internships to enhance and ground.",
    profile: {
      full_name: "Meera Nair",
      designation: "B.Tech Information Technology",
      email: "meera@example.com",
      phone: "+91 90000 00000",
      location: "Kochi",
      summary: "Backend-leaning student who likes infrastructure.",
      skills: ["Go", "Kubernetes", "SQL", "Terraform", "Linux"],
      languages: ["Malayalam", "English", "Hindi"],
      social_links: [
        { platform: "GitHub", url: "github.com/meera" },
        { platform: "LinkedIn", url: "linkedin.com/in/meera" },
      ],
      education: [
        { degree: "B.Tech", field: "Information Technology", institution: "CUSAT", year: "2020–2024", grade: "9.1/10" },
        { degree: "Class XII", field: null, institution: "Kendriya Vidyalaya", year: "2020", grade: "94%" },
      ],
      certifications: [{ name: "CKA", issuer: "CNCF", year: "2024" }],
      projects: [
        { title: "Ledger", description: "Double-entry bookkeeping in Go.", technologies: ["Go", "SQLite"], link: "github.com/meera/ledger" },
        { title: "Kube-lite", description: "A teaching scheduler.", technologies: ["Go"], link: null },
      ],
      internships: [
        { role: "SRE Intern", organization: "Freshworks", duration: "Jun–Aug 2023", description: null },
        { role: "Backend Intern", organization: "Zoho", duration: "Summer 2022", description: null },
      ],
    },
  },
  {
    id: "professional-thin",
    profile_type: "professional",
    notes: "Name + designation + location. Bio must come from almost nothing.",
    profile: { full_name: "Ravi Shankar", designation: "Operations Manager", location: "Madurai" },
  },
  {
    id: "professional-typical",
    profile_type: "professional",
    notes: "Two roles with highlights — the enhance path for experience[].highlights.",
    profile: {
      full_name: "Anita Desai",
      designation: "Product Manager",
      current_company: "Freshworks",
      email: "anita@example.com",
      location: "Chennai",
      total_years_experience: "7 years",
      skills: ["Roadmapping", "SQL", "Analytics", "Figma"],
      experience: [
        {
          role: "Product Manager",
          company: "Freshworks",
          duration: "2021–present",
          location: "Chennai",
          highlights: ["Owned the analytics roadmap for two quarters.", "Ran SQL analysis for pricing."],
        },
        {
          role: "Associate PM",
          company: "Zoho",
          duration: "2018–2021",
          location: "Chennai",
          highlights: ["Shipped an analytics dashboard."],
        },
      ],
    },
  },
  {
    id: "professional-rich",
    profile_type: "professional",
    notes: "Senior CV — many fields, the case where a dense layout should win.",
    profile: {
      full_name: "Priya Menon",
      designation: "VP Engineering",
      current_company: "Zoho",
      email: "priya@example.com",
      phone: "+91 90000 11111",
      location: "Chennai",
      total_years_experience: "12 years",
      skills: ["Kubernetes", "Go", "Terraform", "PostgreSQL", "Linux"],
      languages: ["Tamil", "English"],
      social_links: [{ platform: "LinkedIn", url: "linkedin.com/in/priyamenon" }],
      portfolio_links: ["priyamenon.dev"],
      education: [
        { degree: "B.E", field: "Computer Science", institution: "Anna University", year: "2010–2014", grade: "8.6" },
      ],
      certifications: [{ name: "CKA", issuer: "CNCF", year: "2021" }],
      experience: [
        {
          role: "VP Engineering",
          company: "Zoho",
          duration: "2019–present",
          location: "Chennai",
          highlights: [
            "Grew the platform team from 6 to 40 engineers.",
            "Cut infrastructure spend by a third with capacity planning.",
          ],
        },
        {
          role: "Engineering Manager",
          company: "Freshworks",
          duration: "2014–2019",
          location: "Chennai",
          highlights: ["Led the migration to Kubernetes across twelve services."],
        },
      ],
      projects: [
        { title: "Internal PaaS", description: "Self-service deploy platform for 40 teams.", technologies: ["Go", "Kubernetes"], link: null },
      ],
    },
  },
];
