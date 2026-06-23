import Image from "next/image";
import Link from "next/link";

const FLOW = [
  {
    who: "AnurCloud",
    step: "01",
    label: "User uploads",
    desc: "Resume, portfolio, or visiting card",
    tone: "slate" as const,
  },
  {
    who: "PxlBrain",
    step: "02",
    label: "Module 1 · Extraction",
    desc: "Returns structured profile JSON with per-field confidence scores",
    tone: "blue" as const,
    status: "Live",
  },
  {
    who: "AnurCloud",
    step: "03",
    label: "User reviews & confirms",
    desc: "AnurCloud shows extracted fields to the user — they fill missing fields, fix errors, and confirm. Only confirmed data moves forward.",
    tone: "slate" as const,
  },
  {
    who: "PxlBrain",
    step: "04",
    label: "Module 3 · Enhancement",
    desc: "Receives the confirmed profile from AnurCloud and returns a polished bio + enhanced descriptions. Nothing is inferred — only confirmed fields are used.",
    tone: "violet" as const,
    status: "Live",
  },
  {
    who: "PxlBrain",
    step: "05",
    label: "Module 2 · Template",
    desc: "3–5 ranked card designs with match scores",
    tone: "emerald" as const,
    status: "Soon",
  },
  {
    who: "AnurCloud",
    step: "06",
    label: "Card goes live",
    desc: "Smart card rendered, shareable & analytics-ready",
    tone: "slate" as const,
  },
];

const MODULES = [
  {
    href: "/extraction",
    n: "01",
    name: "Extraction",
    icon: "📄",
    accent: "blue",
    borderTop: "border-t-blue-500",
    iconGrad: "from-blue-600 to-blue-400",
    chip: "bg-blue-50 text-blue-700",
    input: "File (PDF · DOCX · JPG · PNG) + profile_type",
    output: "Structured profile JSON · confidence_scores · flagged_fields",
    desc: "Reads any resume, portfolio, or visiting card and maps it onto a profile-type-aware schema — students get projects & education, professionals get experience & registrations.",
    ready: true,
  },
  {
    href: "/enhance",
    n: "03",
    name: "Enhancement",
    icon: "✨",
    accent: "violet",
    borderTop: "border-t-violet-500",
    iconGrad: "from-violet-600 to-violet-400",
    chip: "bg-violet-50 text-violet-700",
    input: "Verified profile from Module 1",
    output: "Polished bio · enhanced descriptions",
    desc: "Receives the user-confirmed profile from AnurCloud and returns a polished first-person bio and enhanced descriptions. Only fields the user confirmed are used — nothing is guessed or added.",
    ready: true,
  },
  {
    href: "#",
    n: "02",
    name: "Template Suggestion",
    icon: "🎴",
    accent: "emerald",
    borderTop: "border-t-slate-200",
    iconGrad: "from-emerald-600 to-emerald-400",
    chip: "bg-emerald-50 text-emerald-700",
    input: "Enhanced profile + designation + skills",
    output: "3–5 ranked card templates with match scores",
    desc: "Analyzes the profession behind the profile and returns the best-matching Insta VIZ card designs, ranked by fit.",
    ready: false,
  },
];

const CAPS_M1 = [
  { icon: "📄", label: "Resumes & portfolios" },
  { icon: "🔍", label: "Visiting cards (image OCR)" },
  { icon: "🎓", label: "Student & professional schemas" },
  { icon: "🗂️", label: "Projects · education · experience" },
  { icon: "📊", label: "Per-field confidence scoring" },
  { icon: "📎", label: "PDF · DOCX · JPG · PNG" },
];

const CAPS_M3 = [
  { icon: "✍️", label: "Polished first-person bio" },
  { icon: "📝", label: "Project description enhancement" },
  { icon: "🏢", label: "Internship description enhancement" },
  { icon: "💼", label: "Experience highlights enhancement" },
  { icon: "🛡️", label: "No guessing — confirmed data only" },
  { icon: "🔀", label: "Student & professional modes" },
];

