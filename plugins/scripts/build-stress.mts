/**
 * Renders every card against content designed to BREAK it.
 *
 * `build-preview.mts` shows the set at three realistic data levels — that is the
 * artefact for judging design. This one is the opposite: fixtures chosen to find
 * the places where text escapes its box, collides with something else, or runs
 * off the card. Real extraction produces all of it — long South Indian names, a
 * 60-character institution, an email with no break opportunity, a CV listing
 * twenty skills.
 *
 * Run: npm run stress            → public/stress.html
 *      npm run check:overflow    → measures that page in headless Chrome
 *
 * The two halves are deliberately separate: generating the page needs no browser,
 * so it stays runnable anywhere, and only the measuring step needs Chrome.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { profileToCard } from "@/lib/profile-to-card";
import { renderCard, templates } from "@/templates";
import { MINIMUMS } from "@/templates/guards";
import type { ProfileType } from "@/templates/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── the hostile strings ──────────────────────────────────────────────────── */

/** No break opportunity anywhere. The classic way a fixed column is blown open. */
const UNBREAKABLE = "Abcdefghijklmnopqrstuvwxyz0123456789Abcdefghij";

const LONG_NAME = "Venkataraghavan Subramanian Krishnamoorthy";
const LONG_ROLE = "Senior Vice President, Platform Engineering and Site Reliability";
const LONG_ORG = "Sri Krishna Institute of Engineering and Advanced Technology, Coimbatore";
const LONG_EMAIL = "venkataraghavan.subramanian@verylongcompanydomainname.co.in";
const LONG_URL = "https://www.venkataraghavanportfolio.example.dev/work/case-studies/2024/analytics-platform";
const TAMIL = "வெங்கடராகவன் சுப்ரமணியன்";

const MANY_SKILLS = [
  "Kubernetes Cluster Administration", "Go", "Terraform", "PostgreSQL", "Linux",
  "Distributed Systems", "Observability", "Prometheus", "Grafana", "CI/CD",
  UNBREAKABLE, "gRPC", "Kafka", "Redis", "Elasticsearch", "Site Reliability",
  "Incident Command", "Capacity Planning", "Cost Optimisation", "Mentoring",
];

const LONG_HIGHLIGHT =
  "Owned the migration of a forty-team Kubernetes platform across three regions, including the provisioning path, the observability stack and the on-call rotation that came with it.";

/* ── fixtures ─────────────────────────────────────────────────────────────── */

interface Fixture {
  label: string;
  type: ProfileType;
  profile: Record<string, unknown>;
  enhanced?: { bio: string } | null;
}

