/**
 * AI enhancement client wrapper — Module 3 (server-only).
 *
 * Singleton OpenAI client. Single GPT-4.1 call produces:
 *   - polished first-person bio
 *   - enhanced project descriptions (both types)
 *   - enhanced internship descriptions (students)
 *   - enhanced experience highlights (professionals)
 */

import OpenAI from "openai";
import type {
  EnhanceRequest,
  EnhanceSuccess,
  EnhancedProject,
  EnhancedInternship,
  EnhancedExperience,
} from "@/lib/enhance-types";

const MODEL = "gpt-4.1";

let cached: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  cached ??= new OpenAI({ apiKey });
  return cached;
}

interface EnhanceResult {
  bio: string;
  projects: EnhancedProject[];
  internships: EnhancedInternship[];
  experience: EnhancedExperience[];
}

function buildSystemPrompt(profile_type: "student" | "professional"): string {
  if (profile_type === "student") {
    return `You are a professional profile content editor. Given a verified student profile, enhance the following.

STRICT RULE: Only use information explicitly present in the profile. Do not invent, guess, or add anything not stated.

1. bio — 2-3 sentences, first person "I", for a digital business card.
   Draw only from present fields: designation, education, internships, projects, skills, extracurriculars.

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

export async function enhanceProfile(req: EnhanceRequest): Promise<EnhanceSuccess> {
  const client = getClient();
  const { profile, profile_type } = req;

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(profile_type) },
      { role: "user", content: `Profile (${profile_type}):\n${JSON.stringify(profile, null, 2)}` },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  if (!text) throw new Error("Enhancement model returned an empty response.");

  let parsed: EnhanceResult;
  try {
    parsed = JSON.parse(text) as EnhanceResult;
  } catch {
    throw new Error("Enhancement model returned malformed JSON.");
  }

  if (typeof parsed.bio !== "string" || !parsed.bio.trim()) {
    throw new Error("Enhancement model returned an incomplete response.");
  }

  return {
    status: "success",
    bio: parsed.bio,
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    internships: Array.isArray(parsed.internships) ? parsed.internships : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
  };
}
