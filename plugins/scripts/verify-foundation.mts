/**
 * Exercises the template layer against realistic, messy input.
 *
 * Covers the foundation — cleaning, date derivation, empty-content guards, data
 * levels, per-template minimums, the brand → theme join, theme-option safety —
 * and then every built card at every data level its minimum accepts, in both
 * audience pools.
 *
 * Deliberately checked against the junk that real extraction produces rather
 * than tidy fixtures — tidy fixtures would pass whatever we wrote.
 *
 * Run: npm run verify
 */

import { profileToCard, cleanText, cleanUrl, cleanEmail, cleanPhone, deriveSortYear } from "@/lib/profile-to-card";
import { brandToTheme, isUsableBrandColor } from "@/lib/brand-to-theme";
import {
  countDatedEntries,
  countFillableTiles,
  countFilledSections,
  countStats,
  contentVolume,
  dataLevel,
  measuredSkills,
  MINIMUMS,
  section,
  joinBlocks,
  skillMentions,
} from "@/templates/guards";
import { resolveTheme } from "@/templates/theme";
import { schemaFieldKeys } from "@/lib/schema";
import { contactRows, chips, educationList, socialIcons, timelineRows } from "@/templates/sections";
import {
  eligibleTemplates,
  offerableTemplates,
  plannedTemplates,
  renderCard,
  suggestTemplates,
  SUGGESTION_COUNT,
  templates,
  templatesFor,
} from "@/templates";
import type { BrandTheme } from "@/lib/types";

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean, detail?: string) {
  checks += 1;
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? `\n      ${detail}` : ""}`);
  }
}

function eq<T>(label: string, actual: T, expected: T) {
  ok(label, Object.is(actual, expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function group(name: string) {
  console.log(`\n${name}`);
}

/* ── 1. cleaning ──────────────────────────────────────────────────────────── */

group("Cleaning — junk that real extraction returns");

for (const junk of ["N/A", "  n/a  ", "null", "NONE", "-", "—", "...", "TBD", "unknown", "xxx", ""]) {
  ok(`drops ${JSON.stringify(junk)}`, cleanText(junk) === null);
}
ok("drops a lone truncated character", cleanText("B") === null);
ok("keeps a one-char grade when allowed", cleanText("A", { minLength: 1 }) === "A");
ok("drops punctuation-only values", cleanText("::--::") === null);
ok("collapses PDF non-breaking spaces", cleanText("Priya  Raman") === "Priya Raman");
ok("strips wrapping punctuation before the junk test", cleanText("-N/A-") === null);
ok("keeps real text", cleanText("  B.Tech Computer Science ") === "B.Tech Computer Science");

eq("rejects a malformed URL", cleanUrl("not a url"), null);
eq("rejects javascript:", cleanUrl("javascript:alert(1)"), null);
eq("expands a bare domain", cleanUrl("github.com/priya"), "https://github.com/priya");
eq("keeps an https URL", cleanUrl("https://x.dev/a"), "https://x.dev/a");

eq("rejects a non-email", cleanEmail("email address"), null);
eq("rejects a half-email", cleanEmail("priya@"), null);
eq("keeps a real email", cleanEmail(" priya@example.com "), "priya@example.com");

eq("rejects a phone with too few digits", cleanPhone("12"), null);
eq("keeps a real phone", cleanPhone("+91 98765 43210"), "+91 98765 43210");

/* ── 2. dates ─────────────────────────────────────────────────────────────── */

group("Date derivation — the free-text formats in lib/schema.ts");

eq('"2021–2025" sorts on the end year', deriveSortYear("2021–2025"), 2025);
eq('"Summer 2024"', deriveSortYear("Summer 2024"), 2024);
eq('"Jun–Aug 2023"', deriveSortYear("Jun–Aug 2023"), 2023);
eq('"3 months" is unrecoverable', deriveSortYear("3 months"), null);
eq('"2024–present" sorts newest', deriveSortYear("2024–present"), 9999);
eq('"Current" sorts newest', deriveSortYear("Current"), 9999);
eq("ignores an out-of-range number", deriveSortYear("3000 hours"), null);
eq("handles null", deriveSortYear(null), null);

/* ── 3. a realistic messy profile ─────────────────────────────────────────── */

group("Cleaning a whole profile");

const messy = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "  Priya Raman ",
    designation: "N/A",
    email: "not-an-email",
    phone: "12",
    location: "Chennai, India",
    summary: "-",
    skills: ["Python", "python", "N/A", "", "React", "x"],
    languages: ["Tamil", "English", "null"],
    social_links: [
      { platform: "LinkedIn", url: "linkedin.com/in/priya" },
      { platform: "Broken", url: "javascript:alert(1)" },
      { platform: "Dupe", url: "linkedin.com/in/priya" },
    ],
    education: [
      { degree: "B.Tech", field: "Computer Science", institution: "Anna University", year: "2021–2025", grade: "8.4/10" },
      { degree: "N/A", field: null, institution: null, year: null, grade: null },
    ],
    certifications: [{ name: "TBD", issuer: null, year: null }],
    projects: [
      { title: "Campus Navigator", description: "Indoor wayfinding app.", technologies: ["Flutter", "N/A"], link: "not a url" },
      { title: null, description: null, technologies: [], link: null },
    ],
    internships: [
      { role: "Data Intern", organization: "Zoho", duration: "Summer 2024", description: null },
      { role: null, organization: null, duration: null, description: null },
    ],
  },
  enhanced: { bio: "Final-year computer science student building mobile tools for campus life." },
});

eq("name cleaned", messy.fullName, "Priya Raman");
eq("junk designation dropped", messy.designation, null);
eq("bad email dropped", messy.email, null);
eq("short phone dropped", messy.phone, null);
eq("enhanced bio wins over a junk summary", messy.bio, "Final-year computer science student building mobile tools for campus life.");
eq("skills deduped and cleaned", messy.skills.join(","), "Python,React");
eq("languages cleaned", messy.languages.join(","), "Tamil,English");
eq("one social link survives", messy.socialLinks.length, 1);
eq("empty education row dropped", messy.education.length, 1);
eq("junk certification dropped", messy.certifications.length, 0);
eq("empty project dropped", messy.projects.length, 1);
eq("bad project link dropped", messy.projects[0]!.link, null);
eq("junk technology dropped", messy.projects[0]!.technologies.join(","), "Flutter");
eq("empty internship dropped", messy.internships.length, 1);

group("Timeline built and sorted");

eq("three entries on the spine", messy.timeline.length, 3);
eq("newest first", messy.timeline[0]!.title, "B.Tech, Computer Science");
eq("original text preserved for display", messy.timeline[0]!.dateText, "2021–2025");
eq("undated project pushed to the end", messy.timeline[2]!.kind, "project");
eq("dated entries counted", countDatedEntries(messy), 2);

/* ── 4. guards ────────────────────────────────────────────────────────────── */

group("Guards — empty content renders nothing");

eq("empty section disappears, heading included", section("Skills", () => ""), "");
ok("populated section keeps its heading", section("Skills", () => "<p>x</p>").includes("Skills"));
eq("joinBlocks drops empties", joinBlocks(["", "  ", "<p>a</p>"]), "<p>a</p>");
eq("joinBlocks avoids a trailing separator", joinBlocks(["<p>a</p>", ""], "<hr/>"), "<p>a</p>");

const empty = profileToCard({ profile_type: "student", profile: {} });
eq("no contact rows on an empty profile", contactRows(empty), "");
eq("no chips on an empty list", chips([]), "");
eq("no education list when empty", educationList(empty), "");
eq("no timeline rows when empty", timelineRows(empty.timeline), "");

group("Escaping");

const nasty = profileToCard({
  profile_type: "student",
  profile: { full_name: "Priya <script>alert(1)</script>", location: '"><img src=x onerror=alert(1)>' },
});
const nastyRow = contactRows(nasty);
// Check the injected VALUE, not the whole string — legitimate markup contains
// `"><` all over the place (class="iv-crow"><span), so a naive scan false-fails.
const injected = nastyRow.slice(nastyRow.indexOf('class="iv-cval">') + 16, nastyRow.indexOf("</span></div>"));
ok("no raw angle bracket survives in the value", !injected.includes("<") && !injected.includes(">"), injected);
ok("no raw quote survives in the value", !injected.includes('"'), injected);
ok("value is entity-encoded", injected.includes("&quot;&gt;&lt;img"), injected);

