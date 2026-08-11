/**
 * Renders every card at every data level into one static page.
 *
 * This is the artefact the client's layout-variety question actually needs
 * answering with: five cards side by side, in grayscale as well as in colour,
 * so the question "are these genuinely different layouts?" can be judged on
 * structure rather than on paint.
 *
 * Run: npm run preview   → public/preview.html
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { profileToCard } from "@/lib/profile-to-card";
import { renderCard, templates } from "@/templates";
import { MINIMUMS, dataLevel } from "@/templates/guards";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const thin = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Arun Kumar",
    designation: "B.Sc Physics",
    education: [{ degree: "B.Sc", field: "Physics", institution: "Loyola College", year: "2023", grade: null }],
  },
});

const typical = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Karthik S",
    designation: "B.Com",
    email: "karthik@example.com",
    location: "Coimbatore",
    education: [{ degree: "B.Com", field: null, institution: "MCC", year: "2022–2025", grade: "8.1" }],
    skills: ["Excel", "Tally", "GST"],
    projects: [{ title: "Inventory tracker", description: "Stock levels for a family shop.", technologies: [], link: null }],
  },
});

const rich = profileToCard({
  profile_type: "student",
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
  enhanced: { bio: "Final-year IT student focused on backend systems and platform reliability." },
});

/* ── professional fixtures ───────────────────────────────────────────────────
 *
 * Their own people, not the students relabelled. Three of the professional
 * layouts are built on `experience[].highlights` and `total_years_experience`,
 * which the student schema does not have, so a relabelled student would render
 * half of this pool as an empty shell.
 */

const proThin = profileToCard({
  profile_type: "professional",
  profile: { full_name: "Ravi Shankar", designation: "Operations Manager", location: "Madurai" },
});

const proTypical = profileToCard({
  profile_type: "professional",
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
});

const proRich = profileToCard({
  profile_type: "professional",
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
    certifications: [
      { name: "CKA", issuer: "CNCF", year: "2021" },
      { name: "AWS Solutions Architect", issuer: "AWS", year: "2019" },
    ],
    experience: [
      {
        role: "VP Engineering",
        company: "Zoho",
        duration: "2022–present",
        location: "Chennai",
        highlights: [
          "Runs a Kubernetes platform serving 40 internal teams.",
          "Moved provisioning to Terraform, cutting setup from days to hours.",
        ],
      },
      {
        role: "Engineering Manager",
        company: "Freshworks",
        duration: "2019–2022",
        location: "Chennai",
        highlights: ["Rebuilt the ingest path in Go.", "Owned the Kubernetes migration."],
      },
      {
        role: "Senior Engineer",
        company: "Zoho",
        duration: "2016–2019",
        location: "Chennai",
        highlights: ["Sharded the PostgreSQL fleet."],
      },
    ],
  },
  enhanced: { bio: "Platform engineering leader with a bias for boring infrastructure." },
});

type Level = [string, ReturnType<typeof profileToCard>];

const STUDENT_LEVELS: Level[] = [
  ["Thin", thin],
  ["Typical", typical],
  ["Rich", rich],
];

const PRO_LEVELS: Level[] = [
  ["Thin", proThin],
  ["Typical", proTypical],
  ["Rich", proRich],
];

/** A card is only ever shown with a profile from its own pool. */
const levelsFor = (audience: string): Level[] =>
  audience === "student" ? STUDENT_LEVELS : PRO_LEVELS;

const BRAND = { colors: { primary: "#0f766e", accent: "#f59e0b" } };

function cell(label: string, html: string | null, note?: string): string {
  if (!html) {
    return `<div class="cell empty"><div class="cell-h">${label}</div><p class="note">Not offered — ${note}</p></div>`;
  }
  return `<div class="cell"><div class="cell-h">${label}</div>${html}</div>`;
}