const FIXTURES: Fixture[] = [
  {
    label: "minimum — name only",
    type: "student",
    profile: { full_name: "Raj K" },
  },
  {
    label: "long everything",
    type: "student",
    profile: {
      full_name: LONG_NAME,
      designation: LONG_ROLE,
      email: LONG_EMAIL,
      phone: "+91 90000 11111 / +91 90000 22222",
      location: "Thiruvananthapuram, Kerala, India",
      skills: MANY_SKILLS,
      languages: ["Malayalam", "Tamil", "English", "Hindi", "Kannada", "Telugu", "Sanskrit"],
      social_links: [
        { platform: "LinkedIn", url: "linkedin.com/in/venkataraghavan-subramanian" },
        { platform: "GitHub", url: "github.com/venkataraghavan" },
        { platform: "Behance", url: "behance.net/venkat" },
        { platform: "Personal", url: LONG_URL },
        { platform: "Some Unlisted Service", url: "example.dev/venkat" },
      ],
      education: [
        { degree: "Bachelor of Technology", field: "Computer Science and Engineering", institution: LONG_ORG, year: "2019–2023", grade: "8.94/10 (First Class with Distinction)" },
        { degree: "Higher Secondary Certificate", field: "Computer Science", institution: "Kendriya Vidyalaya Pattom, Thiruvananthapuram", year: "2019", grade: "94.6%" },
      ],
      certifications: [
        { name: "Certified Kubernetes Administrator (CKA)", issuer: "Cloud Native Computing Foundation", year: "2023" },
        { name: "AWS Certified Solutions Architect — Professional", issuer: "Amazon Web Services", year: "2022" },
      ],
      projects: [
        { title: "Distributed Ledger and Reconciliation Engine", description: "A double-entry bookkeeping engine with deterministic replay, written to survive partial network failure.", technologies: ["Go", "SQLite", "gRPC", UNBREAKABLE], link: LONG_URL },
      ],
      internships: [
        { role: "Site Reliability Engineering Intern", organization: "Freshworks Technologies Private Limited", duration: "June–August 2023", description: null },
      ],
      // The four families that used to be dropped. They are in the stress set
      // because they were never rendered before, so no card has ever been laid out
      // with them present.
      achievements: [
        { title: "Winner, Smart India Hackathon (Software Edition), Ministry of Education", year: "2023" },
        { title: "Best Outgoing Student, Department of Computer Science and Engineering", year: "2023" },
      ],
      publications: [
        { title: "Deterministic replay for distributed ledgers under partial network partition", venue: "ACM SIGOPS Operating Systems Review", year: "2023", link: LONG_URL },
        { title: "A survey of observability practice in mid-size Indian SaaS companies", venue: "IEEE Software", year: "2022", link: null },
      ],
      extracurriculars: [
        { activity: "National Service Scheme, Thiruvananthapuram District Unit", role: "Volunteer Coordinator" },
        { activity: UNBREAKABLE, role: "Member" },
      ],
    },
    enhanced: {
      bio: "Final-year computer science student who has spent three years building infrastructure nobody notices, which is the point of infrastructure — reliability work, observability and the unglamorous parts of platform engineering.",
    },
  },
  {
    label: "unbreakable strings",
    type: "student",
    profile: {
      full_name: UNBREAKABLE,
      designation: UNBREAKABLE,
      email: `${UNBREAKABLE}@${UNBREAKABLE}.com`,
      location: UNBREAKABLE,
      skills: [UNBREAKABLE, UNBREAKABLE + "X"],
      languages: [UNBREAKABLE],
      education: [{ degree: UNBREAKABLE, field: UNBREAKABLE, institution: UNBREAKABLE, year: "2020–2024", grade: UNBREAKABLE }],
      projects: [{ title: UNBREAKABLE, description: UNBREAKABLE + " " + UNBREAKABLE, technologies: [UNBREAKABLE], link: null }],
      internships: [{ role: UNBREAKABLE, organization: UNBREAKABLE, duration: "2023", description: null }],
      certifications: [{ name: UNBREAKABLE, issuer: UNBREAKABLE, year: "2023" }],
      social_links: [{ platform: "LinkedIn", url: "linkedin.com/in/x" }],
    },
    enhanced: { bio: UNBREAKABLE + " " + UNBREAKABLE + " " + UNBREAKABLE },
  },
  {
    label: "non-Latin script",
    type: "student",
    profile: {
      full_name: TAMIL,
      designation: "கணினி அறிவியல் இளங்கலை",
      location: "திருவனந்தபுரம்",
      email: "venkat@example.com",
      skills: ["Python", "தமிழ் கணினி மொழியியல்", "SQL"],
      languages: ["தமிழ்", "English"],
      education: [{ degree: "B.Sc", field: "கணினி அறிவியல்", institution: "அண்ணா பல்கலைக்கழகம்", year: "2020–2024", grade: "8.2" }],
      projects: [{ title: "தமிழ் எழுத்துப்பிழை திருத்தி", description: "A spell-checker for Tamil.", technologies: ["Python"], link: null }],
    },
  },
  {
    label: "professional — long everything",
    type: "professional",
    profile: {
      full_name: LONG_NAME,
      designation: LONG_ROLE,
      current_company: "Freshworks Technologies Private Limited",
      email: LONG_EMAIL,
      phone: "+91 90000 11111",
      location: "Thiruvananthapuram, Kerala",
      total_years_experience: "18 years",
      skills: MANY_SKILLS,
      languages: ["Malayalam", "Tamil", "English", "Hindi", "Kannada"],
      social_links: [
        { platform: "LinkedIn", url: "linkedin.com/in/venkataraghavan" },
        { platform: "GitHub", url: "github.com/venkat" },
        { platform: "Medium", url: "medium.com/@venkat" },
        { platform: "Unlisted", url: "example.dev" },
      ],
      portfolio_links: [LONG_URL],
      education: [{ degree: "Bachelor of Technology", field: "Computer Science and Engineering", institution: LONG_ORG, year: "2001–2005", grade: "8.9" }],
      certifications: [
        { name: "Certified Kubernetes Administrator (CKA)", issuer: "Cloud Native Computing Foundation", year: "2023" },
        { name: "AWS Certified Solutions Architect — Professional", issuer: "Amazon Web Services", year: "2021" },
      ],
      experience: [
        { role: LONG_ROLE, company: "Freshworks Technologies Private Limited", duration: "March 2021 – present", location: "Thiruvananthapuram", highlights: [LONG_HIGHLIGHT, "Ran the Kubernetes platform for forty internal teams.", "Moved provisioning to Terraform."] },
        { role: "Director of Engineering, Platform", company: "Zoho Corporation Private Limited", duration: "2016–2021", location: "Chennai", highlights: [LONG_HIGHLIGHT, "Rebuilt the ingest path in Go."] },
        { role: "Senior Staff Engineer", company: "Hewlett Packard Enterprise India", duration: "2011–2016", location: "Bengaluru", highlights: ["Sharded the PostgreSQL fleet."] },
        { role: "Software Engineer", company: "Infosys", duration: "2005–2011", location: "Pune", highlights: ["Maintained a billing system."] },
      ],
      projects: [{ title: "Distributed Ledger and Reconciliation Engine", description: "Deterministic replay across partial network failure.", technologies: ["Go", "gRPC"], link: LONG_URL }],
      achievements: [
        { title: "Distinguished Engineer of the Year, NASSCOM Technology Leadership Forum", year: "2023" },
        { title: "Patent granted: deterministic reconciliation across partitioned ledgers", year: "2021" },
      ],
      publications: [
        { title: "Deterministic replay for distributed ledgers under partial network partition", venue: "ACM SIGOPS Operating Systems Review", year: "2023", link: LONG_URL },
        { title: "A survey of observability practice in mid-size Indian SaaS companies", venue: "IEEE Software", year: "2022", link: null },
      ],
      registrations: [
        { type: "Institution of Engineers (India) Chartered Engineer", id: "CE/AM/1234567" },
        { type: UNBREAKABLE, id: UNBREAKABLE },
      ],
    },
    enhanced: {
      bio: "Platform engineering leader with eighteen years spent on the unglamorous half of the stack — provisioning, observability, on-call — on the theory that the teams shipping product should never have to think about any of it.",
    },
  },
  {
    label: "professional — minimum",
    type: "professional",
    profile: { full_name: "Raj K", designation: "Analyst" },
  },
  {
    label: "professional — one long word bio",
    type: "professional",
    profile: {
      full_name: "Priya Menon",
      designation: "VP Engineering",
      current_company: "Zoho",
      email: "p@example.com",
      location: "Chennai",
      total_years_experience: "12 years",
      skills: ["Kubernetes", "Go", "Terraform"],
      experience: [
        { role: "VP Engineering", company: "Zoho", duration: "2022–present", location: "Chennai", highlights: [UNBREAKABLE, "Runs the Kubernetes platform."] },
        { role: "Engineering Manager", company: "Freshworks", duration: "2019–2022", location: "Chennai", highlights: ["Rebuilt the ingest path in Go."] },
      ],
    },
    enhanced: { bio: UNBREAKABLE + " " + UNBREAKABLE },
  },
];

