import Link from "next/link";
import { profileToCard } from "@/lib/profile-to-card";
import { plannedTemplates, renderCard, templates } from "@/templates";
import { MINIMUMS } from "@/templates/guards";
import YourCard from "./your-card";

/**
 * Module 4 — Template.
 *
 * This page renders the REAL cards from the real engine at build time. It used
 * to show mock cards with invented fit scores ("TMP-101 · 94%") for templates
 * that did not exist; that is gone. Everything below comes from the registry,
 * so the page cannot drift from what is actually built — add a card and it
 * appears here, with no edit to this file.
 */

const PREVIEW_COLORS = { primary: "#0f766e", accent: "#f59e0b" };

/** Two profiles, chosen to show what the cards do with very different inputs. */
const RICH = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Meera Nair",
    designation: "B.Tech Information Technology",
    email: "meera@example.com",
    phone: "+91 90000 00000",
    location: "Kochi",
    skills: ["Go", "Kubernetes", "SQL", "Terraform", "Linux"],
    languages: ["Malayalam", "English", "Hindi"],
    social_links: [
      { platform: "GitHub", url: "github.com/meera" },
      { platform: "LinkedIn", url: "linkedin.com/in/meera" },
    ],
    education: [
      {
        degree: "B.Tech",
        field: "Information Technology",
        institution: "CUSAT",
        year: "2020–2024",
        grade: "9.1/10",
      },
      { degree: "Class XII", field: null, institution: "Kendriya Vidyalaya", year: "2020", grade: "94%" },
    ],
    certifications: [{ name: "CKA", issuer: "CNCF", year: "2024" }],
    projects: [
      {
        title: "Ledger",
        description: "Double-entry bookkeeping in Go.",
        technologies: ["Go", "SQLite"],
        link: "github.com/meera/ledger",
      },
      { title: "Kube-lite", description: "A teaching scheduler.", technologies: ["Go"], link: null },
    ],
    internships: [
      { role: "SRE Intern", organization: "Freshworks", duration: "Jun–Aug 2023", description: null },
      { role: "Backend Intern", organization: "Zoho", duration: "Summer 2022", description: null },
    ],
  },
  enhanced: { bio: "Final-year IT student focused on backend systems and platform reliability." },
});

/** The common case: a name, a course, one education line. Nothing else. */
const THIN = profileToCard({
  profile_type: "student",
  profile: {
    full_name: "Arun Kumar",
    designation: "B.Sc Physics",
    education: [
      { degree: "B.Sc", field: "Physics", institution: "Loyola College", year: "2023", grade: null },
    ],
  },
});

/**
 * The professional pool gets its own people, not the students relabelled.
 * Three of those layouts are built on `experience[].highlights` and
 * `total_years_experience`, which the student schema does not have — a
 * relabelled student would render half the pool as an empty shell.
 */
