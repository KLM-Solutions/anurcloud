/**
 * AI enhancement client wrapper — Module 3 (server-only).
 *
 * Singleton OpenAI client. Single GPT-4.1 call produces:
 *   - polished first-person bio
 *   - enhanced project descriptions (both types)
 *   - enhanced internship descriptions (students)
 *   - enhanced experience highlights (professionals)
 */

import { runChatJSON, parseJSONLoose } from "@/lib/llm-chat";
import { validateEnhance } from "@/lib/enhance-validate";
import type { EnhanceRequest, EnhanceSuccess } from "@/lib/enhance-types";

function buildSystemPrompt(profile_type: "student" | "professional"): string {
  if (profile_type === "student") {
    return `You are a professional profile content editor. Given a verified student profile, enhance the following.

STRICT RULE: Only use information explicitly present in the profile. Do not invent, guess, or add anything not stated.

1. bio — 2-3 sentences, first person "I", for a digital business card.
   Draw only from present fields: designation, education, internships, projects, skills, extracurriculars.
   The bio is REQUIRED and must NEVER be empty. If the profile is minimal, still write a short bio from whatever is present (e.g. name and the education line).

2. projects — for each project that has a description, return an enhanced version of that description.
   - Keep it concise (1-2 sentences), impactful, first person where natural.
   - Return title unchanged (used for matching). If description is empty or missing, skip that project.

3. internships — for each internship that has a description, return an enhanced version.
   - Keep it concise (1-2 sentences), impactful, first person where natural.
   - Return role and organization unchanged (used for matching). If description is empty or missing, skip that internship.

Respond with only a JSON object:
{
  "bio": string,
  "projects": [{ "title": string, "description": string }],
  "internships": [{ "role": string, "organization": string, "description": string }]
}`;
  }

  return `You are a professional profile content editor. Given a verified professional profile, enhance the following.

STRICT RULE: Only use information explicitly present in the profile. Do not invent, guess, or add anything not stated.

1. bio — 2-3 sentences, first person "I", for a digital business card.
   Draw only from present fields: designation, current_company, total_years_experience, experience, skills, achievements, registrations.
   The bio is REQUIRED and must NEVER be empty. If the profile is minimal, still write a short bio from whatever is present (e.g. name and designation).

2. projects — for each project that has a description, return an enhanced version of that description.
   - Keep it concise (1-2 sentences), impactful, first person where natural.
   - Return title unchanged (used for matching). If description is empty or missing, skip that project.

3. experience — for each experience entry that has highlights, return enhanced versions of those highlights.
   - Each highlight should be punchy and impact-focused (start with a strong verb where possible).
   - Return role and company unchanged (used for matching). If highlights is empty, skip that entry.

Respond with only a JSON object:
{
  "bio": string,
  "projects": [{ "title": string, "description": string }],
  "experience": [{ "role": string, "company": string, "highlights": string[] }]
}`;
}

/**
 * A small local model (Qwen 3.5 4B) occasionally under-generates — on a thin
 * profile it returns an empty bio maybe 1 run in 4. Each generation is
 * independent, so we retry a few times before failing. Enhancement is a gate in
 * the card flow, so recovering a transient miss matters more than one round-trip.
 */
const ENHANCE_ATTEMPTS = 3;

export async function enhanceProfile(req: EnhanceRequest): Promise<EnhanceSuccess> {
  const { profile, profile_type } = req;
  const system = buildSystemPrompt(profile_type);
  const user = `Profile (${profile_type}):\n${JSON.stringify(profile, null, 2)}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= ENHANCE_ATTEMPTS; attempt++) {
    try {
      const text = await runChatJSON(system, user, "enhance");

      let parsed: unknown;
      try {
        parsed = parseJSONLoose<unknown>(text);
      } catch {
        throw new Error("Enhancement model returned malformed JSON.");
      }

      // Validate the shape and GROUND every entry against the request profile —
      // a small local model can rename match keys or invent entries, and this
      // drops anything not in the input. (See enhance-validate.ts.)
      return validateEnhance(parsed, req);
    } catch (err) {
      lastErr = err;
      console.warn(
        `[enhance] attempt ${attempt}/${ENHANCE_ATTEMPTS} failed: ${(err as Error).message}`,
      );
    }
  }

  // Last resort: the model kept coming back empty (Qwen 4B does this on thin
  // profiles). Build a short bio from present fields only — grounded, no
  // invention — so the enhancement gate never hard-fails the card flow.
  const bio = fallbackBio(req);
  if (bio) {
    console.warn("[enhance] all attempts failed; using grounded fallback bio.");
    return { status: "success", bio, projects: [], internships: [], experience: [] };
  }

  throw lastErr instanceof Error ? lastErr : new Error("Enhancement failed after retries.");
}

/** A minimal, grounded bio built only from fields the profile actually has. */
function fallbackBio(req: EnhanceRequest): string {
  const p = req.profile;
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const name = s(p.full_name);
  const lead = name ? `I am ${name}` : "I am";

  if (req.profile_type === "student") {
    const edu = Array.isArray(p.education) ? p.education[0] : undefined;
    const degree = [s(edu?.degree), s(edu?.field)].filter(Boolean).join(" ");
    const inst = s(edu?.institution);
    const clause = [degree && `a ${degree} student`, inst && `at ${inst}`].filter(Boolean).join(" ");
    if (clause) return `${lead}, ${clause}.`;
  } else {
    const designation = s(p.designation);
    const company = s(p.current_company);
    if (designation) return `${lead}, ${designation}${company ? ` at ${company}` : ""}.`;
    if (company) return `${lead}, working at ${company}.`;
  }

  const designation = s(p.designation);
  if (designation) return `${lead}, ${designation}.`;
  return name ? `${lead}.` : "";
}
