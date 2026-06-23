/** M3 — AI Content Enhancement types (request, response). */

export interface EnhanceRequest {
  profile: {
    full_name?: string | null;
    designation?: string | null;
    summary?: string | null;
    skills?: string[];
    location?: string | null;
    education?: Array<{ degree?: string; field?: string; institution?: string; year?: string }>;
    experience?: Array<{ role?: string; company?: string; duration?: string; highlights?: string[] }>;
    internships?: Array<{ role?: string; organization?: string; duration?: string; description?: string }>;
    projects?: Array<{ title?: string; description?: string; technologies?: string[] }>;
    certifications?: Array<{ name?: string; issuer?: string; year?: string }>;
    achievements?: Array<{ title?: string; year?: string }>;
    extracurriculars?: Array<{ activity?: string; role?: string }>;
    languages?: string[];
    current_company?: string | null;
    total_years_experience?: string | null;
    registrations?: Array<{ type?: string; id?: string }>;
    [key: string]: unknown;
  };
  profile_type: "student" | "professional";
}

export interface EnhancedProject {
  title: string;
  description: string;
}

export interface EnhancedInternship {
  role: string;
  organization: string;
  description: string;
}

export interface EnhancedExperience {
  role: string;
  company: string;
  highlights: string[];
}

export interface EnhanceSuccess {
  status: "success";
  bio: string;
  projects: EnhancedProject[];
  internships: EnhancedInternship[];
  experience: EnhancedExperience[];
}

export interface EnhanceError {
  status: "error";
  error: { code: string; message: string };
}

export type EnhanceResponse = EnhanceSuccess | EnhanceError;
