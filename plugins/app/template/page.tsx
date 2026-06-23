import Link from "next/link";

const FEATURES = [
  {
    icon: "🎯",
    title: "Profession-aware matching",
    desc: "Analyzes designation, skills, and experience level to understand the professional context behind the profile.",
  },
  {
    icon: "🏆",
    title: "Ranked template results",
    desc: "Returns 3–5 card templates ranked by fit score — not a random list, a reasoned recommendation.",
  },
  {
    icon: "📊",
    title: "Match score per template",
    desc: "Every template comes with a numeric fit score and a short explanation of why it was chosen.",
  },
  {
    icon: "🎨",
    title: "Student & professional layouts",
    desc: "Separate template pools for students and professionals — a doctor card looks different from a dev card.",
  },
  {
    icon: "🔗",
    title: "Plugs into the pipeline",
    desc: "Sits naturally after M3 — feed the enhanced profile in, get template IDs back for AnurCloud to render.",
  },
  {
    icon: "⚡",
    title: "Same API contract",
    desc: "Bearer token auth, JSON body, structured response — identical pattern to Module 1 and Module 3.",
  },
];

const MOCK_TEMPLATES = [
  {
    id: "TMP-101",
    name: "Clean Professional",
    score: 94,
    tags: ["Minimal", "B2B", "Corporate"],
    color: "from-slate-700 to-slate-900",
    ring: "ring-slate-300",
  },
  {
    id: "TMP-047",
    name: "Tech Minimalist",
    score: 88,
    tags: ["Dev", "Open Source", "Dark"],
    color: "from-blue-700 to-indigo-900",
    ring: "ring-blue-200",
  },
  {
    id: "TMP-083",
    name: "Creative Bold",
    score: 71,
    tags: ["Design", "Portfolio", "Colorful"],
    color: "from-violet-600 to-pink-700",
    ring: "ring-violet-200",
  },
];

const FLOW = [
  { step: "01", label: "Module 1 · Extraction", tone: "blue", live: true },
  { step: "02", label: "Module 3 · Enhancement", tone: "violet", live: true },
  { step: "03", label: "Module 2 · Template", tone: "emerald", live: false },
];

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
              <span>🎴</span> Module 2
              <span className="rounded-full bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                Soon
              </span>
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-16">
        {/* ── Header ── */}
        <section className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-[2] rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-400/15 to-transparent blur-3xl" />
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-4xl shadow-xl shadow-emerald-500/25 ring-1 ring-emerald-500/30">
              🎴
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Module 02
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                Coming Soon
              </span>
            </div>

            <h1 className="max-w-xl bg-gradient-to-br from-slate-900 via-emerald-800 to-teal-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
              Template Suggestion
            </h1>

            <p className="max-w-md text-base leading-relaxed text-slate-500">
              Receives the enhanced profile from Module 3 and returns the best-matching Insta VIZ
              card templates — ranked by professional fit, not randomized.
            </p>
          </div>

          {/* Input → Output strip */}
          <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 shadow-sm">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Input</span>
              <span className="text-xs font-semibold text-slate-700">Enhanced profile + designation</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 text-base shadow-sm">
              🎴
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Output</span>
              <span className="text-xs font-semibold text-slate-700">3–5 ranked templates + scores</span>
            </div>
          </div>
        </section>

        {/* ── Mock Preview ── */}
        <section className="py-8">
          <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            Preview — what the output will look like
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Blur overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[3px]">
              <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-bold text-slate-700">In development</span>
              </div>
              <p className="max-w-xs text-center text-xs text-slate-500">
                Module 2 is being built. Modules 1 and 3 are live now.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/extraction"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Try Module 1 →
                </Link>
                <Link
                  href="/enhance"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                >
                  Try Module 3 →
                </Link>
              </div>
            </div>

            {/* Mock content (blurred behind overlay) */}
            <div className="p-6">
              <div className="mb-4 text-xs font-semibold text-slate-500">
                3 templates matched · sorted by fit score
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {MOCK_TEMPLATES.map((t) => (
                  <div
                    key={t.id}
                    className={`overflow-hidden rounded-xl border bg-white shadow-sm ${t.ring} ring-1`}
                  >
                    <div className={`h-24 bg-gradient-to-br ${t.color}`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{t.name}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          {t.score}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-slate-400">{t.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-8">
          <div className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            What to expect
          </div>
          <h2 className="mb-8 text-center text-xl font-black text-slate-900">
            How Module 2 will work
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl ring-1 ring-emerald-100">
                  {f.icon}
                </div>
                <div className="text-sm font-bold text-slate-800">{f.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pipeline position ── */}
        <section className="py-8">
          <h2 className="mb-8 text-center text-xl font-black text-slate-900">
            Where it fits in the pipeline
          </h2>
          <div className="mx-auto max-w-sm">
            {FLOW.map((step, i) => {
              const tones: Record<string, { dot: string; num: string; line: string }> = {
                blue: { dot: "bg-blue-500", num: "bg-blue-50 text-blue-700 ring-blue-200", line: "bg-blue-200" },
                violet: { dot: "bg-violet-500", num: "bg-violet-50 text-violet-700 ring-violet-200", line: "bg-violet-200" },
                emerald: { dot: "bg-emerald-500", num: "bg-emerald-50 text-emerald-700 ring-emerald-200", line: "bg-emerald-200" },
              };
              const t = tones[step.tone];
              const last = i === FLOW.length - 1;
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
                      {step.live ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          ● Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
                          Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="text-sm font-semibold text-slate-700">
              While Module 2 is in development, try the live modules:
            </div>
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