/** Widths that matter: the three presets, plus a container narrower than any of them. */
const CASES: Array<{ label: string; width: number; responsive: boolean; hostWidth: number }> = [
  { label: "sm 320", width: 320, responsive: false, hostWidth: 340 },
  { label: "md 380", width: 380, responsive: false, hostWidth: 400 },
  { label: "lg 440", width: 440, responsive: false, hostWidth: 460 },
  // Responsive in a host narrower than the card's max — this is what fires the
  // container queries, and it is how AnurCloud will embed a card in a column.
  { label: "responsive 260", width: 440, responsive: true, hostWidth: 260 },
];

const cards = profileFixtures();

function profileFixtures(): string {
  let out = "";
  for (const fx of FIXTURES) {
    const card = profileToCard({
      profile: fx.profile,
      profile_type: fx.type,
      enhanced: fx.enhanced ?? null,
    });
    const pool = templates.filter((t) => t.audience === fx.type);

    out += `<h2 class="fx">${fx.label} <span>· ${fx.type}</span></h2>`;
    for (const c of CASES) {
      out += `<h3 class="case">${c.label}</h3><div class="row">`;
      for (const t of pool) {
        if (!MINIMUMS[t.key].test(card)) continue;
        const scope = `st-${t.key}-${slug(fx.label)}-${slug(c.label)}`;
        out += `<div class="cell" style="width:${c.hostWidth}px" data-card="${t.name}" data-fx="${
          fx.label
        }" data-case="${c.label}"><div class="cap">${t.id}. ${t.name}</div>${renderCard(t.id, card, {
          colors: { primary: "#be123c", accent: "#e11d48" },
          size: c.width,
          responsive: c.responsive,
          scopeId: scope,
        })}</div>`;
      }
      out += `</div>`;
    }
  }
  return out;
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Insta VIZ — card stress test</title>
<style>
  :root{color-scheme:light}
  body{margin:0;padding:1.5rem;font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#f1f5f9;color:#0f172a}
  h1{font-size:1.3rem;margin:0 0 .3rem}
  .lede{color:#475569;max-width:70ch;margin:0 0 1.5rem}
  h2.fx{font-size:1.05rem;margin:2rem 0 .2rem;padding-top:.8rem;border-top:2px solid #cbd5e1}
  h2.fx span{font-weight:400;color:#64748b}
  h3.case{font:700 .72rem/1 ui-monospace,monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:1.1rem 0 .5rem}
  .row{display:flex;flex-wrap:wrap;gap:1.2rem;align-items:flex-start}
  /* The host is a hard boundary on purpose: anything the card paints outside it
     is visible here as a card sticking out of its own column. */
  .cell{outline:1px dashed #f43f5e;outline-offset:3px}
  .cap{font:700 .68rem/1.4 ui-monospace,monospace;color:#64748b;margin-bottom:.35rem}
</style></head>
<body>
<h1>Card stress test</h1>
<p class="lede">Every card against content chosen to break it: names and institutions at full
length, an email with no break opportunity, twenty skills, a 45-character unbreakable string,
Tamil script, and the bare minimum each layout accepts. Four widths each, including a
<strong>responsive card in a 260px host</strong> — narrower than any preset, which is what fires
the container queries. The dashed outline is the host column: nothing should cross it.</p>
${cards}
</body></html>`;

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "stress.html"), page, "utf8");

const cellCount = (page.match(/class="cell"/g) ?? []).length;
console.log(`✓ stress page written to public/stress.html`);
console.log(`  ${FIXTURES.length} fixtures × ${CASES.length} widths → ${cellCount} rendered cards`);
console.log(`  measure it with: npm run check:overflow`);