/* ── 5. data levels and minimums ──────────────────────────────────────────── */

group("Data levels");

const thin = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Arun Kumar",
    designation: "B.Sc Physics",
    education: [{ degree: "B.Sc", field: "Physics", institution: "Loyola College", year: "2023", grade: null }],
  },
});

const rich = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Meera Nair",
    designation: "B.Tech IT",
    email: "meera@example.com",
    phone: "+91 90000 00000",
    location: "Kochi",
    summary: "Building things.",
    skills: ["Go", "Kubernetes", "SQL"],
    languages: ["Malayalam", "English"],
    social_links: [{ platform: "GitHub", url: "github.com/meera" }],
    education: [
      { degree: "B.Tech", field: "IT", institution: "CUSAT", year: "2020–2024", grade: "9.1" },
      { degree: "Class XII", field: null, institution: "Kendriya Vidyalaya", year: "2020", grade: "94%" },
    ],
    certifications: [{ name: "CKA", issuer: "CNCF", year: "2024" }],
    projects: [{ title: "Ledger", description: "Double-entry bookkeeping.", technologies: ["Go"], link: "github.com/meera/ledger" }],
    internships: [{ role: "SRE Intern", organization: "Freshworks", duration: "Jun–Aug 2023", description: null }],
  },
});

// Name, course, education, skills, one project — the common case from a CV.
const typical = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Karthik S",
    designation: "B.Com",
    education: [{ degree: "B.Com", field: null, institution: "MCC", year: "2022–2025", grade: null }],
    skills: ["Excel", "Tally"],
    projects: [{ title: "Inventory tracker", description: null, technologies: [], link: null }],
  },
});

/* ── professional fixtures ───────────────────────────────────────────────────
 *
 * Separate profiles, not the student ones relabelled. The professional pool is
 * built on `experience[].highlights` and `total_years_experience`, which the
 * student schema does not have, so reusing a student fixture here would pass a
 * suite while proving nothing about the cards it is meant to cover.
 */