function renderPool(audience: "student" | "professional"): string {
  return templates
    .filter((t) => t.audience === audience)
    .map((t) => {
      const cells = levelsFor(t.audience)
        .map(([levelName, profile]) => {
          if (!MINIMUMS[t.key].test(profile)) {
            return cell(levelName, null, MINIMUMS[t.key].reason(profile));
          }
          return cell(
            levelName,
            renderCard(t.id, profile, { ...BRAND, scopeId: `${t.key}-${levelName}` }),
          );
        })
        .join("");
      return `<section class="tpl">
      <h2>${t.id}. ${t.name}</h2>
      <p class="desc">${t.description}</p>
      <p class="min"><strong>Minimum:</strong> ${t.minimum}</p>
      <div class="row">${cells}</div>
    </section>`;
    })
    .join("");
}

const sections = `
<h2 class="pool">Student · ${templates.filter((t) => t.audience === "student").length} layouts</h2>
${renderPool("student")}
<h2 class="pool">Professional · ${templates.filter((t) => t.audience === "professional").length} layouts</h2>
<p class="pool-note">Different people, not the students relabelled — three of these are built on
fields the student schema does not have (years of experience, role highlights).</p>
${renderPool("professional")}`;

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Insta VIZ — the card set</title>
<style>
  :root{color-scheme:light}
  body{margin:0;padding:2.5rem 2rem 4rem;font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;color:#0f172a}
  header.top{max-width:1200px;margin:0 auto 2.5rem}
  h1{font-size:1.6rem;margin:0 0 .4rem}
  .lede{color:#475569;max-width:62ch;margin:0 0 1rem}
  .toggle{display:inline-flex;gap:.5rem;align-items:center;font-size:.85rem;color:#334155;background:#fff;padding:.5rem .8rem;border-radius:8px;border:1px solid #e2e8f0}
  .tpl{max-width:1200px;margin:0 auto 3rem;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1.5rem}
  h2{font-size:1.1rem;margin:0 0 .3rem}
  .desc{color:#475569;font-size:.88rem;margin:0 0 .3rem;max-width:70ch}
  .min{color:#64748b;font-size:.8rem;margin:0 0 1.2rem}
  .row{display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap}
  .cell-h{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;color:#94a3b8;margin-bottom:.5rem}
  .cell.empty{min-width:240px;max-width:260px}
  .note{font-size:.8rem;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:.6rem .7rem;margin:0}
  body.gray .row{filter:grayscale(1)}
  h2.pool{max-width:1200px;margin:0 auto 1rem;font-size:1.25rem;padding-top:1rem;border-top:2px solid #cbd5e1}
  .pool-note{max-width:1200px;margin:-.5rem auto 1.5rem;color:#64748b;font-size:.85rem}
</style></head>
<body>
<header class="top">
  <h1>Insta VIZ — the card set (${templates.length} of 20)</h1>
  <p class="lede">Each card at three data levels. <strong>Thin</strong> is a name and a title — the common case from a weak CV or a URL. Where a card is not offered, the reason is shown instead.</p>
  <label class="toggle"><input type="checkbox" id="g"/> Grayscale — judge the layouts, not the colour</label>
</header>
${sections}
<script>
  document.getElementById("g").addEventListener("change", (e) => {
    document.body.classList.toggle("gray", e.target.checked);
  });
</script>
</body></html>`;

mkdirSync(join(ROOT, "public"), { recursive: true });
const out = join(ROOT, "public", "preview.html");
writeFileSync(out, page, "utf8");

console.log(`✓ preview written to public/preview.html`);
console.log(`  ${templates.length} templates × 3 data levels`);

for (const audience of ["student", "professional"] as const) {
  const pool = templates.filter((t) => t.audience === audience);
  console.log(`\n  ${audience} (${pool.length})`);
  for (const [name, p] of levelsFor(audience)) {
    const offered = pool.filter((t) => MINIMUMS[t.key].test(p)).map((t) => t.name);
    console.log(
      `    ${name.padEnd(8)} (${dataLevel(p)}): ${offered.length}/${pool.length} offered — ${
        offered.join(", ") || "none"
      }`,
    );
  }
}