const TONE_STEP: Record<string, { ring: string; dot: string; line: string; num: string }> = {
  slate: {
    ring: "ring-slate-200",
    dot: "bg-slate-400",
    line: "bg-slate-200",
    num: "bg-slate-100 text-slate-500",
  },
  blue: {
    ring: "ring-blue-200",
    dot: "bg-blue-500",
    line: "bg-blue-200",
    num: "bg-blue-50 text-blue-700",
  },
  violet: {
    ring: "ring-violet-200",
    dot: "bg-violet-500",
    line: "bg-violet-200",
    num: "bg-violet-50 text-violet-700",
  },
  emerald: {
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    line: "bg-emerald-200",
    num: "bg-emerald-50 text-emerald-700",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white shadow-sm">
              P
            </div>
            <span className="text-sm font-bold text-slate-800">PxlBrain</span>
            <span className="text-sm font-light text-slate-300">×</span>
            <span className="text-sm font-medium text-slate-500">AnurCloud</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/extraction"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span>📄</span> Module 1
            </Link>
            <Link
              href="/enhance"
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <span>✨</span> Module 3
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5">
        {/* ── Hero ── */}
        <section className="flex flex-col items-center gap-8 py-20 text-center">
          <div className="relative">
            <div className="absolute inset-0 -z-10 scale-[2] rounded-full bg-gradient-to-br from-blue-400/25 via-violet-400/20 to-transparent blur-3xl" />
            <Image
              src="/pxlbrain-logo.png"
              alt="PxlBrain"
              width={88}
              height={76}
              priority
              className="rounded-2xl shadow-xl ring-1 ring-slate-900/10"
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              2 modules live · AI plugins for Insta VIZ
            </div>

            <h1 className="max-w-2xl bg-gradient-to-br from-slate-900 via-blue-800 to-violet-700 bg-clip-text text-5xl font-black leading-[1.08] tracking-tight text-transparent sm:text-6xl">
              The AI that turns any document into a smart card.
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-slate-500">
              PxlBrain builds the intelligence behind AnurCloud&apos;s Insta VIZ — extracting,
              enhancing, and designing at every step of the flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {["PDF · DOCX · JPG · PNG", "Per-field confidence scores", "Student & professional schemas"].map(
              (s) => (
                <span
                  key={s}
                  className="rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
                >
                  {s}
                </span>
              )
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/extraction"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:opacity-95"
            >
              Try Extraction
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/enhance"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-700 to-violet-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 hover:opacity-95"
            >
              Try Enhancement
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </section>

        {/* ── Flow ── */}
        <section className="py-12">
          <SectionHead
            eyebrow="Integration"
            title="How PxlBrain fits the Insta VIZ flow"
            sub="Six steps — PxlBrain powers three of them."
          />
          <div className="mx-auto mt-10 max-w-xl">
            {FLOW.map((step, i) => {
              const t = TONE_STEP[step.tone];
              const last = i === FLOW.length - 1;
              return (
                <div key={step.label} className="flex gap-4">
                  {/* Rail */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${t.ring} ${t.num}`}
                    >
                      {step.step}
                    </div>
                    {!last && <div className={`mt-1 w-0.5 flex-1 ${t.line}`} />}
                  </div>
                  {/* Card */}
                  <div className="mb-3 min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          step.who === "PxlBrain"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {step.who}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{step.label}</span>
                      {step.status && (
                        <span
                          className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            step.status === "Live"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {step.status === "Live" ? "● Live" : "Soon"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Modules ── */}
        <section className="py-12">
          <SectionHead
            eyebrow="Modules"
            title="Three modules, one pipeline"
            sub="Each module is a standalone API endpoint — integrate them independently."
          />
          <div className="mt-10 flex flex-col gap-4">
            {MODULES.map((m) => {
              const inner = (
                <div
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all ${
                    m.ready
                      ? "shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                      : "opacity-70"
                  }`}
                >
                  {/* Top accent */}
                  <div
                    className={`h-1 w-full ${m.ready ? `bg-gradient-to-r ${m.iconGrad}` : "bg-slate-200"}`}
                  />
                  <div className="flex items-start gap-5 p-5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.iconGrad} text-xl shadow-sm`}
                    >
                      {m.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Module {m.n}
                        </span>
                        <span className="text-base font-bold text-slate-900">{m.name}</span>
                        {m.ready ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${m.chip} ring-current/20`}
                          >
                            Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            Coming soon
                          </span>
                        )}
                        {m.ready && (
                          <span className="ml-auto text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-500">
                            →
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{m.desc}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <IoRow label="Input" value={m.input} />
                        <IoRow label="Output" value={m.output} />
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
        <section className="py-12">
          <SectionHead
            eyebrow="Capabilities"
            title="What PxlBrain handles today"
            sub="Two live modules covering extraction and enhancement."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* M1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 text-base shadow-sm">
                  📄
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Module 01
                  </div>
                  <div className="text-sm font-bold text-slate-800">Extraction</div>
                </div>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CAPS_M1.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="text-xs font-medium text-slate-700">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* M3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 text-base shadow-sm">
                  ✨
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Module 03
                  </div>
                  <div className="text-sm font-bold text-slate-800">Enhancement</div>
                </div>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CAPS_M3.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="text-xs font-medium text-slate-700">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-6 border-t border-slate-200 bg-white/70 py-8 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white">
              P
            </div>
            <span className="text-xs font-semibold text-slate-500">
              PxlBrain <span className="font-light text-slate-300">×</span> AnurCloud · Insta VIZ
              integration
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Built by PxlBrain</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-bold uppercase tracking-wider text-blue-600">{eyebrow}</div>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
      {sub && <p className="mt-1.5 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function IoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 font-mono text-[11px] leading-relaxed text-slate-600">{value}</div>
    </div>
  );
}
