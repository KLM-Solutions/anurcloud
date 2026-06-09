"use client";

import Link from "next/link";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ACCEPT_ATTR, PROFILE_TYPES, formatBytes, validateSourceFile } from "@/lib/validation";
import { EXTRACTION_SCHEMA, SCHEMA_GROUPS, type SchemaField } from "@/lib/schema";
import type { ExtractResponse, ProfileType } from "@/lib/types";

type Status = "idle" | "uploading" | "done" | "error";
type Tab = "preview" | "fields" | "input" | "output";

const TYPE_LABEL: Record<SchemaField["type"], string> = {
  string: "Text",
  "string[]": "List",
  "object[]": "Records",
};
const TYPE_BADGE: Record<SchemaField["type"], string> = {
  string: "bg-blue-50 text-blue-700",
  "string[]": "bg-violet-50 text-violet-700",
  "object[]": "bg-emerald-50 text-emerald-700",
};

interface ActiveResult {
  status: "success";
  profile_type: ProfileType;
  data: Record<string, unknown>;
  confidence_scores: Record<string, number>;
  flagged_fields: string[];
}

/* Sample profile shown by default so AnurCloud's team sees the concept instantly. */
const SAMPLE: ActiveResult = {
  status: "success",
  profile_type: "student",
  data: {
    full_name: "Arjun Sharma",
    designation: "B.Tech Computer Science Student",
    email: "arjun.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Chennai, Tamil Nadu",
    summary: "Final-year CS student focused on backend systems and machine learning.",
    skills: ["Python", "Java", "TypeScript", "React", "Node.js", "PostgreSQL", "Docker", "AWS"],
    languages: ["English", "Hindi", "Tamil"],
    social_links: [
      { platform: "LinkedIn", url: "linkedin.com/in/arjunsharma" },
      { platform: "GitHub", url: "github.com/arjunsharma" },
    ],
    education: [
      { degree: "B.Tech", field: "Computer Science", institution: "IIT Madras", year: "2021–2025", grade: "8.7/10" },
    ],
    certifications: [{ name: "AWS Cloud Practitioner", issuer: "AWS", year: "2023" }],
    achievements: [],
    projects: [
      { title: "SmartNotes", description: "AI note summarizer", technologies: ["React", "FastAPI"], link: "" },
      { title: "CampusConnect", description: "Student networking", technologies: ["Next.js"], link: "" },
    ],
    internships: [
      { role: "SWE Intern", organization: "Infosys", duration: "Summer 2024", description: "Microservices" },
    ],
    extracurriculars: [],
    publications: [],
  },
  confidence_scores: {
    full_name: 1, designation: 0.95, email: 1, phone: 1, location: 0.98, summary: 0.9,
    skills: 1, languages: 1, social_links: 0.96, education: 0.99, certifications: 0.97,
    projects: 0.66, internships: 0.99,
  },
  flagged_fields: ["projects"],
};

/* Sample resumes (served from /public/samples) — one-click load into the uploader. */
const SAMPLES = [
  { file: "karthick-r.pdf", label: "Karthick R" },
  { file: "subramani-resume.pdf", label: "Subramani" },
];

const asStr = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/* Output payload as a TYPE/FORMAT spec (not sample values), per profile type.
   object[] fields are expanded across lines so nothing overflows horizontally. */
function outputFormat(pt: ProfileType): string {
  const dataLines = EXTRACTION_SCHEMA[pt].flatMap((f) => {
    if (f.type === "string") return [`    "${f.key}": string | null,`];
    if (f.type === "string[]") return [`    "${f.key}": string[],`];
    // object[] — one sub-field per line
    const subs = f.fields ?? [];
    return [
      `    "${f.key}": [`,
      `      {`,
      ...subs.map(
        (s, i) =>
          `        "${s.key}": ${s.type === "string[]" ? "string[]" : "string"}${i < subs.length - 1 ? "," : ""}`,
      ),
      `      }`,
      `    ],`,
    ];
  });
  return [
    "{",
    '  "status": "success",',
    `  "profile_type": "${pt}",`,
    '  "data": {',
    ...dataLines,
    "  },",
    '  "confidence_scores": { "<field>": number },',
    '  "flagged_fields": string[]',
    "}",
  ].join("\n");
}