const PRO_RICH = profileToCard({
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
      {
        degree: "B.E",
        field: "Computer Science",
        institution: "Anna University",
        year: "2010–2014",
        grade: "8.6",
      },
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

/** A title and a city — what a thin professional CV or a LinkedIn crawl yields. */
const PRO_THIN = profileToCard({
  profile_type: "professional",
  profile: { full_name: "Ravi Shankar", designation: "Operations Manager", location: "Madurai" },
});

const BUILT = templates.length;
const PLANNED = plannedTemplates.length;

/** A card is only ever previewed with a profile from its own pool. */
function samplesFor(audience: "student" | "professional") {
  return audience === "student"
    ? { rich: RICH, thin: THIN }
    : { rich: PRO_RICH, thin: PRO_THIN };
}

/**
 * Renders engine output.
 *
 * `dangerouslySetInnerHTML` is correct here and safe on two counts: the HTML is
 * produced by our own renderer, which escapes every interpolated value through
 * `esc()` / `attr()` and filters hrefs through `safeUrl()`; and on this page the
 * input is the two hardcoded constants above, evaluated at build time — no
 * request data reaches it. Returning an HTML string is the engine's contract,
 * since AnurCloud embeds it in their own front end.
 */
function Card({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/** One audience pool, rendered from the registry. */
function Pool({ audience }: { audience: "student" | "professional" }) {
  const { rich, thin } = samplesFor(audience);
  return (
    <div className="flex flex-col gap-10">
      {templates
        .filter((t) => t.audience === audience)
        .map((t) => {
          const thinOk = MINIMUMS[t.key].test(thin);
          return (
            <div key={t.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-black text-slate-900">
                  {t.id}. {t.name}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                  {t.key}
                </span>
              </div>
              <p className="mb-1 max-w-2xl text-xs leading-relaxed text-slate-500">{t.description}</p>
              <p className="mb-5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500">Needs:</span> {t.minimum}
              </p>

              <div className="flex flex-wrap items-start gap-8">
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Full profile
                  </div>
                  <Card html={renderCard(t.id, rich, { colors: PREVIEW_COLORS, scopeId: `r-${t.key}` })} />
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sparse profile
                  </div>
                  {thinOk ? (
                    <Card html={renderCard(t.id, thin, { colors: PREVIEW_COLORS, scopeId: `t-${t.key}` })} />
                  ) : (
                    <div className="max-w-[260px] rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="text-[11px] font-bold text-amber-800">Not offered</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                        {MINIMUMS[t.key].reason(thin)}
                      </p>
                      <p className="mt-2 text-[10px] leading-relaxed text-amber-600">
                        A card is only suggested when the profile can fill it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default function TemplatePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white shadow-sm">
              P
            </div>
            <span className="text-sm font-bold text-slate-800">PxlBrain</span>
            <span className="text-sm font-light text-slate-300">×</span>
            <span className="text-sm font-medium text-slate-500">AnurCloud</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/extraction"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>📄</span> Module 1
            </Link>
            <Link
              href="/enhance"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>✨</span> Module 3
            </Link>
            <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span>🎴</span> Module 4
              <span className="rounded-full bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                {BUILT}/{20}
              </span>
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-16">
        {/* ── Header ── */}
        <section className="flex flex-col items-center gap-6 py-14 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-[2] rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-transparent blur-3xl" />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-4xl shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-500/30">
              🎴
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Module 04
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                ● API live
              </span>
            </div>

            <h1 className="max-w-xl bg-gradient-to-br from-slate-900 via-emerald-800 to-teal-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
              Smart-card templates
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-slate-500">
              Takes the enhanced profile and returns a themed card as self-contained HTML.
              Colours come from the user&apos;s own logo or website automatically — nothing
              to pass in.
            </p>

            <p className="max-w-lg text-sm text-slate-400">
              <strong className="font-semibold text-slate-600">All {BUILT} built</strong> — 10
              student, 10 professional. Every card below is rendered live by the engine on this
              page, not a mockup.
            </p>
          </div>

          <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 shadow-sm">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Input</span>
              <span className="text-xs font-semibold text-slate-700">Profile + brand colours</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-base shadow-sm">
              🎴
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Output</span>
              <span className="text-xs font-semibold text-slate-700">Eligible cards + rendered HTML</span>
            </div>
          </div>
        </section>

        {/*
          The live end of the pipeline: a real uploaded profile, if one was handed
          over. Client-side, because the handoff rides in sessionStorage.
        */}
        <YourCard />

        {/* ── The real cards ── */}
        <section className="py-6">
          <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            The full set · sample profiles
          </div>
          <h2 className="mb-2 text-center text-xl font-black text-slate-900">
            {BUILT} layouts, {BUILT} different structures
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-sm leading-relaxed text-slate-500">
            Each card is a different skeleton, not a recolour — a side column, a dated spine, a
            tile grid, a diagonal wedge, a bar chart, a mounted frame, a file-folder tab. They
            stay distinguishable in black and white.
          </p>
          <p className="mx-auto mb-8 max-w-xl text-center text-xs leading-relaxed text-slate-400">
            <strong className="font-semibold text-slate-500">These are fixed examples</strong> —
            four made-up people in a fixed teal, shown to compare the layouts. Your own profile
            and colours appear in the panel above, not here.
          </p>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-sm font-black text-slate-900">
              Student · {templates.filter((t) => t.audience === "student").length} layouts
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Meera Nair (full) and Arun Kumar (a name, a course, one education line).
            </p>
          </div>
          <Pool audience="student" />

          <div className="mb-6 mt-12 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-sm font-black text-slate-900">
              Professional · {templates.filter((t) => t.audience === "professional").length} layouts
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Priya Menon (full) and Ravi Shankar (a name, a title, a city). Different people, not
              the students relabelled — three of these layouts are built on fields the student
              schema does not have: years of experience, and the highlight bullets under each role.
            </p>
          </div>
          <Pool audience="professional" />
        </section>

        {/* ── How it behaves ── */}
        <section className="py-8">
          <h2 className="mb-8 text-center text-xl font-black text-slate-900">How it behaves</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🎨",
                title: "Colours from the logo",
                desc: "Supply a logo or a website and the palette is derived on our side. If the colour is too pale to read against, the next-best one is used instead.",
              },
              {
                icon: "📉",
                title: "Built for patchy data",
                desc: "Most profiles are thin. Junk values are stripped before a card sees them, and a section with nothing in it renders nothing — no empty heading, no gap.",
              },
              {
                icon: "🚦",
                title: "Only offers what fits",
                desc: "Each layout declares a minimum. A timeline needs a sequence; a grid needs enough blocks. Cards that would render badly are left out, with a reason.",
              },
              {
                icon: "🔠",
                title: "Fully themeable",
                desc: "Colours, heading and body fonts, text scale, fixed or responsive width, logo position and height — the same options on every card, no exceptions.",
              },
              {
                icon: "📦",
                title: "Self-contained output",
                desc: "One HTML string with its own scoped styles. No stylesheet to include, no fonts to load, no clash with the surrounding page.",
              },
              {
                icon: "🔌",
                title: "Same API shape",
                desc: "Bearer token, JSON body, a status union — identical to Modules 1 and 3. No AI call, so nothing to configure.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl ring-1 ring-emerald-100">
                  {f.icon}
                </div>
                <div className="text-sm font-bold text-slate-800">{f.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Still to come ── */}
        <section className="py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-900">Where this stands</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {PLANNED - BUILT > 0
                ? `${PLANNED - BUILT} designed and not yet built. `
                : "All 20 committed templates are built. "}
              The API now <strong className="font-semibold text-slate-600">suggests three</strong>{" "}
              rather than returning everything that fits, ranked on what the profile actually
              contains and with a plain-language reason for each. There is no percentage match:
              nothing can measure how well a layout suits a person, so a &ldquo;94% fit&rdquo;
              would be invented precision. Logo placement is designed and wired but deliberately
              switched off while we settle how a user-supplied logo should sit on a card.
            </p>
          </div>
        </section>

        {/* ── Pipeline position ── */}
        <section className="py-8">
          <h2 className="mb-8 text-center text-xl font-black text-slate-900">
            Where it fits in the pipeline
          </h2>
          <div className="mx-auto max-w-sm">
            {[
              { step: "01", label: "Module 1 · Extraction", tone: "blue" },
              { step: "02", label: "Module 3 · Enhancement", tone: "violet" },
              { step: "03", label: "Module 4 · Template", tone: "emerald" },
            ].map((step, i, all) => {
              const tones: Record<string, { num: string; line: string }> = {
                blue: { num: "bg-blue-50 text-blue-700 ring-blue-200", line: "bg-blue-200" },
                violet: { num: "bg-violet-50 text-violet-700 ring-violet-200", line: "bg-violet-200" },
                emerald: { num: "bg-emerald-50 text-emerald-700 ring-emerald-200", line: "bg-emerald-200" },
              };
              const t = tones[step.tone]!;
              const last = i === all.length - 1;
              return (
                <div key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${t.num}`}
                    >
                      {step.step}
                    </div>
                    {!last && <div className={`mt-1 w-0.5 flex-1 ${t.line}`} />}
                  </div>
                  <div className="mb-3 flex-1 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{step.label}</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        ● Live
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Try the other live modules:</div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/extraction"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:opacity-95"
              >
                📄 Module 1 · Extraction
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/enhance"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-700 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition hover:opacity-95"
              >
                ✨ Module 3 · Enhancement
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white/70 py-8 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white">
              P
            </div>
            <span className="text-xs font-semibold text-slate-500">
              PxlBrain <span className="font-light text-slate-300">×</span> AnurCloud · Insta VIZ integration
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Built by PxlBrain</span>
        </div>
      </footer>
    </div>
  );
}
