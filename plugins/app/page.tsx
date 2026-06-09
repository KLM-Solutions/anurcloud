import Image from "next/image";
import Link from "next/link";

const FLOW = [
  { who: "AnurCloud", label: "User uploads", desc: "Resume, portfolio, or visiting card", tone: "slate" as const },
  { who: "PxlBrain", label: "Module 1 · Extraction", desc: "Document → structured profile JSON with per-field confidence", tone: "blue" as const, status: "Live" },
  { who: "PxlBrain", label: "Module 3 · Enhance", desc: "Polished bio, normalized skills, completeness score", tone: "violet" as const, status: "Soon" },
  { who: "PxlBrain", label: "Module 2 · Template", desc: "3–5 ranked card designs with match scores", tone: "emerald" as const, status: "Soon" },
  { who: "AnurCloud", label: "Card goes live", desc: "Smart card rendered, shareable & analytics-ready", tone: "slate" as const },
];

const MODULES = [
  {
    href: "/extraction",
    n: "01",
    name: "Extraction",
    icon: "📄",
    accent: "from-blue-600 to-blue-400",
    chip: "bg-blue-50 text-blue-700",
    input: "File (PDF · DOCX · JPG · PNG) + profile_type + user_id",
    output: "Structured profile JSON · confidence_scores · flagged_fields",
    desc: "Reads any resume, portfolio, or visiting card and maps it onto a profile-type-aware schema — students get projects & education, professionals get experience & registrations.",
    ready: true,
  },
  {
    href: "#",
    n: "03",
    name: "Enhance",
    icon: "✨",
    accent: "from-violet-600 to-violet-400",
    chip: "bg-violet-50 text-violet-700",
    input: "Raw extracted profile from Module 1",
    output: "Polished bio · normalized skills · completeness score",
    desc: "Rewrites raw extracted content into a clean, on-card bio, de-duplicates and categorizes skills, and scores how complete the profile is.",
    ready: false,
  },
  {
    href: "#",
    n: "02",
    name: "Template Suggestion",
    icon: "🎴",
    accent: "from-emerald-600 to-emerald-400",
    chip: "bg-emerald-50 text-emerald-700",
    input: "Enhanced profile + designation + skills",
    output: "3–5 ranked card templates with match scores",
    desc: "Analyzes the profession behind the profile and returns the best-matching Insta VIZ card designs, ranked by fit.",
    ready: false,
  },
];

const CAPS = [
  "Resumes & portfolios",
  "Visiting cards (image OCR)",
  "Student & professional schemas",
  "Projects · education · experience",
  "Per-field confidence scoring",
  "PDF · DOCX · JPG · PNG",
];

const TONE: Record<string, { bar: string; chip: string; dot: string }> = {
  slate: { bar: "bg-slate-300", chip: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  blue: { bar: "bg-blue-500", chip: "bg-blue-50 text-blue-700", dot: "bg-blue-600" },
  violet: { bar: "bg-violet-500", chip: "bg-violet-50 text-violet-700", dot: "bg-violet-600" },
  emerald: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-600" },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-sm font-bold text-slate-800">
              PxlBrain <span className="font-light text-slate-300">×</span> AnurCloud
            </span>
          </div>
          <Link
            href="/extraction"
            className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Open Module 1 →
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5">
        {/* ── Hero ── */}
        <section className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-blue-400/20 blur-2xl" />
            <Image
              src="/pxlbrain-logo.png"
              alt="PxlBrain"
              width={92}
              height={80}
              priority
              className="rounded-2xl shadow-xl ring-1 ring-slate-900/10"
            />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            AI plugins for Insta VIZ
          </div>
          <h1 className="max-w-2xl bg-gradient-to-r from-slate-900 via-blue-800 to-violet-800 bg-clip-text text-5xl font-black leading-[1.05] tracking-tight text-transparent">
            The AI that turns any document into a smart card.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-500">
            PxlBrain builds the intelligence behind AnurCloud&apos;s Insta VIZ. At each step of the
            flow we extract, enhance, and design — turning a raw upload into a structured,
            card-ready profile.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {["3 modules · 1 live", "PDF · DOCX · JPG · PNG", "Per-field confidence"].map((s) => (
              <span
                key={s}
                className="rounded-full border border-slate-200 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>
          <Link
            href="/extraction"
            className="mt-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:opacity-95"
          >
            Try Module 1 — Extraction →
          </Link>
        </section>

        {/* ── Flow ── */}
        <section className="py-10">
          <SectionHead eyebrow="The integration" title="How PxlBrain fits the Insta VIZ flow" />
          <div className="mx-auto mt-8 max-w-2xl">
            {FLOW.map((step, i) => {
              const t = TONE[step.tone];
              const last = i === FLOW.length - 1;
              return (
                <div key={step.label} className="flex gap-4">
                  {/* rail */}
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${t.dot}`} />
                    {!last && <span className={`w-0.5 flex-1 ${t.bar} opacity-40`} />}
                  </div>
                  {/* card */}
                  <div className={`mb-4 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${last ? "" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${step.who === "PxlBrain" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {step.who}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{step.label}</span>
                      {step.status && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${step.status === "Live" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                          {step.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Modules ── */}
        <section className="py-10">
          <SectionHead eyebrow="What we build" title="Three modules, one pipeline" />
          <div className="mt-8 flex flex-col gap-4">
            {MODULES.map((m) => {
              const inner = (
                <div
                  className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all ${
                    m.ready
                      ? "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg"
                      : "border-slate-200/70 opacity-80"
                  }`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${m.accent} ${m.ready ? "" : "opacity-50"}`} />
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.accent} text-xl shadow-sm`}>
                      {m.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Module {m.n}
                        </span>
                        <span className="text-base font-bold text-slate-900">{m.name}</span>
                        {m.ready ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.chip}`}>Live</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Soon
                          </span>
                        )}
                        {m.ready && (
                          <span className="ml-auto text-lg text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500">
                            →
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{m.desc}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <IoRow label="Input" value={m.input} tone="text-slate-600" />
                        <IoRow label="Output" value={m.output} tone="text-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>
              );
              return m.ready ? (
                <Link key={m.n} href={m.href} className="block">
                  {inner}
                </Link>
              ) : (
                <div key={m.n} className="cursor-not-allowed">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Capabilities ── */}
        <section className="py-10">
          <SectionHead eyebrow="Module 1 · live now" title="What Extraction handles" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAPS.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-600">
                  ✓
                </span>
                <span className="text-sm font-medium text-slate-700">{c}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-10 border-t border-slate-200 bg-white/60 py-8 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <Image src="/pxlbrain-logo.png" alt="PxlBrain" width={26} height={22} className="rounded" />
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

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-600">{eyebrow}</div>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
    </div>
  );
}

function IoRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-0.5 font-mono text-[11px] leading-relaxed ${tone}`}>{value}</div>
    </div>
  );
}