export default function ExtractionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>("student");
  const [userId, setUserId] = useState("user_demo_001");
  const [token, setToken] = useState("demo-token");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<ExtractResponse | null>(null);
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const live: ActiveResult | null =
    response?.status === "success"
      ? {
          status: "success",
          profile_type: response.profile_type,
          data: response.data as unknown as Record<string, unknown>,
          confidence_scores: response.confidence_scores ?? {},
          flagged_fields: response.flagged_fields ?? [],
        }
      : null;
  const active = live ?? SAMPLE;

  function chooseFile(next: File | null) {
    setResponse(null);
    setStatus("idle");
    const err = validateSourceFile(next ? { name: next.name, size: next.size, type: next.type } : null);
    if (err) {
      setError(err.message);
      setFile(null);
      return;
    }
    setError(null);
    setFile(next);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    chooseFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function loadSample(s: { file: string; label: string }) {
    setLoadingSample(s.file);
    setError(null);
    try {
      const res = await fetch(`/samples/${s.file}`);
      const blob = await res.blob();
      const f = new File([blob], `${s.label} — sample.pdf`, { type: "application/pdf" });
      chooseFile(f);
    } catch {
      setError(`Couldn't load the "${s.label}" sample. Try uploading a file instead.`);
    } finally {
      setLoadingSample(null);
    }
  }

  async function onSubmit() {
    if (!file) return setError("Please choose a PDF, DOCX, JPG, or PNG file.");
    if (!userId.trim()) return setError("user_id is required.");
    setError(null);
    setStatus("uploading");
    setResponse(null);
    const body = new FormData();
    body.append("file", file);
    body.append("profile_type", profileType);
    body.append("user_id", userId.trim());
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = (await res.json()) as ExtractResponse;
      setResponse(json);
      setStatus(res.ok ? "done" : "error");
      if (res.ok) setTab("preview");
    } catch (e) {
      setResponse({ status: "error", error: { code: "NETWORK", message: String(e) } });
      setStatus("error");
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const curlExample = `curl -X POST https://<your-app>.vercel.app/api/extract \\
  -H "Authorization: Bearer <auth_token>" \\
  -F "file=@resume.pdf" \\
  -F "profile_type=${profileType}" \\
  -F "user_id=user_123"`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-7 px-5 py-10">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-xs font-semibold text-slate-400 transition-colors hover:text-blue-600">
          ← Modules
        </Link>
        <div className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          PxlBrain
          <span className="font-light text-slate-300">×</span>
          AnurCloud
          <span className="h-2 w-2 rounded-full bg-violet-600" />
        </div>
        <h1 className="bg-gradient-to-r from-slate-900 via-blue-800 to-violet-800 bg-clip-text text-3xl font-black tracking-tight text-transparent">
          Module 1 — Extraction
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          Upload on the left; see exactly what AnurCloud receives on the right — rendered as the
          auto-filled profile screen and as raw JSON.
        </p>
      </header>

      {/* Pipeline strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
        <PipeStep icon="📤" title="Input" sub="file + profile_type" tone="blue" />
        <span className="text-slate-300">→</span>
        <PipeStep icon="⚙️" title="PxlBrain AI" sub="OCR + field mapping" tone="violet" />
        <span className="text-slate-300">→</span>
        <PipeStep icon="📦" title="Output" sub="profile + confidence" tone="emerald" />
      </div>

      {/* Two equal cards */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        {/* LEFT */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
          <CardHead dot="bg-blue-600" title="Try it live">
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
              POST /api/extract
            </span>
          </CardHead>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
            {/* Profile type */}
            <div className="flex gap-2">
              {PROFILE_TYPES.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setProfileType(pt)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                    profileType === pt
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {pt === "student" ? "🎓 " : "💼 "}
                  {pt}
                </button>
              ))}
            </div>

            {/* Source */}
            <div className="flex flex-col gap-2.5">
              <Eyebrow>Source</Eyebrow>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50/50 hover:border-slate-400"
                }`}
              >
                <div className="text-2xl">📄</div>
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-800">{file.name}</span>
                    <span className="text-slate-400">· {formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        chooseFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="rounded-full bg-slate-200 px-2 text-xs font-bold text-slate-500 hover:bg-slate-300"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700">Upload a file</p>
                    <p className="text-xs text-slate-400">drag &amp; drop or browse · PDF · DOCX · JPG · PNG</p>
                  </>
                )}
                <input ref={inputRef} type="file" accept={ACCEPT_ATTR} className="hidden" onChange={(e) => chooseFile(e.target.files?.[0] ?? null)} />
              </div>

              {/* Sample resumes — one-click load, or upload your own above */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400">Or try a sample:</span>
                {SAMPLES.map((s) => (
                  <button
                    key={s.file}
                    type="button"
                    onClick={() => loadSample(s)}
                    disabled={loadingSample !== null}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-700 disabled:opacity-50"
                  >
                    <span>📄</span>
                    {loadingSample === s.file ? "Loading…" : s.label}
                  </button>
                ))}
              </div>

              <SoonRow icon="🔗" label="Paste a site / portfolio URL" />
              <SoonRow icon="🖼️" label="Upload a logo" />
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="user_id">
                <input value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </Labeled>
              <Labeled label="Bearer token">
                <input value={token} onChange={(e) => setToken(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </Labeled>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">!</span>
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={status === "uploading"}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/30 transition hover:opacity-95 disabled:opacity-60"
            >
              {status === "uploading" ? "Extracting… (a few seconds)" : "Run extraction →"}
            </button>

            {response?.status === "error" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <strong>{response.error.code}</strong> — {response.error.message}
              </div>
            )}

            {/* Extracted fields — always present so the card fills evenly */}
            <div className="flex flex-1 flex-col border-t border-slate-100 pt-4">
              <Eyebrow>Extracted fields</Eyebrow>
              {live ? (
                <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {EXTRACTION_SCHEMA[live.profile_type].map((f) => {
                    const value = live.data[f.key];
                    const score = live.confidence_scores[f.key];
                    const flagged = live.flagged_fields.includes(f.key);
                    const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0);
                    return (
                      <div key={f.key} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="w-32 shrink-0 truncate text-xs font-medium text-slate-500">{f.label}</span>
                        <span className={`flex-1 truncate ${empty ? "text-slate-300" : "text-slate-800"}`}>
                          {Array.isArray(value) ? (value.length ? `${value.length} item${value.length === 1 ? "" : "s"}` : "—") : value ? String(value) : "—"}
                        </span>
                        {typeof score === "number" && (
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${flagged ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {flagged ? "⚠" : "✓"} {score.toFixed(2)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-8 text-center">
                  <span className="text-2xl opacity-40">📦</span>
                  <p className="text-xs text-slate-400">
                    Run an extraction to see each field and its confidence score here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
          <CardHead dot="bg-emerald-600" title="Integration">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${live ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {live ? "Live data" : "Sample data"}
            </span>
          </CardHead>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-100 px-5 pt-3">
            <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>📱 Preview</TabBtn>
            <TabBtn active={tab === "fields"} onClick={() => setTab("fields")}>Fields</TabBtn>
            <TabBtn active={tab === "input"} onClick={() => setTab("input")}>Input</TabBtn>
            <TabBtn active={tab === "output"} onClick={() => setTab("output")}>Output</TabBtn>
            {tab === "input" && (
              <button onClick={() => copy(curlExample)} className="ml-auto mb-2 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700">
                {copied ? "✓ Copied" : "Copy cURL"}
              </button>
            )}
            {tab === "output" && (
              <button onClick={() => copy(outputFormat(profileType))} className="ml-auto mb-2 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700">
                {copied ? "✓ Copied" : "Copy"}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden bg-slate-50/40">
            {tab === "preview" && (
              // Phone mockup stays a constant size — never scrolls / never cut off.
              <div className="flex h-full items-start justify-center overflow-hidden p-5">
                <PhonePreview data={active.data} scores={active.confidence_scores} flagged={active.flagged_fields} />
              </div>
            )}
            {tab === "fields" && <FieldsPanel profileType={profileType} />}
            {tab === "input" && (
              <div className="h-full overflow-y-auto p-5">
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-600 px-1.5 py-0.5 font-bold text-white">POST</span>
                    <span className="text-slate-700">/api/extract</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600">
                    <div><span className="text-violet-700">Authorization:</span> Bearer &lt;auth_token&gt;</div>
                    <div><span className="text-violet-700">Content-Type:</span> multipart/form-data</div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <PayloadRow name="file" type="File" desc="PDF · DOCX · JPG · PNG" />
                    <PayloadRow name="profile_type" type='"student" | "professional"' />
                    <PayloadRow name="user_id" type="string" />
                  </div>
                </div>
              </div>
            )}
            {tab === "output" && (
              <div className="flex h-full flex-col gap-3 overflow-auto p-5">
                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span>ℹ️</span>
                  <span>
                    All <code className="font-mono">data</code> fields are <strong>optional</strong> —
                    absent data returns <code className="font-mono">null</code> or{" "}
                    <code className="font-mono">[]</code>.
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-700">
                  {outputFormat(profileType)}
                </pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ── AnurCloud "Review profile" phone mockup ── */

function PhonePreview({
  data,
  scores,
  flagged,
}: {
  data: Record<string, unknown>;
  scores: Record<string, number>;
  flagged: string[];
}) {
  const flaggedSet = new Set(flagged);
  const stateOf = (key: string): "ok" | "flag" | "none" => {
    if (flaggedSet.has(key)) return "flag";
    return typeof scores[key] === "number" ? "ok" : "none";
  };

  const name = asStr(data.full_name) ?? "Your name";
  const title = asStr(data.designation) ?? "Your designation";
  const skills = asArr(data.skills) as string[];
  const SECTIONS = [
    { key: "education", label: "Education" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "internships", label: "Internships" },
    { key: "certifications", label: "Certifications" },
    { key: "publications", label: "Publications" },
  ].filter((s) => asArr(data[s.key]).length > 0);

  return (
    <div className="mx-auto flex min-h-[600px] w-full max-w-[300px] flex-col overflow-hidden rounded-[2.25rem] border-[8px] border-slate-900 bg-white shadow-2xl">
      {/* App bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-4 text-white">
        <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Insta VIZ</div>
        <div className="text-base font-bold">Review your profile</div>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">👤</div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900">{name}</div>
            <div className="truncate text-sm text-slate-500">{title}</div>
          </div>
        </div>

        {/* Contacts */}
        <div className="flex flex-col gap-1.5">
          <ContactRow icon="✉️" value={asStr(data.email)} state={stateOf("email")} />
          <ContactRow icon="☎️" value={asStr(data.phone)} state={stateOf("phone")} />
          <ContactRow icon="📍" value={asStr(data.location)} state={stateOf("location")} />
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <FieldLabel>Skills</FieldLabel>
            <div className="mt-1 flex flex-wrap gap-1">
              {skills.slice(0, 8).map((s, i) => (
                <span key={i} className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  {s}
                </span>
              ))}
              {skills.length > 8 && <span className="px-1 text-[11px] text-slate-400">+{skills.length - 8}</span>}
            </div>
          </div>
        )}

        {/* Sections */}
        {SECTIONS.map((s) => {
          const count = asArr(data[s.key]).length;
          const flag = flaggedSet.has(s.key);
          return (
            <div key={s.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                {count} {count === 1 ? "entry" : "entries"}
                {flag && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">⚠ check</span>}
              </span>
            </div>
          );
        })}

        {/* CTA — pinned to the bottom of the phone */}
        <button type="button" disabled className="mt-auto cursor-default rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 py-2.5 text-sm font-bold text-white opacity-95">
          Looks good →
        </button>
      </div>
    </div>
  );
}

function ContactRow({ icon, value, state }: { icon: string; value: string | null; state: "ok" | "flag" | "none" }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-center text-xs">{icon}</span>
      <span className={`flex-1 truncate ${value ? "text-slate-700" : "text-slate-300"}`}>{value ?? "—"}</span>
      {state === "ok" && <span className="text-emerald-500">✓</span>}
      {state === "flag" && <span className="rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">⚠</span>}
    </div>
  );
}

/* ── Fields tab — documents what we extract for the profile type ── */

function FieldsPanel({ profileType }: { profileType: ProfileType }) {
  const { common, specific } = SCHEMA_GROUPS[profileType];
  const total = common.length + specific.length;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700">
        <span>ℹ️</span>
        <span>
          We automatically extract the <strong>{total} fields</strong> below from the uploaded
          document (resume, scanned doc, or visiting card) — <strong>only when present</strong>.
          Anything not found is returned empty; nothing is mandatory.
        </span>
      </div>

      <FieldGroup
        title="Core fields"
        note="Extracted for every profile"
        fields={common}
      />
      <FieldGroup
        title={profileType === "student" ? "Student fields" : "Professional fields"}
        note={`Additional fields for ${profileType} profiles`}
        fields={specific}
      />
    </div>
  );
}

function FieldGroup({ title, note, fields }: { title: string; note: string; fields: SchemaField[] }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h3>
        <span className="text-[11px] text-slate-400">· {note}</span>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {fields.map((f) => (
          <div key={f.key} className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{f.label}</span>
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TYPE_BADGE[f.type]}`}>
                {TYPE_LABEL[f.type]}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{f.description}</p>
            {f.type === "object[]" && f.fields && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {f.fields.map((s) => (
                  <span key={s.key} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── small shared bits ── */

function PipeStep({ icon, title, sub, tone }: { icon: string; title: string; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    blue: "from-blue-600 to-blue-400",
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

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</span>;
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </label>
  );
}

function SoonRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-2.5 opacity-70">
      <span className="text-base grayscale">{icon}</span>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Soon</span>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-xs font-bold transition-colors ${
        active ? "border-blue-600 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function PayloadRow({ name, type, desc }: { name: string; type: string; desc?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="text-slate-400">{type}</span>
      <span className="rounded bg-red-50 px-1.5 text-[9px] font-bold text-red-600">required</span>
      {desc && <span className="ml-auto text-[10px] text-slate-400">{desc}</span>}
    </div>
  );
}
