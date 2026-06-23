"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { EnhanceResponse, EnhanceSuccess } from "@/lib/enhance-types";

type Status = "idle" | "running" | "done" | "error";
type Tab = "preview" | "input" | "output";
type ProfileType = "student" | "professional";

const ENDPOINT = "https://anurcloud.vercel.app/api/enhance";

/* ── Sample data ── */

const SAMPLE_STUDENT: EnhanceSuccess = {
  status: "success",
  bio: "I'm a final-year Computer Science student at IIT Madras specializing in backend systems and machine learning. I've delivered production-grade microservices at Infosys and built full-stack projects ranging from AI-powered note tools to student networking platforms. I'm actively seeking engineering roles where I can apply my cloud and systems expertise at scale.",
  projects: [
    { title: "SmartNotes", description: "I built an AI-powered note summarizer that condenses lecture content into structured summaries, helping students cut revision time significantly." },
    { title: "CampusConnect", description: "I developed a full-stack student networking platform that helps peers discover collaboration opportunities and share academic resources." },
  ],
  internships: [
    { role: "SWE Intern", organization: "Infosys", description: "I designed and deployed microservices for internal HR tooling, improving system response time and reducing manual processing overhead." },
  ],
  experience: [],
};

const SAMPLE_PROFESSIONAL: EnhanceSuccess = {
  status: "success",
  bio: "I'm a Senior Product Manager at Razorpay with 8 years of experience building B2B SaaS products across fintech and HR tech. I led the payments SDK redesign adopted by over 50,000 merchants and drove an 18% uplift in checkout conversion. As a certified scrum practitioner, I combine data-driven thinking with strong stakeholder management to ship products at scale.",
  projects: [],
  internships: [],
  experience: [
    { role: "Senior Product Manager", company: "Razorpay", highlights: ["Led the end-to-end redesign of the payments SDK, now adopted by 50,000+ merchants nationwide.", "Drove an 18% uplift in checkout conversion through data-driven UX improvements."] },
    { role: "Product Manager", company: "Zoho", highlights: ["Owned the roadmap for Zoho People's HR module, delivering 3 major feature releases in 12 months.", "Managed a 4-engineer squad, improving sprint velocity by 30% through structured planning."] },
  ],
};

