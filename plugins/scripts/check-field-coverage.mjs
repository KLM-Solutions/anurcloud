/**
 * Field-coverage diagnostic (owner decision 20 Aug 2026: every card shows every field).
 *
 * Builds one "everything" profile per audience, with a UNIQUE marker string in
 * each field, renders every card, and reports which fields' markers are missing
 * from each card's markup. A missing marker = that card drops that field.
 *
 * Report only — it does not gate. Use it to drive the per-card work, then the
 * completeness assertion in verify-foundation.mts locks it in.
 *
 * Run:  node --experimental-strip-types --no-warnings --import ./scripts/ts-resolver.mjs scripts/check-field-coverage.mjs
 */

import { profileToCard } from "@/lib/profile-to-card";
import { renderCard, templatesFor } from "@/templates";

/** Strip <style> blocks so a class name in CSS isn't mistaken for shown content. */
function markupOf(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "");
}

/* A distinctive token per field, and the raw profile that carries it. */
const COMMON = {
  full_name: "Zorptek Namemarker",
  designation: "Chief Wobble Officer",
  email: "coveragemarker@example.com",
  phone: "+91 99999 12345",
  location: "Uniqtownmarker",
  summary: "Distinctivebiomarker sentence that must appear in full on every card body.",
  skills: ["Skillalphamarker", "Skillbetamarker", "Skillgammamarker"],
  languages: ["Languno", "Langdos"],
  social_links: [
    { platform: "LinkedIn", url: "https://linkedin.com/in/coveragemarker" },
    { platform: "GitHub", url: "https://github.com/coveragemarker" },
  ],
  education: [
    { degree: "B.Tech", field: "CS", institution: "Institiamarker University", year: "2018–2022", grade: "9.0" },
  ],
  certifications: [{ name: "Certmarker Credential", issuer: "IssuerCo", year: "2023" }],
  achievements: [{ title: "Awardmarker Prize", year: "2022" }],
};

const STUDENT = {
  ...COMMON,
  projects: [{ title: "Projmarker App", description: "Projdescmarker does a unique thing.", technologies: ["Techmarker"], link: null }],
  internships: [{ role: "Internrolemarker", organization: "Internorgmarker", duration: "Summer 2021", description: "Interndescmarker work." }],
  extracurriculars: [{ activity: "Clubmarker Society", role: "Presidentmarker" }],
  publications: [{ title: "Papermarker Study", venue: "Venuemarker", year: "2022", link: null }],
};

const PROFESSIONAL = {
  ...COMMON,
  current_company: "Curcomarker Inc",
  total_years_experience: "13 years",
  experience: [
    { role: "Exprolemarker", company: "Expcompanymarker", duration: "2019–present", location: "Chennai", highlights: ["Highlightmarker achievement one.", "Highlightmarker achievement two."] },
  ],
  projects: [{ title: "Projmarker Platform", description: "Projdescmarker outcome.", technologies: ["Techmarker"], link: null }],
  portfolio_links: ["https://portfoliomarker.dev"],
  publications: [{ title: "Papermarker Study", venue: "Venuemarker", year: "2022", link: null }],
  registrations: [{ type: "Bar Council Number", id: "Regidmarker12345" }],
};

/* field key → marker(s) expected in the card body, per audience. */
const FIELD_MARKERS = {
  student: {
    fullName: ["Zorptek Namemarker"],
    designation: ["Chief Wobble Officer"],
    email: ["coveragemarker@example.com"],
    phone: ["99999 12345"],
    location: ["Uniqtownmarker"],
    bio: ["Distinctivebiomarker"],
    skills: ["Skillalphamarker", "Skillbetamarker", "Skillgammamarker"],
    languages: ["Languno", "Langdos"],
    social_links: ["coveragemarker"],
    education: ["Institiamarker"],
    certifications: ["Certmarker"],
    achievements: ["Awardmarker"],
    projects: ["Projmarker", "Projdescmarker"],
    internships: ["Internrolemarker", "Internorgmarker"],
    extracurriculars: ["Clubmarker"],
    publications: ["Papermarker"],
  },
  professional: {
    fullName: ["Zorptek Namemarker"],
    designation: ["Chief Wobble Officer"],
    email: ["coveragemarker@example.com"],
    phone: ["99999 12345"],
    location: ["Uniqtownmarker"],
    bio: ["Distinctivebiomarker"],
    skills: ["Skillalphamarker", "Skillbetamarker", "Skillgammamarker"],
    languages: ["Languno", "Langdos"],
    social_links: ["coveragemarker"],
    education: ["Institiamarker"],
    certifications: ["Certmarker"],
    achievements: ["Awardmarker"],
    currentCompany: ["Curcomarker"],
    totalYearsExperience: ["13 years"],
    experience: ["Exprolemarker", "Expcompanymarker"],
    highlights: ["Highlightmarker achievement one.", "Highlightmarker achievement two."],
    projects: ["Projmarker", "Projdescmarker"],
    portfolio_links: ["portfoliomarker.dev"],
    publications: ["Papermarker"],
    registrations: ["Regidmarker12345"],
  },
};

function run() {
  let totalMissing = 0;
  for (const audience of ["student", "professional"]) {
    const raw = audience === "student" ? STUDENT : PROFESSIONAL;
    const card = profileToCard({ profile: raw, profile_type: audience, enhanced: { bio: raw.summary } });
    const markers = FIELD_MARKERS[audience];
    const pool = templatesFor(audience);

    console.log(`\n══════ ${audience.toUpperCase()} — ${pool.length} cards ══════`);
    for (const t of pool) {
      const html = markupOf(renderCard(t.key, card));
      const missing = [];
      for (const [field, toks] of Object.entries(markers)) {
        // A field is "shown" if AT LEAST its first marker appears (representative).
        const shownAny = toks.some((tok) => html.includes(tok));
        if (!shownAny) missing.push(field);
        // Also count partial drops (some items of a multi-item field missing).
        else {
          const missingItems = toks.filter((tok) => !html.includes(tok));
          if (missingItems.length) missing.push(`${field}(partial:${missingItems.length}/${toks.length})`);
        }
      }
      totalMissing += missing.length;
      const tag = missing.length === 0 ? "✓ complete" : `✗ missing: ${missing.join(", ")}`;
      console.log(`  ${String(t.id).padStart(2)} ${t.key.padEnd(28)} ${tag}`);
    }
  }
  console.log(`\nTotal field gaps across all cards: ${totalMissing}`);
}

run();