const proThin = profileToCard({
  profile_type: "professional",
  profile: {
    full_name: "Ravi Shankar",
    designation: "Operations Manager",
  },
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
    summary: "Platform engineering leader.",
    total_years_experience: "12 years",
    skills: ["Kubernetes", "Go", "Terraform", "PostgreSQL", "Linux"],
    languages: ["Tamil", "English"],
    social_links: [{ platform: "LinkedIn", url: "linkedin.com/in/priyamenon" }],
    portfolio_links: ["priyamenon.dev"],
    education: [{ degree: "B.E", field: "Computer Science", institution: "Anna University", year: "2010–2014", grade: "8.6" }],
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

eq("thin profile detected", dataLevel(thin), "thin");
eq("typical profile detected", dataLevel(typical), "typical");
eq("rich profile detected", dataLevel(rich), "rich");
// The messy fixture cleans down to 8 filled sections, so it is genuinely rich —
// junk removal doesn't make a profile sparse, it just makes it honest.
eq("messy profile is rich once cleaned", dataLevel(messy), "rich");

group("Minimums against a typical profile");

eq("Side Rail accepts typical data", MINIMUMS["side-rail"].test(typical), true);
eq("Hero Split accepts typical data", MINIMUMS["hero-split"].test(typical), true);
eq("Timeline rejects typical data with too few dated entries", MINIMUMS.timeline.test(typical), false);

group("Per-template minimums");

eq("Side Rail accepts thin data", MINIMUMS["side-rail"].test(thin), true);
eq("Centre Portrait accepts thin data", MINIMUMS["centre-portrait"].test(thin), true);
eq("Hero Split rejects thin data", MINIMUMS["hero-split"].test(thin), false);
eq("Tile Grid rejects thin data", MINIMUMS["tile-grid"].test(thin), false);
eq("Timeline rejects thin data", MINIMUMS.timeline.test(thin), false);

eq("Hero Split accepts rich data", MINIMUMS["hero-split"].test(rich), true);
eq("Tile Grid accepts rich data", MINIMUMS["tile-grid"].test(rich), true);
eq("Timeline accepts rich data", MINIMUMS.timeline.test(rich), true);

ok(
  "a rejection explains itself",
  MINIMUMS.timeline.reason(thin).includes("3 dated entries"),
  MINIMUMS.timeline.reason(thin),
);
eq("thin profile fills few sections", countFilledSections(thin) < 3, true);
eq("thin profile cannot fill a grid", countFillableTiles(thin) < 4, true);

group("Professional minimums");

eq("Letterhead accepts a bare professional", MINIMUMS.letterhead.test(proThin), true);
eq("Folder Tab accepts a bare professional", MINIMUMS["folder-tab"].test(proThin), true);
eq("Role Ladder rejects a profile with no roles", MINIMUMS["role-ladder"].test(proThin), false);
eq("Stat Strip rejects a profile with one figure", MINIMUMS["stat-strip"].test(proThin), false);
eq("Split Halves rejects a profile that fills one half", MINIMUMS["split-halves"].test(proThin), false);
eq("Edge Spine rejects a profile with nothing beside the spine", MINIMUMS["edge-spine"].test(proThin), false);
eq("Pull Quote rejects a profile with no summary", MINIMUMS["pull-quote"].test(proThin), false);

eq("Role Ladder accepts two roles", MINIMUMS["role-ladder"].test(proTypical), true);
eq("Stat Strip accepts a typical professional", MINIMUMS["stat-strip"].test(proTypical), true);
eq("Numbered accepts a rich professional", MINIMUMS.numbered.test(proRich), true);
eq("Split Halves accepts a rich professional", MINIMUMS["split-halves"].test(proRich), true);
eq("Edge Spine accepts a rich professional", MINIMUMS["edge-spine"].test(proRich), true);

/*
 * The student pool must stay unreachable for the three professional layouts
 * built on fields the student schema does not have. This is the check that
 * would catch someone "helpfully" relaxing a minimum later.
 */
eq("Stat Strip is unreachable for a student", MINIMUMS["stat-strip"].test(rich), false);
eq("Role Ladder is unreachable for a student", MINIMUMS["role-ladder"].test(rich), false);
eq("Skill Meters is unreachable for a student", MINIMUMS["skill-meters"].test(rich), false);

// Years, roles, skills — and nothing for the certifications and degrees it
// does not list. The strip renders three cells here, not five.
eq("stats are counted, not invented", countStats(proTypical), 3);

// Audience is the first filter; the minimums above are the second. Both hold
// independently, so neither one is the single point of failure.
ok(
  "a student is never offered a professional layout",
  eligibleTemplates(rich).every((e) => templatesFor("student").some((t) => t.key === e.key)),
);
ok(
  "a professional is never offered a student layout",
  eligibleTemplates(proRich).every((e) => templatesFor("professional").some((t) => t.key === e.key)),
);

group("Skill Meters measure evidence, not proficiency");

/*
 * Nothing in the extraction schema records proficiency. The bars count mentions
 * in the person's own highlights, and these assertions are what stop that
 * quietly turning into a made-up rating later.
 */
eq("a skill named in two bullets counts twice", skillMentions("Kubernetes", proRich), 2);
eq("a skill named once counts once", skillMentions("Terraform", proRich), 1);
eq("a skill nobody wrote about scores zero", skillMentions("Linux", proRich), 0);
// Substring matching would score this against "PostgreSQL"; boundary matching does not.
eq("a substring of another skill is not a mention", skillMentions("SQL", proRich), 0);
// One letter cannot be told from prose, so it is never charted.
eq("a single-character skill is never charted", skillMentions("R", proRich), 0);

const measured = measuredSkills(proRich, 5);
ok("only skills with evidence are charted", measured.every((m) => m.count > 0));
eq("the strongest skill leads", measured[0]?.skill, "Kubernetes");
ok("unmeasured skills are left out of the chart", !measured.some((m) => m.skill === "Linux"));

{
  const meters = renderCard("skill-meters", proRich);
  ok(
    "the chart ships with the caption that says what it measures",
    meters.includes("not a proficiency rating"),
  );
  ok("no bar claims a percentage of a scale nobody declared", !meters.includes("%</"));
  // The unmeasured skill is still shown — listed, not charted.
  ok("unmeasured skills are still listed", meters.includes("Linux"));
}

/* ── 6. brand → theme ─────────────────────────────────────────────────────── */

group("Brand colour join (Mithra's 3 Aug ask)");

const brand = (over: Partial<BrandTheme>): BrandTheme => ({
  primary: "#2563eb",
  accent: "#7c3aed",
  palette: ["#2563eb", "#7c3aed"],
  logo_url: "https://cdn.example.com/logo.png",
  fonts: null,
  source: "logo-image",
  confidence: "high",
  notes: null,
  ...over,
});

const applied = brandToTheme(brand({}));
eq("brand palette applied", applied.applied, true);
eq("primary carried through", (applied.theme.colors as { primary: string }).primary, "#2563eb");
eq("logo carried through", applied.theme.logo?.url, "https://cdn.example.com/logo.png");

const noBrand = brandToTheme(null);
eq("no brand falls back", noBrand.applied, false);
ok("fallback explains itself", (noBrand.reason ?? "").length > 0, noBrand.reason ?? "");

const pale = brandToTheme(brand({ primary: "#fdfdfc", palette: ["#fdfdfc"] }));
eq("near-white primary rejected", pale.applied, false);
ok("rejection names the problem", (pale.reason ?? "").includes("unusable"), pale.reason ?? "");

const paleWithBackup = brandToTheme(brand({ primary: "#fefefe", palette: ["#fefefe", "#0f766e"] }));
eq("falls through to a usable palette entry", paleWithBackup.applied, true);
eq("uses the runner-up", (paleWithBackup.theme.colors as { primary: string }).primary, "#0f766e");

const overridden = brandToTheme(brand({}), { overrides: { colors: { primary: "#111827" } } });
eq("caller override beats the derived palette", (overridden.theme.colors as { primary: string }).primary, "#111827");

eq("white is not a usable brand colour", isUsableBrandColor("#ffffff"), false);
eq("garbage is not a usable brand colour", isUsableBrandColor("not-a-colour"), false);
eq("a real brand colour is usable", isUsableBrandColor("#be123c"), true);

group("Contrast");

const onPale = resolveTheme({ colors: { primary: "#fde68a" } }, "student");
eq("dark text chosen on a pale band", onPale.colors.onPrimary, "#0f172a");
const onDark = resolveTheme({ colors: { primary: "#1e3a8a" } }, "student");
eq("light text chosen on a dark band", onDark.colors.onPrimary, "#ffffff");

group("Theme option parity");

const full = resolveTheme(
  {
    colors: { primary: "#0f766e", accent: "#f59e0b" },
    font: { heading: "Fraunces", body: "Inter" },
    fontScale: 1.2,
    size: 440,
    responsive: true,
    radius: 8,
    logo: { url: "https://x.dev/l.png", position: "top-right", height: 30 },
  },
  "student",
);
eq("width honoured", full.widthPx, 440);
eq("responsive honoured", full.responsive, true);
eq("radius honoured", full.radius, 8);
eq("heading font honoured", full.fontHeading, "Fraunces");
eq("body font honoured", full.fontBody, "Inter");
ok("scale applied to root font size", full.rootStyle.includes("font-size:19.20px"), full.rootStyle);
ok("custom properties emitted", full.rootStyle.includes("--iv-primary:#0f766e"));

/* ── 7. registry honesty ──────────────────────────────────────────────────── */

group("Registry");

/*
 * Assert the registry's INVARIANTS, not the current count.
 *
 * These were `=== 5` and broke the moment the second student batch landed, which
 * is noise: a passing suite should mean "the registry is coherent", not "there
 * are exactly five cards today". The hard number is the committed set: 20 for v1,
 * plus the two professional avatar cards added 18 Aug 2026 (Badge, Spotlight).
 */
ok("every planned template is built", templates.length === plannedTemplates.length);
ok("at least one card exists", templates.length > 0);
ok("the committed set is 22 cards or fewer", plannedTemplates.length <= 22);
eq("the set is complete at 22", templates.length, 22);
eq("ten cards for students", templatesFor("student").length, 10);
eq("twelve cards for professionals", templatesFor("professional").length, 12);
ok(
  "the two pools do not overlap",
  templatesFor("student").length + templatesFor("professional").length === templates.length,
);
ok(
  "no card is offered to both audiences",
  new Set([...templatesFor("student"), ...templatesFor("professional")].map((t) => t.key)).size ===
    templates.length,
);
ok(
  "template ids are unique and contiguous from 1",
  plannedTemplates.every((t, i) => t.id === i + 1),
);
ok(
  "template keys are unique",
  new Set(plannedTemplates.map((t) => t.key)).size === plannedTemplates.length,
);
ok(
  "every planned template declares a minimum",
  plannedTemplates.every((t) => typeof t.minimum === "string" && t.minimum.length > 0),
);
ok(
  "an unknown template fails loudly",
  (() => {
    try {
      renderCard(99, rich);
      return false;
    } catch (e) {
      return String(e).includes("Unknown template");
    }
  })(),
);

/* ── 8. rendering ─────────────────────────────────────────────────────────── */

group("Every card renders at every data level it accepts");

const LEVELS: Array<[string, typeof rich]> = [
  ["thin", thin],
  ["typical", typical],
  ["rich", rich],
];

const PRO_LEVELS: Array<[string, typeof rich]> = [
  ["thin", proThin],
  ["typical", proTypical],
  ["rich", proRich],
];

/** A card is only ever exercised with a profile from its own pool. */
const levelsFor = (audience: string) => (audience === "student" ? LEVELS : PRO_LEVELS);

for (const info of templates) {
  for (const [levelName, profile] of levelsFor(info.audience)) {
    if (!MINIMUMS[info.key].test(profile)) continue;
    let html = "";
    let threw: string | null = null;
    try {
      html = renderCard(info.id, profile);
    } catch (e) {
      threw = String(e);
    }
    ok(`${info.name} @ ${levelName} renders`, threw === null, threw ?? "");
    ok(`${info.name} @ ${levelName} produces markup`, html.length > 400);
    ok(
      `${info.name} @ ${levelName} carries the theme`,
      html.includes("--iv-primary:"),
    );
    // A heading with nothing after it is the sparse-data failure we designed out.
    ok(
      `${info.name} @ ${levelName} has no empty section heading`,
      !/<h3 class="iv-sec-h">[^<]*<\/h3>\s*(?:<\/section>|<\/div>|$)/.test(html),
    );
    ok(
      `${info.name} @ ${levelName} never names an absent section`,
      levelName !== "thin" || !html.includes(">Projects<"),
    );
  }
}

group("Layout rules that only matter on sparse data");

/**
 * Strip <style> blocks before asserting on structure. Class names appear in
 * both the CSS and the markup, so a naive `includes` matches the stylesheet
 * and reports a layout rule as working when it never fired.
 */
const markupOf = (html: string) => html.replace(/<style>[\s\S]*?<\/style>/g, "");

const railThin = markupOf(renderCard("side-rail", thin));
ok("Side Rail collapses its rail when there is no contact", railThin.includes("iv-sr-rail-bare"));
const railRich = markupOf(renderCard("side-rail", rich));
ok("Side Rail keeps a full rail when there is contact", !railRich.includes("iv-sr-rail-bare"));

// Education on the left, nothing at all for the right column — the exact
// shape that would otherwise render one full column beside an empty one.
const lopsided = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Divya R",
    designation: "BA English",
    summary: "Reader and writer.",
    education: [{ degree: "BA", field: "English", institution: "Stella Maris", year: "2022–2025", grade: null }],
    internships: [{ role: "Editorial Intern", organization: "The Hindu", duration: "2024", description: null }],
  },
});
const heroLopsided = markupOf(renderCard("hero-split", lopsided));
const heroRich = markupOf(renderCard("hero-split", rich));
ok("Hero Split collapses rather than render a lopsided split", heroLopsided.includes("iv-hs-body-single"));
ok("Hero Split splits when both columns have content", !heroRich.includes("iv-hs-body-single"));