const SAMPLE_INPUT_STUDENT = {
  profile_type: "student",
  profile: {
    full_name: "Arjun Sharma",
    designation: "B.Tech Computer Science Student",
    email: "arjun.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Chennai, Tamil Nadu",
    summary: "Final-year CS student focused on backend systems and machine learning.",
    skills: ["Python", "Java", "TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
    education: [{ degree: "B.Tech", field: "Computer Science", institution: "IIT Madras", year: "2021–2025", grade: "8.7/10" }],
    internships: [{ role: "SWE Intern", organization: "Infosys", duration: "Summer 2024", description: "Built microservices for internal HR tooling" }],
    projects: [
      { title: "SmartNotes", description: "AI-powered note summarizer", technologies: ["React", "FastAPI", "Python"] },
      { title: "CampusConnect", description: "Student networking platform", technologies: ["Next.js", "PostgreSQL"] },
    ],
    achievements: [],
    extracurriculars: [],
  },
};

const SAMPLE_INPUT_PROFESSIONAL = {
  profile_type: "professional",
  profile: {
    full_name: "Priya Krishnamurthy",
    designation: "Senior Product Manager",
    email: "priya.k@example.com",
    phone: "+91 98400 11234",
    location: "Bengaluru, Karnataka",
    summary: "8 years building B2B SaaS products across fintech and HR tech.",
    skills: ["Product Strategy", "Roadmap Planning", "SQL", "Figma", "JIRA", "Agile", "Data Analysis", "Stakeholder Management"],
    current_company: "Razorpay",
    total_years_experience: "8 years",
    experience: [
      { role: "Senior Product Manager", company: "Razorpay", duration: "2021–present", highlights: ["Led payments SDK redesign used by 50k+ merchants", "Grew checkout conversion by 18%"] },
      { role: "Product Manager", company: "Zoho", duration: "2016–2021", highlights: ["Built HR module for Zoho People", "Managed roadmap for 4-engineer squad"] },
    ],
    certifications: [{ name: "Certified Scrum Product Owner", issuer: "Scrum Alliance", year: "2020" }],
    social_links: [{ platform: "LinkedIn", url: "linkedin.com/in/priyak" }],
  },
};

export default function EnhancePage() {
  const [profileType, setProfileType] = useState<ProfileType>("student");
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_EXTRACT_TOKEN ?? "");
  const [profileJson, setProfileJson] = useState(JSON.stringify(SAMPLE_INPUT_STUDENT, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<EnhanceResponse | null>(null);
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);

  const live: EnhanceSuccess | null = response?.status === "success" ? response : null;
  const SAMPLE = profileType === "student" ? SAMPLE_STUDENT : SAMPLE_PROFESSIONAL;
  const active = live ?? SAMPLE;

  function switchProfileType(pt: ProfileType) {
    setProfileType(pt);
    setResponse(null);
    setStatus("idle");
    setJsonError(null);
    setProfileJson(JSON.stringify(pt === "student" ? SAMPLE_INPUT_STUDENT : SAMPLE_INPUT_PROFESSIONAL, null, 2));
  }

  // On mount: check if extraction page passed data via sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("enhance_prefill");
    if (!raw) return;
    sessionStorage.removeItem("enhance_prefill");
    try {
      const parsed = JSON.parse(raw) as { profile_type?: string; profile?: unknown };
      const pt = parsed.profile_type === "professional" ? "professional" : "student";
      setProfileType(pt);
      setProfileJson(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore malformed data
    }
  }, []);

  function validateJson(text: string) {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError((e as Error).message);
      return false;
    }
  }

  function handleJsonChange(text: string) {
    setProfileJson(text);
    if (jsonError) validateJson(text);
  }

  async function onSubmit() {
    if (!validateJson(profileJson)) return;
    let parsed: unknown;
    try { parsed = JSON.parse(profileJson); } catch { return; }

    setStatus("running");
    setResponse(null);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as EnhanceResponse;
      setResponse(json);
      setStatus(res.ok ? "done" : "error");
      if (res.ok) setTab("preview");
    } catch (e) {
      setResponse({ status: "error", error: { code: "NETWORK", message: String(e) } });
      setStatus("error");
    }
  }

  function copy(text: string, key: "input" | "output") {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const sampleInput = profileType === "student" ? SAMPLE_INPUT_STUDENT : SAMPLE_INPUT_PROFESSIONAL;
  const curlExample = `curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer <auth_token>" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sampleInput, null, 2)}'`;

  const outputShape = `{
  "status": "success",
  "bio": string,
  "projects": [{ "title": string, "description": string }],
  "internships": [{ "role": string, "organization": string, "description": string }],
  "experience": [{ "role": string, "company": string, "highlights": string[] }]
}

// students  → bio + projects + internships (experience: [])
// professionals → bio + projects + experience (internships: [])`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-xs font-semibold text-slate-400 transition-colors hover:text-violet-600">
          ← Modules
        </Link>
        <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          PxlBrain
          <span className="font-light text-slate-300">×</span>
          AnurCloud
          <span className="h-2 w-2 rounded-full bg-violet-600" />
        </div>
        <h1 className="bg-gradient-to-r from-slate-900 via-violet-800 to-violet-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Module 3 — AI Content Enhancement
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Paste the verified profile on the left; see the polished bio, categorized skills, and
          completeness score on the right — exactly what AnurCloud receives.
        </p>
      </header>

      {/* Pipeline strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
        <PipeStep icon="✅" title="Verified profile" sub="human-confirmed JSON" tone="slate" />
        <span className="text-slate-300">→</span>
        <PipeStep icon="✨" title="PxlBrain AI" sub="bio · skills · score" tone="violet" />
        <span className="text-slate-300">→</span>
        <PipeStep icon="🎴" title="Output" sub="ready for card render" tone="emerald" />
      </div>

      {/* Two equal cards */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* LEFT — Input */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
          <CardHead dot="bg-violet-600" title="Try it live">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
              POST /api/enhance
            </span>
          </CardHead>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* Profile type toggle */}
            <div className="flex gap-2">
              {(["student", "professional"] as ProfileType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => switchProfileType(pt)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    profileType === pt
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {pt === "student" ? "🎓 " : "💼 "}{pt}
                </button>
              ))}
            </div>

            {/* Profile JSON */}
            <div className="flex flex-col gap-2">
              <Eyebrow>Profile JSON</Eyebrow>
              <p className="text-[11px] text-slate-400">
                Paste the human-verified profile from Module 1. Must include{" "}
                <code className="font-mono">profile_type</code> and a{" "}
                <code className="font-mono">profile</code> object.
              </p>
              <textarea
                value={profileJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                onBlur={() => validateJson(profileJson)}
                rows={16}
                spellCheck={false}
                className={`w-full resize-none rounded-xl border bg-slate-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed outline-none transition-colors focus:ring-2 ${
                  jsonError
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-violet-500 focus:ring-violet-100"
                }`}
              />
              {jsonError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">!</span>
                  Invalid JSON: {jsonError}
                </div>
              )}
            </div>

            {/* Bearer token */}
            <Labeled label="Bearer token">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your access token to run live"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </Labeled>

            {response?.status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <strong>{response.error.code}</strong> — {response.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={status === "running" || !!jsonError}
              className="rounded-xl bg-gradient-to-r from-violet-700 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/30 transition hover:opacity-95 disabled:opacity-60"
            >
              {status === "running" ? "Enhancing… (a few seconds)" : "Run enhancement →"}
            </button>
          </div>
        </section>

        {/* RIGHT — Output */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
          <CardHead dot="bg-emerald-600" title="Integration">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${live ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {live ? "Live data" : "Sample data"}
            </span>
          </CardHead>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-100 px-5 pt-3">
            <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>✨ Preview</TabBtn>
            <TabBtn active={tab === "input"} onClick={() => setTab("input")}>Input</TabBtn>
            <TabBtn active={tab === "output"} onClick={() => setTab("output")}>Output</TabBtn>
            {tab === "input" && (
              <button
                onClick={() => copy(curlExample, "input")}
                className="ml-auto mb-2 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                {copied === "input" ? "✓ Copied" : "Copy cURL"}
              </button>
            )}
            {tab === "output" && (
              <button
                onClick={() => copy(outputShape, "output")}
                className="ml-auto mb-2 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700"
              >
                {copied === "output" ? "✓ Copied" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50/40">
            {tab === "preview" && (
              <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
                {/* Bio */}
                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-500">Polished Bio</div>
                  <p className="text-sm leading-relaxed text-slate-800">{active.bio}</p>
                </div>

                {/* Projects */}
                {active.projects.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Enhanced Project Descriptions</div>
                    <div className="flex flex-col gap-3">
                      {active.projects.map((p, i) => (
                        <div key={i} className="border-l-2 border-violet-300 pl-3">
                          <div className="text-xs font-bold text-slate-700">{p.title}</div>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Internships — student */}
                {active.internships.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Enhanced Internship Descriptions</div>
                    <div className="flex flex-col gap-3">
                      {active.internships.map((n, i) => (
                        <div key={i} className="border-l-2 border-blue-300 pl-3">
                          <div className="text-xs font-bold text-slate-700">{n.role} · {n.organization}</div>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience — professional */}
                {active.experience.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Enhanced Experience Highlights</div>
                    <div className="flex flex-col gap-3">
                      {active.experience.map((e, i) => (
                        <div key={i} className="border-l-2 border-emerald-300 pl-3">
                          <div className="text-xs font-bold text-slate-700">{e.role} · {e.company}</div>
                          <ul className="mt-1 flex flex-col gap-0.5">
                            {e.highlights.map((h, j) => (
                              <li key={j} className="text-xs leading-relaxed text-slate-500">· {h}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "input" && (
              <div className="h-full overflow-y-auto p-5">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-violet-600 px-1.5 py-0.5 font-bold text-white">POST</span>
                    <span className="break-all text-slate-700">{ENDPOINT}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600">
                    <div><span className="text-violet-700">Authorization:</span> Bearer &lt;auth_token&gt;</div>
                    <div><span className="text-violet-700">Content-Type:</span> application/json</div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <PayloadRow name="profile_type" type='"student" | "professional"' required />
                    <PayloadRow name="profile" type="object" required desc="verified profile fields" />
                    <PayloadRow name="profile.full_name" type="string | null" />
                    <PayloadRow name="profile.designation" type="string | null" />
                    <PayloadRow name="profile.summary" type="string | null" />
                    <PayloadRow name="profile.skills" type="string[]" />
                    <PayloadRow name="profile.education" type="object[]" />
                    <PayloadRow name="profile.experience" type="object[]" />
                  </div>
                  <div>
                    <div className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Example request
                    </div>
                    <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                      {curlExample}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {tab === "output" && (
              <div className="flex h-full flex-col gap-3 overflow-auto p-5">
                <div className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-700">
                  <span>ℹ️</span>
                  <span>
                    Only fields present in the confirmed profile are used —
                    nothing is invented or inferred.
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-700">
                  {outputShape}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}


function PipeStep({ icon, title, sub, tone }: { icon: string; title: string; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    slate: "from-slate-500 to-slate-400",
    violet: "from-violet-600 to-violet-400",
    emerald: "from-emerald-600 to-emerald-400",
  };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${tones[tone]} text-base shadow-sm`}>{icon}</div>
      <div>
        <div className="text-xs font-bold text-slate-800">{title}</div>
        <div className="text-[10px] text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

function CardHead({ dot, title, children }: { dot: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</span>;
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </label>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
        active ? "border-violet-600 text-violet-700" : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function PayloadRow({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="text-slate-400">{type}</span>
      {required && <span className="rounded bg-red-50 px-1.5 text-[9px] font-bold text-red-600">required</span>}
      {desc && <span className="ml-auto text-[10px] text-slate-400">{desc}</span>}
    </div>
  );
}