const cpFull = renderCard("centre-portrait", thin);
const cp = markupOf(cpFull);
ok("Centre Portrait never stacks two rules", !/(iv-cp-rule[^>]*><\/div>\s*){2}/.test(cp));
ok("Centre Portrait never ends on a rule", !/iv-cp-rule[^>]*><\/div>\s*(<\/div>)*$/.test(cp.trim()));
// The root always DECLARES --iv-grad; what matters is that this card never
// paints with it. Check the card's own stylesheet, which is the last block.
const cpOwnCss = [...cpFull.matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Centre Portrait paints no gradient band", !cpOwnCss.includes("var(--iv-grad)"), cpOwnCss.slice(0, 120));
ok("Centre Portrait neutralises the filled initials disc", cpOwnCss.includes("background:transparent"));

const gridRich = markupOf(renderCard("tile-grid", rich));
const wideCount = (gridRich.match(/iv-tg-wide/g) ?? []).length;
const tileCount = (gridRich.match(/class="iv-tg-tile/g) ?? []).length;
ok(
  `Tile Grid closes the row (${tileCount} tiles, ${wideCount} wide)`,
  tileCount % 2 === 0 ? wideCount === 0 : wideCount === 1,
  `${tileCount} tiles with ${wideCount} spanning`,
);
ok("Tile Grid has at least 4 tiles on rich data", tileCount >= 4);

const tl = renderCard("timeline", rich);
ok("Timeline renders spine rows", tl.includes("iv-tl-dot"));
ok("Timeline shows the original date text", tl.includes("2020–2024"), "expected the raw range, not a parsed year");
ok("Timeline never shows the internal sort value", !tl.includes("9999"));

group("Professional layouts — the structure each card is named for");

/*
 * Structure, not styling. Every assertion here is on markup the layout cannot
 * work without, so a card that quietly degrades into a plain stack fails rather
 * than passing because it still rendered something.
 */

const stat = markupOf(renderCard("stat-strip", proRich));
const statCellCount = (stat.match(/class="iv-ss-cell"/g) ?? []).length;
ok(`Stat Strip divides the strip into cells (${statCellCount})`, statCellCount >= 2 && statCellCount <= 3);
ok("Stat Strip leads with a figure, not the name", stat.indexOf("iv-ss-strip") < stat.indexOf("iv-name"));
ok("Stat Strip shows the stated years", stat.includes(">12<"));
const statTypical = markupOf(renderCard("stat-strip", proTypical));
ok(
  "Stat Strip drops cells it has no figure for",
  (statTypical.match(/class="iv-ss-cell"/g) ?? []).length >= 2,
);

const ladder = markupOf(renderCard("role-ladder", proRich));
eq("Role Ladder renders one rung per role", (ladder.match(/class="iv-rl-rung\b/g) ?? []).length, 3);
ok("Role Ladder has no spine dots — that is the Timeline card", !ladder.includes("iv-tl-dot"));
// The staircase depth is a class (iv-rl-d0..3), never a profile-derived inline
// style — that is the pattern that becomes an injection when a validator moves.
ok("Role Ladder writes no inline style on a rung", !/iv-rl-rung[^"]*"[^>]*style=/.test(ladder));

const lhOwnCss = [...renderCard("letterhead", proRich).matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Letterhead paints no fill at all", !lhOwnCss.includes("var(--iv-grad)"), lhOwnCss.slice(0, 120));
const lhThin = markupOf(renderCard("letterhead", proThin));
ok("Letterhead still renders on a name and a title alone", lhThin.includes("iv-lh-name"));
ok("Letterhead omits the contact column when there is no contact", !lhThin.includes("iv-lh-contact"));

const spine = markupOf(renderCard("edge-spine", proRich));
ok("Edge Spine puts the name in the spine", /iv-es-spine[\s\S]*Priya Menon/.test(spine));
/*
 * The name appears ONCE, in the spine. Echoing it in the body would make the
 * strip decorative, and the whole layout is the claim that it is not.
 */
eq("Edge Spine does not repeat the name in the body", (spine.match(/Priya Menon/g) ?? []).length, 1);
ok("Edge Spine keeps the spine last so it sits on the right edge", spine.indexOf("iv-es-body") < spine.indexOf("iv-es-spine"));
const spineCss = [...renderCard("edge-spine", proRich).matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Edge Spine rotates the name", spineCss.includes("writing-mode:vertical-rl"));
// A vertical name needs card height to live in, and a sparse card is short.
ok("Edge Spine guarantees height for a vertical name", /iv-es-wrap\{[^}]*min-height:/.test(spineCss));
// Sized to content up to a cap, so a long name wraps to a second vertical line
// instead of being clipped.
ok("Edge Spine caps the strip rather than fixing its width", /iv-es-spine\{[^}]*max-width:/.test(spineCss));

const pq = markupOf(renderCard("pull-quote", proRich));
ok("Pull Quote leads with the quote, not the name", pq.indexOf("iv-pq-q") < pq.indexOf("iv-pq-name"));
ok("Pull Quote sets the person's own words", pq.includes("boring infrastructure"));
const pqCss = [...renderCard("pull-quote", proRich).matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Pull Quote paints no fill", !pqCss.includes("var(--iv-grad)"), pqCss.slice(0, 120));
/*
 * The point of the card is that the name is smaller than the quote. If someone
 * "fixes" the name to look more prominent, this layout becomes Letterhead.
 */
const quoteSize = Number(pqCss.match(/iv-pq-q\{[^}]*font-size:([\d.]+)em/)?.[1] ?? 0);
const nameSize = Number(pqCss.match(/iv-pq-name\{[^}]*font-size:([\d.]+)em/)?.[1] ?? 99);
ok(
  `Pull Quote keeps the name smaller than the quote (${nameSize}em vs ${quoteSize}em)`,
  quoteSize > 0 && nameSize < quoteSize,
);
// It is the one layout that depends on Module 3 having run.
{
  const noBio = profileToCard({
    profile_type: "professional",
    profile: {
      full_name: "Anita Desai",
      designation: "Product Manager",
      skills: ["Roadmapping", "SQL", "Analytics"],
      experience: [
        { role: "Product Manager", company: "Freshworks", duration: "2021–present", location: "Chennai", highlights: ["Owned the analytics roadmap."] },
        { role: "Associate PM", company: "Zoho", duration: "2018–2021", location: "Chennai", highlights: ["Shipped a dashboard."] },
      ],
    },
  });
  eq("Pull Quote is not offered without a summary", MINIMUMS["pull-quote"].test(noBio), false);
  ok(
    "and the reason points at enhancement",
    MINIMUMS["pull-quote"].reason(noBio).includes("enhancement"),
    MINIMUMS["pull-quote"].reason(noBio),
  );
  eq("Pull Quote is offered once there is a bio", MINIMUMS["pull-quote"].test(proRich), true);
}

// Split Halves is a dynamic card: a persistent 50/50 split — white CONTENT on the
// left, a coloured MENU on the right (the "colour on the right" signature). The
// menu is the navigation; the left content swaps. Both halves present, no avatar.
const halves = markupOf(renderCard("split-halves", proRich));
ok("Split Halves keeps the 50/50 split (content + menu)", halves.includes("iv-hl-content") && halves.includes("iv-hl-menu"));
ok("Split Halves navigation lives in the coloured menu", /iv-hl-menu[\s\S]*iv-hl-item/.test(halves));
ok("Split Halves uses no avatar", !halves.includes("iv-av"));

const ov = markupOf(renderCard("overlap", proRich));
ok("Overlap renders the raised plate", ov.includes("iv-ov-plate"));
ok("Overlap keeps the name off the filled zone", ov.indexOf("iv-ov-zone") < ov.indexOf("iv-name"));
const ovCss = [...renderCard("overlap", proRich).matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Overlap lifts the plate over the zone edge", /iv-ov-plate\{[^}]*margin:-/.test(ovCss));

// A section that paginates re-shows its number on the continuation page (e.g.
// "02 Experience (cont.)"), so collapse consecutive repeats before checking the
// sequence is contiguous — the number repeating on a continued section is
// correct, not a gap.
const dedupe = (ns: number[]) => ns.filter((n, i) => i === 0 || n !== ns[i - 1]);
const nb = markupOf(renderCard("numbered", proRich));
const numerals = dedupe([...nb.matchAll(/class="iv-nb-n">(\d{2})</g)].map((m) => Number(m[1])));
ok(`Numbered numbers what actually rendered (${numerals.join(", ")})`, numerals.length >= 4);
ok(
  "Numbered leaves no gap in the sequence",
  numerals.every((n, i) => n === i),
  numerals.join(", "),
);
// A profile with no certifications must not produce 01, 03, 04.
const nbTypical = markupOf(renderCard("numbered", proTypical));
const numeralsTypical = dedupe([...nbTypical.matchAll(/class="iv-nb-n">(\d{2})</g)].map((m) => Number(m[1])));
ok(
  "Numbered stays contiguous on a sparser profile",
  numeralsTypical.every((n, i) => n === i),
  numeralsTypical.join(", "),
);

const tab = markupOf(renderCard("folder-tab", proThin));
ok("Folder Tab renders from a name alone", tab.includes("iv-ft-tab") && tab.includes("Ravi Shankar"));
ok("Folder Tab omits the body when there is nothing to put in it", !tab.includes("iv-ft-body"));
const tabCss = [...renderCard("folder-tab", proRich).matchAll(/<style>([\s\S]*?)<\/style>/g)].at(-1)?.[1] ?? "";
ok("Folder Tab sizes the tab to its content", tabCss.includes("display:inline-block"));
ok("Folder Tab continues the tab base as a rule", tabCss.includes(".iv-ft-head{border-bottom:"));

group("Suggestion — three, ranked, explained");

/*
 * The recommender's job is to be SHORTER than eligibility, not to re-list it.
 * These assertions are mostly about what it must never do: pad to three, cross
 * audience pools, invent a percentage, or return a different order on the second
 * call than the first.
 */

const suggStudentRich = suggestTemplates(rich);
const suggStudentThin = suggestTemplates(thin);
const suggProRich = suggestTemplates(proRich);
const suggProThin = suggestTemplates(proThin);

eq("three suggestions from a rich student", suggStudentRich.length, 3);
eq("three suggestions from a rich professional", suggProRich.length, 3);
eq("the fixed count is three", SUGGESTION_COUNT, 3);

// Ten cards are eligible for a rich profile. Suggesting all ten is the thing
// this file exists to stop.
ok(
  "suggestion is shorter than eligibility",
  suggStudentRich.length < offerableTemplates(rich).length,
  `${suggStudentRich.length} of ${offerableTemplates(rich).length}`,
);

// A thin professional has only two eligible layouts. Padding to three would mean
// suggesting a card that cannot be filled.
eq("never padded past what is eligible", suggProThin.length, offerableTemplates(proThin).length);
ok("and that is fewer than three here", suggProThin.length < 3, String(suggProThin.length));

ok(
  "ranks are contiguous from 1",
  suggStudentRich.every((s, i) => s.rank === i + 1),
);
ok(
  "ordered by score, best first",
  suggProRich.every((s, i) => i === 0 || s.score <= suggProRich[i - 1]!.score),
);
ok(
  "every suggestion is eligible",
  [...suggStudentRich, ...suggProRich].every((s) =>
    eligibleTemplates(s.id <= 10 ? rich : proRich).some((e) => e.key === s.key && e.eligible),
  ),
);
ok(
  "a student is never suggested a professional layout",
  suggStudentRich.every((s) => templatesFor("student").some((t) => t.key === s.key)),
);
ok(
  "a professional is never suggested a student layout",
  suggProRich.every((s) => templatesFor("professional").some((t) => t.key === s.key)),
);

// Server and client render the same page; a non-deterministic ranking would make
// them disagree and the tests pass by luck.
eq(
  "the same profile ranks identically on a second call",
  JSON.stringify(suggestTemplates(proRich)),
  JSON.stringify(suggProRich),
);

/*
 * ⚠️ No fit percentages. The page used to print invented scores ("TMP-101 · 94%")
 * and it was removed as a lie with a decimal point in it. These two assertions
 * are what stop it coming back.
 */
ok(
  "no suggestion carries a percentage",
  [...suggStudentRich, ...suggProRich, ...suggProThin].every(
    (s) => !JSON.stringify(s).includes("%"),
  ),
);
ok(
  "the tier is one of three coarse bands",
  [...suggStudentRich, ...suggProRich].every((s) =>
    ["strong", "good", "possible"].includes(s.tier),
  ),
);

// Every reason must be a sentence a person can check against their own CV.
ok(
  "every suggestion explains itself",
  [...suggStudentRich, ...suggProRich, ...suggProThin].every(
    (s) => s.reasons.length > 0 && s.reasons.every((r) => r.length > 12),
  ),
);

/*
 * The single biggest signal: a whitespace-driven layout looks composed on a thin
 * profile and empty on a rich one, which is the client's own 3 Aug complaint in
 * a different form. So the recommendation must actually change with data volume.
 */
ok(
  "a thin profile is steered to the layouts built for it",
  suggStudentThin.some((s) => s.key === "centre-portrait" || s.key === "monogram-block"),
  suggStudentThin.map((s) => s.key).join(", "),
);
ok(
  "a rich profile is not offered the sparse layouts first",
  !suggStudentRich.some((s) => s.key === "centre-portrait" || s.key === "monogram-block"),
  suggStudentRich.map((s) => s.key).join(", "),
);
ok(
  "a thin professional gets the two layouts that hold nothing",
  suggProThin.every((s) => s.key === "folder-tab" || s.key === "letterhead"),
  suggProThin.map((s) => s.key).join(", "),
);
// Pull Quote depends on a bio, so it can only ever be suggested after enhancement.
ok(
  "Pull Quote is never suggested without a summary",
  !suggProThin.some((s) => s.key === "pull-quote"),
);

group("Every extractable field reaches a card");

/*
 * The gap this closes, found 11 Aug 2026: `achievements`, `publications`,
 * `extracurriculars` and `registrations` were extracted by Module 1 from the
 * start, typed in lib/types.ts, and never mapped into `CardProfile` — so a CV
 * listing awards or papers lost all of them silently, and the profile read as
 * thinner than it was.
 *
 * `lib/schema.ts` is the source of truth for what can arrive, so the test is
 * mechanical: every key it declares must have a decision recorded here. Adding a
 * field to the schema now fails this suite until someone says where it goes,
 * which is the only way a mapping stays honest as the schema grows.
 */
const SCHEMA_TO_CARD: Record<string, keyof typeof rich | null> = {
  full_name: "fullName",
  designation: "designation",
  email: "email",
  phone: "phone",
  location: "location",
  summary: "bio", // the enhanced bio wins over it; same slot either way
  skills: "skills",
  languages: "languages",
  social_links: "socialLinks",
  education: "education",
  certifications: "certifications",
  achievements: "achievements",
  projects: "projects",
  internships: "internships",
  extracurriculars: "extracurriculars",
  publications: "publications",
  current_company: "currentCompany",
  experience: "experience",
  total_years_experience: "totalYearsExperience",
  portfolio_links: "websites",
  registrations: "registrations",
};

for (const type of ["student", "professional"] as const) {
  for (const key of schemaFieldKeys(type)) {
    const known = Object.prototype.hasOwnProperty.call(SCHEMA_TO_CARD, key);
    ok(
      `${type}: "${key}" has a recorded destination`,
      known,
      known ? "" : `add "${key}" to SCHEMA_TO_CARD, or to CardProfile if it should render`,
    );
    const target = known ? SCHEMA_TO_CARD[key] : null;
    if (target) {
      ok(`${type}: "${key}" → CardProfile.${String(target)} exists`, target in rich);
    }
  }
}

/*
 * Mapping is necessary but not sufficient — a field can be carried on the profile
 * and rendered by no card, which is the same outcome for the user. So render a
 * heavy profile and look for the actual values.
 */
{
  const decorated = profileToCard({
    profile_type: "professional",
    profile: {
      full_name: "Dr Anand Krishnan",
      designation: "Chief Medical Officer",
      current_company: "Apollo",
      email: "anand@example.com",
      location: "Chennai",
      total_years_experience: "22 years",
      skills: ["Cardiology", "Clinical Research", "Health Informatics"],
      achievements: [{ title: "Dr B.C. Roy National Award", year: "2019" }],
      publications: [{ title: "Statin adherence after myocardial infarction", venue: "JAPI", year: "2020", link: null }],
      registrations: [{ type: "Tamil Nadu Medical Council", id: "TNMC-58211" }],
      portfolio_links: ["anand.example.dev", "cardiology.example.org"],
      education: [{ degree: "MBBS", field: "Medicine", institution: "Madras Medical College", year: "1998–2003", grade: "First Class" }],
      experience: [
        { role: "Chief Medical Officer", company: "Apollo", duration: "2018–present", location: "Chennai", highlights: ["Runs clinical governance across 14 units."] },
        { role: "Senior Consultant", company: "Fortis", duration: "2012–2018", location: "Chennai", highlights: ["Ran the cath lab."] },
      ],
    },
    enhanced: { bio: "Interventional cardiologist and clinical leader." },
  });

  eq("achievements survive cleaning", decorated.achievements.length, 1);
  eq("publications survive cleaning", decorated.publications.length, 1);
  eq("registrations survive cleaning", decorated.registrations.length, 1);
  eq("every portfolio link is kept, not just the first", decorated.websites.length, 2);

  // Dated families belong on a spine organised by time.
  ok(
    "publications and achievements join the timeline",
    decorated.timeline.some((e) => e.kind === "publication") &&
      decorated.timeline.some((e) => e.kind === "achievement"),
    decorated.timeline.map((e) => e.kind).join(", "),
  );

  const VALUES: Array<[string, RegExp]> = [
    ["an award", /Roy National Award/],
    ["a publication", /Statin adherence/],
    ["a registration number", /TNMC-58211/],
  ];
  for (const [label, re] of VALUES) {
    const showing = templatesFor("professional")
      .filter((t) => MINIMUMS[t.key].test(decorated))
      .filter((t) => re.test(markupOf(renderCard(t.id, decorated))));
    ok(
      `${label} is rendered by most professional cards (${showing.length})`,
      showing.length >= 7,
      showing.map((t) => t.name).join(", "),
    );
  }
}

group("Heavy profiles are not truncated to a stub");

/*
 * The complaint that started this, 11 Aug 2026: an eighteen-year career rendered
 * as two jobs and one degree, because every card carried its own hardcoded caps.
 * The ceilings now live in templates/limits.ts. These assertions are about the
 * ceiling being generous, not about a specific number.
 */
{
  const senior = profileToCard({
    profile_type: "professional",
    profile: {
      full_name: "Venkat S",
      designation: "SVP Engineering",
      current_company: "Freshworks",
      email: "v@example.com",
      location: "Chennai",
      total_years_experience: "18 years",
      skills: Array.from({ length: 16 }, (_, i) => `Skill ${i + 1}`),
      education: [
        { degree: "B.E", field: "CSE", institution: "Anna University", year: "2001–2005", grade: "8.9" },
        { degree: "M.S", field: "CS", institution: "IIT Madras", year: "2006–2008", grade: "9.1" },
        { degree: "Executive MBA", field: "Strategy", institution: "IIM Bangalore", year: "2015", grade: null },
      ],
      experience: Array.from({ length: 5 }, (_, i) => ({
        role: `Role Number ${i + 1}`,
        company: `Company ${i + 1}`,
        duration: `${2020 - i * 3}–${2023 - i * 3}`,
        location: "Chennai",
        highlights: [`Highlight A for role ${i + 1}`, `Highlight B for role ${i + 1}`, `Highlight C for role ${i + 1}`],
      })),
    },
    enhanced: {
      bio: "Platform engineering leader with eighteen years spent on provisioning, observability and on-call, on the theory that product teams should never have to think about any of them at all.",
    },
  });

  const nb = markupOf(renderCard("numbered", senior));
  const rolesShown = (nb.match(/Role Number \d/g) ?? []).length;
  ok(`a full-width card shows more than two roles (${rolesShown} of 5)`, rolesShown >= 5, String(rolesShown));
  const eduShown = (nb.match(/Anna University|IIT Madras|IIM Bangalore/g) ?? []).length;
  ok(`and more than one education line (${eduShown} of 3)`, eduShown >= 3, String(eduShown));
  ok("and the whole bio, not a fragment", nb.includes("think about any of them at all"));
  const skillsShown = (nb.match(/Skill \d+/g) ?? []).length;
  ok(`and every skill it was given (${skillsShown} of 16)`, skillsShown >= 16, String(skillsShown));

  // No content is dropped: every role is present in the card. Split Halves is now
  // a dynamic card, so the roles live on its Experience screen rather than a
  // half-width column, but the guarantee is the same — all of them are there.
  const halves = markupOf(renderCard("split-halves", senior));
  const halfRoles = (halves.match(/Role Number \d/g) ?? []).length;
  ok(
    `Split Halves shows every role (${halfRoles} of 5)`,
    halfRoles >= 5,
    String(halfRoles),
  );

  // Volume is what a pagination pass would key off, so it has to be meaningful.
  ok(
    `content volume reflects the real load (~${contentVolume(senior)} lines)`,
    contentVolume(senior) > 40,
    String(contentVolume(senior)),
  );
  ok("a sparse profile scores far lower", contentVolume(thin) < 10, String(contentVolume(thin)));
}

group("Social marks fit inside their circles");

/*
 * Found by a user, 11 Aug 2026: the generic "www" label was 25.6px of text inside
 * a 16.9px circle and painted 8.7px of itself outside the disc. It was the only
 * three-character label in the set, and also the fallback for every platform the
 * mapper did not recognise — so it was both the most likely mark to appear in real
 * data and the only broken one.
 *
 * The circle is a fixed 1.7em with the label centred and no room to spare, so the
 * invariant worth testing is the label length. Measuring rendered text width needs
 * a browser; a character count catches the same mistake here for free.
 */
{
  const platforms = [
    "LinkedIn", "X", "Twitter", "GitHub", "Instagram", "Facebook", "YouTube",
    "Behance", "Dribbble", "Medium", "Stack Overflow", "Telegram", "WhatsApp",
    "Personal site", "Portfolio", "Some Service Nobody Has Heard Of", null,
  ];
  const html = socialIcons(
    platforms.map((platform) => ({ platform, url: "example.com/x" })),
    platforms.length,
  );
  // A mark is either an SVG glyph or a text label. Count the anchors for coverage;
  // measure only the TEXT ones for the label-length invariant (an SVG cannot
  // overflow the circle the way a wide text label can).
  const marks = [...html.matchAll(/aria-label="[^"]*">(.*?)<\/a>/g)].map((m) => m[1]!);
  const textLabels = marks.filter((m) => !m.includes("<svg"));

  eq("every platform renders a mark", marks.length, platforms.length);
  ok(
    "every text label is at most two characters",
    // Code points, not UTF-16 units — the fallback is a single arrow glyph.
    textLabels.every((l) => [...l].length <= 2),
    textLabels.map((l) => `"${l}"`).join(" "),
  );

  // The five brands asked for (21 Aug 2026) render a real SVG glyph, not letters.
  for (const platform of ["GitHub", "WhatsApp", "X", "Facebook", "Instagram"]) {
    ok(
      `${platform} renders an SVG icon`,
      socialIcons([{ platform, url: "example.com/x" }]).includes('<svg class="iv-si-svg"'),
    );
  }

  // A design platform with no stored icon still renders its own text mark.
  ok("Behance gets its own mark", socialIcons([{ platform: "Behance", url: "behance.net/x" }]).includes(">Be<"));
  ok("Dribbble gets its own mark", socialIcons([{ platform: "Dribbble", url: "dribbble.com/x" }]).includes(">dr<"));
  ok(
    "an unknown platform falls back to the generic globe icon",
    (() => {
      const html = socialIcons([{ platform: "Nobody Knows", url: "example.dev" }]);
      // The generic mark is now a real SVG globe (not a text arrow), so nothing
      // reads as missing next to the branded icons.
      const mark = html.match(/aria-label="[^"]*">([\s\S]*?)<\/a>/)?.[1] ?? "";
      return mark.includes('<svg class="iv-si-svg"');
    })(),
  );

  // The backstop: the font family is a caller-supplied theme option, so even two
  // characters are not a width we fully control.
  ok(
    "the circle clips, so no label can escape it",
    /\.iv-si\{[^}]*overflow:hidden/.test(renderCard("side-rail", rich)),
  );
}

group("Every card survives being printed");

/*
 * A card is a thing people save and send, so a PDF is a real output. Both of
 * these were found by printing the set, not by reasoning about it: cards were
 * being sliced across the page boundary, and a print dialog with "Background
 * graphics" off drops every fill — which on Split Halves means white text on
 * white paper. The rules live in the SHARED stylesheet, so assert them once per
 * card rather than trusting that they are still there.
 */
for (const info of templates) {
  const profile =
    info.audience === "student"
      ? MINIMUMS[info.key].test(rich)
        ? rich
        : thin
      : MINIMUMS[info.key].test(proRich)
        ? proRich
        : proThin;
  const css = renderCard(info.id, profile);
  ok(`${info.name} refuses to be split across pages`, css.includes("break-inside:avoid"));
  ok(`${info.name} keeps its colour when backgrounds are off`, css.includes("print-color-adjust:exact"));
  // Safari reads only the prefixed spelling of both.
  ok(`${info.name} covers the prefixed spelling too`, css.includes("-webkit-print-color-adjust:exact"));
}

group("The professional pool fails the client's 3 Aug checklist by design");

/*
 * Mithra Murugesan, 3 Aug 2026, on our first prototypes: "the overall layout,
 * vertical stack, banner on top, circular initials avatar, white body below,
 * stays the same". The circle is refused across the pool so no future card can
 * quietly reintroduce it — EXCEPT the two opt-in avatar cards (Badge, Spotlight,
 * added 18 Aug 2026), whose whole reason to exist is to give a professional's
 * logo a home in that circle. Every other professional card still fails here.
 */
const PRO_AVATAR_CARDS = new Set<string>(["badge", "spotlight"]);
for (const info of templatesFor("professional")) {
  if (PRO_AVATAR_CARDS.has(info.key)) continue;
  const html = markupOf(renderCard(info.id, MINIMUMS[info.key].test(proRich) ? proRich : proThin));
  ok(`${info.name} uses no circular initials avatar`, !html.includes("iv-av"));
}

group("The two professional avatar cards give a logo a home (DEV-3069/3070)");

/*
 * The opt-in exceptions. Each carries the identity circle, and a supplied logo
 * takes it in place of the initials — the same behaviour as the student avatar
 * cards, on the two professional layouts built for it.
 */
for (const key of ["badge", "spotlight"] as const) {
  const info = templatesFor("professional").find((t) => t.key === key)!;
  const plain = markupOf(renderCard(info.id, proRich));
  ok(`${info.name} carries an identity circle`, plain.includes("iv-av"));
  const withLogo = markupOf(renderCard(info.id, proRich, { logo: { url: "https://x.dev/l.png" } }));
  ok(`${info.name} puts a supplied logo in the circle`, withLogo.includes("iv-av-logo"));
  // The name appears once in the card's primary identity. Pagination may repeat
  // it in the slim header on continuation pages (page 2+ of a long CV, like a
  // document header) — that is expected, so this guard scopes to the first page.
  const firstPage = plain.split(/class="iv-page[^"]*iv-page-cont/)[0];
  ok(`${info.name} keeps the name once`, (firstPage.match(/Priya Menon/g) ?? []).length === 1);
}
// Structurally distinct from each other: Badge boxes the photo in a bordered
// panel; Spotlight lets an oversized ringed portrait bleed the corner.
ok("Badge frames the identity in a bordered panel", markupOf(renderCard("badge", proRich)).includes("iv-bd-badge"));
ok("Spotlight anchors an oversized portrait", markupOf(renderCard("spotlight", proRich)).includes("iv-sp-head"));

group("A supplied logo takes the avatar circle (student cards that have one) — DEV-3068");

/*
 * Owner's call, 18 Aug 2026: instead of a photo, an uploaded logo drops into the
 * identity circle on the cards that have one (students), replacing the initials.
 * Cards without a circle (professionals, and the two column-flow students) carry
 * no logo at all — the loop above already asserts no professional grows one.
 */
{
  const withLogo = markupOf(renderCard("side-rail", rich, { logo: { url: "https://x.dev/l.png" } }));
  ok("logo fills the circle when supplied", withLogo.includes("iv-av-logo"));
  const noLogo = markupOf(renderCard("side-rail", rich));
  ok("no logo → the circle keeps its initials/photo", !noLogo.includes("iv-av-logo"));
}

group("Theme parity across every card");

for (const info of templates) {
  const themed = renderCard(info.id, info.audience === "student" ? rich : proRich, {
    colors: { primary: "#0f766e", accent: "#f59e0b" },
    font: { heading: "Fraunces", body: "Inter" },
    fontScale: 1.1,
    size: 440,
    responsive: true,
    radius: 6,
    logo: { url: "https://x.dev/l.png", position: "top-right", height: 28 },
  });
  ok(`${info.name} honours the colour`, themed.includes("--iv-primary:#0f766e"));
  ok(`${info.name} honours the fonts`, themed.includes("Fraunces") && themed.includes("Inter"));
  ok(`${info.name} honours the width + responsive`, themed.includes("max-width:440px"));
  ok(`${info.name} honours the radius`, themed.includes("--iv-radius:6px"));
  ok(`${info.name} scales the type`, themed.includes("font-size:17.60px"));
}

group("Escaping survives a full render");

const xss = profileToCard({
  profile_type: "student",
  profile: {
    full_name: 'Priya"><script>alert(1)</script>',
    designation: "<img src=x onerror=alert(1)>",
    education: [{ degree: "B.Tech", field: "CS", institution: "<b>Anna</b>", year: "2021-2025", grade: null }],
    skills: ["<script>x</script>"],
  },
});
/*
 * The professional pool renders fields the student pool never touches —
 * highlight bullets, company names, the portfolio URL — so it needs its own
 * payload. Escaping the student fields proves nothing about a card whose whole
 * body is `experience[].highlights`.
 */
const proXss = profileToCard({
  profile_type: "professional",
  profile: {
    full_name: 'Priya"><script>alert(1)</script>',
    designation: "<img src=x onerror=alert(1)>",
    current_company: "<b>Zoho</b>",
    total_years_experience: "12<script>alert(1)</script>",
    email: "priya@example.com",
    location: "Chennai",
    skills: ["<script>x</script>", "Kubernetes", "Go", "Terraform"],
    certifications: [{ name: "<script>c</script>", issuer: "CNCF", year: "2021" }],
    portfolio_links: ["javascript:alert(1)"],
    education: [{ degree: "B.E", field: "CS", institution: "<b>Anna</b>", year: "2010-2014", grade: null }],
    experience: [
      {
        role: "<script>alert(1)</script>",
        company: "<img src=x onerror=alert(1)>",
        duration: "2022–present",
        location: "Chennai",
        highlights: ['Ran Kubernetes"><script>alert(1)</script>', "Go and Terraform work"],
      },
      {
        role: "Engineering Manager",
        company: "Freshworks",
        duration: "2019–2022",
        location: "Chennai",
        highlights: ["Kubernetes migration", "Go rewrite"],
      },
    ],
  },
});

for (const info of templates) {
  const payload = info.audience === "student" ? xss : proXss;
  if (!MINIMUMS[info.key].test(payload)) continue;
  const out = renderCard(info.id, payload);
  ok(`${info.name} escapes injected script tags`, !out.includes("<script>"));
  ok(`${info.name} escapes injected img tags`, !out.includes("<img src=x"));
}

// The portfolio URL is the one professional field that becomes an href.
ok(
  "a javascript: portfolio link never reaches an href",
  !renderCard("letterhead", proXss).includes("javascript:"),
);

group("Theme options are untrusted input");

/*
 * Profile fields were escaped from the start; theme options were not, and they
 * land somewhere escaping cannot save them — inside the `style` attribute and
 * inside a <style> block. A colour carrying a quote used to break out of the
 * attribute, which makes every embedded card an XSS vector for whoever renders
 * it. resolveTheme now re-emits colours from their parsed channels rather than
 * passing strings through, so these assert on the output, not on a blocklist.
 */
const BREAKOUTS = [
  '#fff" onload="alert(1)',
  "red;} body{display:none} .x{",
  "url(javascript:alert(1))",
  "expression(alert(1))",
  '"><script>alert(1)</script>',
];

for (const payload of BREAKOUTS) {
  const t = resolveTheme({ colors: { primary: payload } }, "student");
  ok(
    `colour payload is rejected, not echoed: ${payload.slice(0, 22)}…`,
    !t.rootStyle.includes("onload") &&
      !t.rootStyle.includes("script") &&
      !t.rootStyle.includes("javascript:") &&
      !t.rootStyle.includes("expression("),
  );
  ok(
    `rootStyle stays inside its attribute: ${payload.slice(0, 22)}…`,
    !t.rootStyle.includes('"') && !t.rootStyle.includes("<") && !t.rootStyle.includes(">"),
  );
}

ok(
  "a valid colour still survives, canonicalised",
  resolveTheme({ colors: { primary: "#AbC" } }, "student").colors.primary === "#aabbcc",
);
ok(
  "a rejected colour falls back to the default rather than rendering nothing",
  resolveTheme({ colors: { primary: "not-a-colour" } }, "student").colors.primary === "#be123c",
);

// Fonts sit inside single quotes in the stack — a bare apostrophe escapes them.
ok(
  "font family with a quote is rejected",
  !resolveTheme({ font: { heading: "Evil', x:url(javascript:alert(1)), y:'" } }).rootStyle.includes(
    "javascript:",
  ),
);
ok(
  "a real font family survives",
  resolveTheme({ font: { heading: "Playfair Display" } }).fontHeading === "Playfair Display",
);

// scopeId becomes both a class name and a CSS selector.
{
  const escaped = renderCard(1, thin, { scopeId: 'x" onmouseover="alert(1)' });
  ok("scopeId cannot break out of the class attribute", !escaped.includes("onmouseover"));
}

// Numeric options reach the stylesheet directly.
ok("NaN font scale falls back to 1", resolveTheme({ fontScale: NaN }).scale === 1);
ok("Infinite width falls back to the default", resolveTheme({ size: Infinity }).widthPx === 380);
ok(
  "a negative radius falls back to the default",
  resolveTheme({ radius: -9999 }).radius === 20,
);

/* ── result ───────────────────────────────────────────────────────────────── */

console.log(`\n${failures === 0 ? "✓" : "✗"} ${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
