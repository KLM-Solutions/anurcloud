"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { ACCEPT_ATTR, PROFILE_TYPES, formatBytes, validateSourceFile } from "@/lib/validation";
import { EXTRACTION_SCHEMA, SCHEMA_GROUPS, type SchemaField } from "@/lib/schema";
import { TEMPLATE_PREFILL, putHandoff } from "@/lib/handoff";
import type { BrandTheme, ExtractResponse, ProfileType } from "@/lib/types";

type Status = "idle" | "uploading" | "done" | "error";
type Tab = "preview" | "fields" | "input" | "output";
type SourceMode = "file" | "url";

/** Images we can read a colour out of. `.ico` is excluded — sharp cannot decode it. */
const LOGO_ACCEPT = ".png,.jpg,.jpeg,.webp,.svg,.avif,.gif,image/png,image/jpeg,image/webp,image/svg+xml";

const BRAND_SOURCE_LABEL: Record<BrandTheme["source"], string> = {
  firecrawl: "Read from the site design",
  "logo-image": "Read from the logo image",
  favicon: "Read from the site icon",
  default: "Default for this profile type",
};

const BRAND_CONFIDENCE_STYLE: Record<BrandTheme["confidence"], string> = {
  high: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-slate-100 text-slate-600 ring-slate-200",
};

const TYPE_LABEL: Record<SchemaField["type"], string> = {
  string: "Text",
  "string[]": "List",
  "object[]": "Records",
};
const TYPE_BADGE: Record<SchemaField["type"], string> = {
  string: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
  "string[]": "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
  "object[]": "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
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

/* Live deployment endpoints AnurCloud calls. */
const ENDPOINT = "https://anurcloud.vercel.app/api/extract";
const URL_ENDPOINT = "https://anurcloud.vercel.app/api/extract-url";

/* Sample resumes (served from /public/samples) — one-click load into the uploader. */
const SAMPLES = [
  { file: "karthick-r.pdf", label: "Karthick R" },
  { file: "subramani-resume.pdf", label: "Subramani" },
];

const asStr = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
/** Only allow http/https URLs as hrefs — blocks javascript:, data:, etc. */
const safeHref = (url: string | null): string | null =>
  url && /^https?:\/\//i.test(url) ? url : null;

const OBJECT_PRIMARY_KEYS = ["title", "name", "role", "degree", "platform", "activity", "type"];

/* Output payload as a TYPE/FORMAT spec (not sample values), per profile type. */
function outputFormat(pt: ProfileType): string {
  const dataLines = EXTRACTION_SCHEMA[pt].flatMap((f) => {
    if (f.type === "string") return [`    "${f.key}": string | null,`];
    if (f.type === "string[]") return [`    "${f.key}": string[],`];
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
    '  "flagged_fields": string[],',
    '  "brand": {',
    '    "primary": string, "accent": string, "palette": string[],',
    '    "logo_url": string | null,',
    '    "fonts": { "heading": string | null, "body": string | null } | null,',
    '    "source": "firecrawl" | "logo-image" | "favicon" | "default",',
    '    "confidence": "high" | "medium" | "low",',
    '    "notes": string | null',
    "  } | null",
    "}",
  ].join("\n");
}

export default function ExtractionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [url, setUrl] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("student");
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_EXTRACT_TOKEN ?? "");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<ExtractResponse | null>(null);
  const [tab, setTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /**
   * To the card step — which runs enhancement itself before suggesting layouts.
   *
   * `brand` travels with it. Without that the card would fall back to the default
   * crimson even though the user just uploaded a logo, which reads as the colour
   * feature being broken rather than skipped.
   *
   * Enhancement is not a separate step here: the card step runs Module 3 itself
   * before suggesting layouts, so this is the single route from extraction to the
   * card (the pipeline is Extract → Review → Enhance → Card).
   */
  function goToTemplate() {
    if (!live) return;
    putHandoff(TEMPLATE_PREFILL, {
      profile_type: live.profile_type,
      profile: live.data,
      brand,
      from: "extraction",
    });
    router.push("/template");
  }

  function switchSourceMode(mode: SourceMode) {
    setSourceMode(mode);
    setError(null);
    setResponse(null);
    setStatus("idle");
  }

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
  const brand: BrandTheme | null =
    response?.status === "success" ? response.brand ?? null : null;

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
    if (sourceMode === "url") {
      const trimmed = url.trim();
      if (!trimmed) return setError("Please paste a URL to extract from.");
      try { new URL(trimmed); } catch { return setError("Please enter a valid URL starting with http:// or https://"); }
      setError(null);
      setStatus("uploading");
      setResponse(null);
      try {
        const res = await fetch("/api/extract-url", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed, profile_type: profileType }),
        });
        const json = (await res.json()) as ExtractResponse;
        setResponse(json);
        setStatus(res.ok ? "done" : "error");
        if (res.ok) setTab("preview");
      } catch (e) {
        setResponse({ status: "error", error: { code: "NETWORK", message: String(e) } });
        setStatus("error");
      }
      return;
    }

    if (!file) return setError("Please choose a PDF, DOCX, JPG, or PNG file.");
    setError(null);
    setStatus("uploading");
    setResponse(null);
    const body = new FormData();
    body.append("file", file);
    body.append("profile_type", profileType);
    // Optional — when present, the brand colours come back read from its pixels.
    if (logo) body.append("logo", logo);
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

  function copy(text: string, key: "input" | "output") {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const curlExample =
    sourceMode === "url"
      ? `curl -X POST ${URL_ENDPOINT} \\\n  -H "Authorization: Bearer <auth_token>" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url":"${url || "https://example.com/profile"}","profile_type":"${profileType}"}'`
      : `curl -X POST ${ENDPOINT} \\\n  -H "Authorization: Bearer <auth_token>" \\\n  -F "file=@resume.pdf" \\\n  -F "profile_type=${profileType}"${logo ? ` \\\n  -F "logo=@${logo.name}"` : ""}`;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Top Nav ── */}
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
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm"
            >
              <span>📄</span> Module 1
            </Link>
            <Link
              href="/template"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <span>🎴</span> Module 3 + 4
              <span className="rounded-full bg-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                Live
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-7 px-5 py-8">
        {/* ── Header ── */}
        <header className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-2xl shadow-md shadow-blue-500/20">
              📄
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Module 01
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  ● Live
                </span>
              </div>
              <h1 className="mt-0.5 bg-gradient-to-r from-slate-900 via-blue-800 to-blue-600 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                Extraction
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500">
                Upload on the left; see exactly what AnurCloud receives on the right — rendered as
                the auto-filled profile screen and as raw JSON.
              </p>
            </div>
          </div>
        </header>

        {/* ── Pipeline strip ── */}
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 shadow-sm">
          <PipeStep icon="📤" title="Input" sub="file + profile_type" tone="blue" />
          <ChevronArrow />
          <PipeStep icon="⚙️" title="PxlBrain AI" sub="OCR + field mapping" tone="violet" />
          <ChevronArrow />
          <PipeStep icon="📦" title="Output" sub="profile + confidence" tone="emerald" />
        </div>

        {/* ── Two equal cards ── */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* LEFT */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
            <CardHead accent="bg-gradient-to-r from-blue-600 to-blue-400" title="Try it live">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-500">
                POST {sourceMode === "url" ? "/api/extract-url" : "/api/extract"}
              </span>
            </CardHead>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
              {/* Profile type */}
              <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                {PROFILE_TYPES.map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => setProfileType(pt)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
                      profileType === pt
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {pt === "student" ? "🎓" : "💼"} {pt}
                  </button>
                ))}
              </div>

              {/* Source */}
              <div className="flex flex-col gap-2.5">
                <Eyebrow>Source</Eyebrow>

                {/* Mode toggle */}
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => switchSourceMode("file")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      sourceMode === "file"
                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    📄 File
                  </button>
                  <button
                    type="button"
                    onClick={() => switchSourceMode("url")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                      sourceMode === "url"
                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🔗 URL
                  </button>
                </div>

                {sourceMode === "file" ? (
                  <>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                        dragOver
                          ? "border-blue-400 bg-blue-50 shadow-inner"
                          : "border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/30"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 text-xl">
                        📄
                      </div>
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
                            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">
                            Drop a file or click to browse
                          </p>
                          <p className="text-xs text-slate-400">PDF · DOCX · JPG · PNG · up to 10 MB</p>
                        </>
                      )}
                      <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT_ATTR}
                        className="hidden"
                        onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">Try a sample:</span>
                      {SAMPLES.map((s) => (
                        <button
                          key={s.file}
                          type="button"
                          onClick={() => loadSample(s)}
                          disabled={loadingSample !== null}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
                        >
                          📄 {loadingSample === s.file ? "Loading…" : s.label}
                        </button>
                      ))}
                    </div>

                    {/* Optional logo — drives the card's brand colours. */}
                    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Logo <span className="font-normal text-slate-400">— optional</span>
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
                          sets the card colours
                        </span>
                      </div>
                      {logo ? (
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(logo)}
                            alt=""
                            className="h-9 w-9 rounded-lg bg-white object-contain p-1 ring-1 ring-slate-200"
                          />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                            {logo.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setLogo(null);
                              if (logoRef.current) logoRef.current.value = "";
                            }}
                            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500 transition-colors hover:bg-red-100 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => logoRef.current?.click()}
                          className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-700"
                        >
                          🎨 Add a logo — PNG · JPG · SVG · WebP
                        </button>
                      )}
                      <input
                        ref={logoRef}
                        type="file"
                        accept={LOGO_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                          setResponse(null);
                          setStatus("idle");
                          setLogo(e.target.files?.[0] ?? null);
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <p className="text-xs text-slate-400">
                      Crawls up to 25 pages automatically — achievements, projects, and sub-pages included.
                      The site&rsquo;s brand colours and logo come back too.
                    </p>
                  </div>
                )}
              </div>

              {/* Auth */}
              <Labeled label="Bearer token">
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your access token"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm shadow-sm outline-none placeholder:font-sans placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </Labeled>

              {error && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    !
                  </span>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={onSubmit}
                disabled={status === "uploading"}
                className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:shadow-blue-500/40 hover:opacity-95 disabled:opacity-60"
              >
                {status === "uploading" ? (
                  <>
                    <LoadingSpinner />
                    {sourceMode === "url" ? "Crawling site & extracting…" : "Extracting…"}
                  </>
                ) : (
                  <>
                    Run extraction
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </>
                )}
              </button>

              {response?.status === "error" && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <strong>{response.error.code}</strong> — {response.error.message}
                </div>
              )}

              {/* Brand theme — colours + logo for the card templates */}
              {brand && <BrandPanel brand={brand} />}

              {/* Extracted fields */}
              <div className="flex flex-1 flex-col border-t border-slate-100 pt-4">
                <Eyebrow>Extracted fields</Eyebrow>
                {live ? (
                  <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    {EXTRACTION_SCHEMA[live.profile_type].map((f) => {
                      const value = live.data[f.key];
                      const score = live.confidence_scores[f.key];
                      const flagged = live.flagged_fields.includes(f.key);
                      const empty =
                        value == null ||
                        value === "" ||
                        (Array.isArray(value) && value.length === 0);
                      const strChips: string[] =
                        f.type === "string[]" ? (asArr(value) as string[]) : [];
                      const objChips: { label: string; href: string | null }[] =
                        f.type === "object[]"
                          ? (asArr(value) as Record<string, unknown>[])
                              .map((item) => ({
                                label:
                                  OBJECT_PRIMARY_KEYS.map((k) => asStr(item[k])).find(Boolean) ?? "",
                                href: safeHref(asStr(item.url) ?? asStr(item.link)),
                              }))
                              .filter((c) => c.label)
                          : [];
                      const hasChips = strChips.length > 0 || objChips.length > 0;
                      return (
                        <div
                          key={f.key}
                          className={`flex gap-3 px-3 py-2.5 text-sm ${!empty && hasChips ? "items-start" : "items-center"}`}
                        >
                          <span className="w-32 shrink-0 truncate text-xs font-medium text-slate-400">
                            {f.label}
                          </span>
                          <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                            {empty ? (
                              <span className="text-slate-300">—</span>
                            ) : strChips.length ? (
                              strChips.map((chip, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                >
                                  {chip}
                                </span>
                              ))
                            ) : objChips.length ? (
                              objChips.map((chip, i) =>
                                chip.href ? (
                                  <a
                                    key={i}
                                    href={chip.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    {chip.label}
                                    <span className="text-[9px] opacity-50">↗</span>
                                  </a>
                                ) : (
                                  <span
                                    key={i}
                                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                                  >
                                    {chip.label}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-slate-800">{asStr(value)}</span>
                            )}
                          </div>
                          {typeof score === "number" && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                flagged
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                              }`}
                            >
                              {flagged ? "⚠" : "✓"} {score.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 text-2xl">
                      📦
                    </div>
                    <p className="text-xs text-slate-400">
                      Run an extraction to see each field and its confidence score here.
                    </p>
                  </div>
                )}
              </div>

              {/* One next step: enhancement + card suggestion, combined. */}
              {live && (
                <>
                  <button
                    type="button"
                    onClick={goToTemplate}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:shadow-emerald-500/40 hover:opacity-95"
                  >
                    🎴 Enhance &amp; suggest cards
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </button>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Runs enhancement and suggests the best-fitting layouts — the pipeline is
                    Extract → Enhance → Card.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* RIGHT */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[740px]">
            <CardHead accent="bg-gradient-to-r from-emerald-600 to-emerald-400" title="Integration">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                  live
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                {live ? "● Live data" : "Sample data"}
              </span>
            </CardHead>

            {/* Tabs */}
            <div className="flex items-center gap-0.5 border-b border-slate-100 px-4 pt-3">
              <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>
                📱 Preview
              </TabBtn>
              <TabBtn active={tab === "fields"} onClick={() => setTab("fields")}>
                Fields
              </TabBtn>
              <TabBtn active={tab === "input"} onClick={() => setTab("input")}>
                Input
              </TabBtn>
              <TabBtn active={tab === "output"} onClick={() => setTab("output")}>
                Output
              </TabBtn>
              {tab === "input" && (
                <button
                  onClick={() => copy(curlExample, "input")}
                  className="ml-auto mb-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                >
                  {copied === "input" ? "✓ Copied" : "Copy cURL"}
                </button>
              )}
              {tab === "output" && (
                <button
                  onClick={() => copy(outputFormat(profileType), "output")}
                  className="ml-auto mb-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                >
                  {copied === "output" ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-hidden bg-slate-50/50">
              {tab === "preview" && (
                <div className="flex h-full items-start justify-center overflow-hidden p-5">
                  <PhonePreview
                    data={active.data}
                    scores={active.confidence_scores}
                    flagged={active.flagged_fields}
                  />
                </div>
              )}
              {tab === "fields" && <FieldsPanel profileType={profileType} />}
              {tab === "input" && (
                <div className="h-full overflow-y-auto p-5">
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-600 px-2 py-0.5 font-bold text-white shadow-sm">
                        POST
                      </span>
                      <span className="break-all text-slate-700">
                        {sourceMode === "url" ? URL_ENDPOINT : ENDPOINT}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-600 shadow-sm">
                      <div>
                        <span className="text-violet-600">Authorization:</span> Bearer &lt;auth_token&gt;
                      </div>
                      <div>
                        <span className="text-violet-600">Content-Type:</span>{" "}
                        {sourceMode === "url" ? "application/json" : "multipart/form-data"}
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {sourceMode === "url" ? (
                        <>
                          <PayloadRow name="url" type="string" desc="public profile / portfolio" />
                          <PayloadRow name="profile_type" type='"student" | "professional"' />
                        </>
                      ) : (
                        <>
                          <PayloadRow name="file" type="File" desc="PDF · DOCX · JPG · PNG" />
                          <PayloadRow name="profile_type" type='"student" | "professional"' />
                        </>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5 font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Example request
                      </div>
                      <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-[11px] leading-relaxed text-slate-100 shadow-sm">
                        {curlExample}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              {tab === "output" && (
                <div className="flex h-full flex-col gap-3 overflow-auto p-5">
                  <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-700">
                    <span>ℹ️</span>
                    <span>
                      All <code className="font-mono">data</code> fields are{" "}
                      <strong>optional</strong> — absent data returns{" "}
                      <code className="font-mono">null</code> or{" "}
                      <code className="font-mono">[]</code>.
                    </span>
                  </div>
                  <pre className="overflow-x-auto whitespace-pre rounded-xl border border-slate-200 bg-white p-4 font-mono text-[11px] leading-relaxed text-slate-700 shadow-sm">
                    {outputFormat(profileType)}
                  </pre>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* ── Phone mockup ── */

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
  const summary = asStr(data.summary);
  const skills = asArr(data.skills) as string[];
  const languages = asArr(data.languages) as string[];
  const socialLinks = asArr(data.social_links) as Record<string, unknown>[];
  const education = asArr(data.education) as Record<string, unknown>[];
  const experience = asArr(data.experience) as Record<string, unknown>[];
  const projects = asArr(data.projects) as Record<string, unknown>[];
  const internships = asArr(data.internships) as Record<string, unknown>[];
  const certifications = asArr(data.certifications) as Record<string, unknown>[];
  const achievements = asArr(data.achievements) as Record<string, unknown>[];
  const publications = asArr(data.publications) as Record<string, unknown>[];

  return (
    <div className="mx-auto flex h-[620px] w-full max-w-[300px] flex-col overflow-hidden rounded-[2.25rem] border-[8px] border-slate-800 bg-white shadow-2xl">
      {/* App bar */}
      <div className="shrink-0 bg-gradient-to-r from-blue-700 to-blue-500 px-5 py-4 text-white">
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Insta VIZ</div>
        <div className="text-base font-bold">Review your profile</div>
      </div>

      {/* Scrollable content */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-2xl shadow-sm">
            👤
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-slate-900">{name}</div>
            <div className="truncate text-sm text-slate-500">{title}</div>
          </div>
        </div>

        {summary && (
          <div>
            <PhoneSectionLabel>About</PhoneSectionLabel>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{summary}</p>
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("skills")}>Skills</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {skills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("languages")}>Languages</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {languages.map((l, i) => (
                <span
                  key={i}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("education")}>Education</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {education.map((e, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">
                    {[asStr(e.degree), asStr(e.field)].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-[10px] text-slate-500">{asStr(e.institution)}</div>
                  <div className="text-[10px] text-slate-400">
                    {[asStr(e.year), asStr(e.grade)].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("experience")}>Experience</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {experience.map((e, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">{asStr(e.role)}</div>
                  <div className="text-[10px] text-slate-500">{asStr(e.company)}</div>
                  <div className="text-[10px] text-slate-400">
                    {[asStr(e.duration), asStr(e.location)].filter(Boolean).join(" · ")}
                  </div>
                  {(asArr(e.highlights) as string[]).slice(0, 2).map((h, j) => (
                    <div key={j} className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                      · {h}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("projects")}>Projects</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {projects.map((p, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">{asStr(p.title)}</div>
                  {asStr(p.description) && (
                    <div className="text-[10px] text-slate-500">{asStr(p.description)}</div>
                  )}
                  {(asArr(p.technologies) as string[]).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(asArr(p.technologies) as string[]).map((t, j) => (
                        <span
                          key={j}
                          className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {internships.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("internships")}>Internships</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {internships.map((e, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">{asStr(e.role)}</div>
                  <div className="text-[10px] text-slate-500">{asStr(e.organization)}</div>
                  <div className="text-[10px] text-slate-400">{asStr(e.duration)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("certifications")}>
              Certifications
            </PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {certifications.map((c, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">{asStr(c.name)}</div>
                  <div className="text-[10px] text-slate-400">
                    {[asStr(c.issuer), asStr(c.year)].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {achievements.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("achievements")}>Achievements</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {achievements.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <span className="text-[11px] font-medium text-slate-700">{asStr(a.title)}</span>
                  {asStr(a.year) && (
                    <span className="text-[10px] text-slate-400">{asStr(a.year)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {publications.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("publications")}>
              Publications
            </PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-2">
              {publications.map((p, i) => (
                <div key={i} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800">{asStr(p.title)}</div>
                  <div className="text-[10px] text-slate-400">
                    {[asStr(p.venue), asStr(p.year)].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {socialLinks.length > 0 && (
          <div>
            <PhoneSectionLabel flagged={flaggedSet.has("social_links")}>Links</PhoneSectionLabel>
            <div className="mt-1.5 flex flex-col gap-1">
              {socialLinks.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="w-20 shrink-0 font-medium text-slate-500">
                    {asStr(l.platform)}
                  </span>
                  {safeHref(asStr(l.url)) ? (
                    <a
                      href={safeHref(asStr(l.url))!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-blue-600 hover:underline"
                    >
                      {asStr(l.url)}
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacts */}
        <div>
          <PhoneSectionLabel>Contact</PhoneSectionLabel>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <ContactRow icon="✉️" value={asStr(data.email)} state={stateOf("email")} />
            <ContactRow icon="☎️" value={asStr(data.phone)} state={stateOf("phone")} />
            <ContactRow icon="📍" value={asStr(data.location)} state={stateOf("location")} />
          </div>
        </div>

        <button
          type="button"
          disabled
          className="cursor-default rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 py-2.5 text-sm font-bold text-white shadow-md opacity-95"
        >
          Looks good →
        </button>
      </div>
    </div>
  );
}

function PhoneSectionLabel({ children, flagged }: { children: ReactNode; flagged?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {children}
      </span>
      {flagged && (
        <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-600">
          ⚠
        </span>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  value,
  state,
}: {
  icon: string;
  value: string | null;
  state: "ok" | "flag" | "none";
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-center text-xs">{icon}</span>
      <span className={`flex-1 truncate ${value ? "text-slate-700" : "text-slate-300"}`}>
        {value ?? "—"}
      </span>
      {state === "ok" && <span className="text-emerald-500">✓</span>}
      {state === "flag" && (
        <span className="rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">⚠</span>
      )}
    </div>
  );
}

/* ── Fields tab ── */

/**
 * Brand theme result — the colours (and logo) the card templates will use.
 *
 * Shows where the theme came from and how confident we are, because the value is
 * only as trustworthy as its source: colours read from a site's design are strong,
 * a profile default means we found nothing usable.
 */
function BrandPanel({ brand }: { brand: BrandTheme }) {
  const [logoBroken, setLogoBroken] = useState(false);
  const swatches = brand.palette.length
    ? brand.palette
    : [brand.primary, brand.accent].filter((c): c is string => Boolean(c));

  /*
   * Route remote logos through our own origin. A logo URL found on someone else's
   * site is not always loadable by a browser — tcs.com answers a direct image
   * request with 403 (hotlink protection), which renders as a broken image.
   * `data:` URIs are already inline, so they go straight to the tag.
   */
  const logoSrc = brand.logo_url
    ? brand.logo_url.startsWith("data:")
      ? brand.logo_url
      : `/api/logo?src=${encodeURIComponent(brand.logo_url)}`
    : null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow>Brand theme</Eyebrow>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${
            BRAND_CONFIDENCE_STYLE[brand.confidence]
          }`}
        >
          {brand.confidence} confidence
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          {logoSrc &&
            (logoBroken ? (
              // Say why it's missing rather than showing a broken-image icon.
              <span
                title={brand.logo_url ?? undefined}
                className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-50 text-center text-[8px] font-semibold leading-tight text-slate-400 ring-1 ring-slate-200"
              >
                logo
                <br />
                blocked
              </span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoSrc}
                alt=""
                onError={() => setLogoBroken(true)}
                className="h-11 w-11 shrink-0 rounded-lg bg-slate-50 object-contain p-1 ring-1 ring-slate-200"
              />
            ))}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-slate-900/10"
                style={{ background: brand.primary ?? "transparent" }}
              />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {brand.primary ?? "—"}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  primary
                </span>
              </div>
              <span
                className="ml-2 h-8 w-8 shrink-0 rounded-lg ring-1 ring-slate-900/10"
                style={{ background: brand.accent ?? "transparent" }}
              />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {brand.accent ?? "—"}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  accent
                </span>
              </div>
            </div>
          </div>
        </div>

        {swatches.length > 2 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Full palette
            </span>
            <div className="flex flex-wrap gap-1.5">
              {swatches.map((hex) => (
                <span
                  key={hex}
                  title={hex}
                  className="h-6 w-6 rounded-md ring-1 ring-slate-900/10"
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* A card header gradient is derived from primary, so preview it here. */}
        {brand.primary && (
          <div
            className="flex h-12 items-center justify-center rounded-lg text-[11px] font-semibold tracking-wide text-white"
            style={{
              background: `linear-gradient(135deg, ${brand.primary}, ${brand.accent ?? brand.primary})`,
            }}
          >
            card header preview
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">{BRAND_SOURCE_LABEL[brand.source]}</span>
          {brand.fonts?.heading && (
            <span>
              heading <span className="font-medium text-slate-600">{brand.fonts.heading}</span>
            </span>
          )}
          {brand.fonts?.body && (
            <span>
              body <span className="font-medium text-slate-600">{brand.fonts.body}</span>
            </span>
          )}
        </div>

        {brand.notes && (
          <p className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800 ring-1 ring-amber-100">
            {brand.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function FieldsPanel({ profileType }: { profileType: ProfileType }) {
  const { common, specific } = SCHEMA_GROUPS[profileType];
  const total = common.length + specific.length;
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5 text-xs leading-relaxed text-blue-700">
        <span>ℹ️</span>
        <span>
          We automatically extract the <strong>{total} fields</strong> below from the uploaded
          document — <strong>only when present</strong>. Nothing is mandatory.
        </span>
      </div>

      <FieldGroup title="Core fields" note="Extracted for every profile" fields={common} />
      <FieldGroup
        title={profileType === "student" ? "Student fields" : "Professional fields"}
        note={`Additional fields for ${profileType} profiles`}
        fields={specific}
      />
    </div>
  );
}

function FieldGroup({
  title,
  note,
  fields,
}: {
  title: string;
  note: string;
  fields: SchemaField[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
        <span className="text-[11px] text-slate-400">· {note}</span>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {fields.map((f) => (
          <div key={f.key} className="px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{f.label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TYPE_BADGE[f.type]}`}>
                {TYPE_LABEL[f.type]}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{f.description}</p>
            {f.type === "object[]" && f.fields && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {f.fields.map((s) => (
                  <span
                    key={s.key}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500"
                  >
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

/* ── Shared small components ── */

function ChevronArrow() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
      →
    </span>
  );
}

function PipeStep({
  icon,
  title,
  sub,
  tone,
}: {
  icon: string;
  title: string;
  sub: string;
  tone: string;
}) {
  const tones: Record<string, string> = {
    blue: "from-blue-600 to-blue-400",
    violet: "from-violet-600 to-violet-400",
    emerald: "from-emerald-600 to-emerald-400",
    slate: "from-slate-500 to-slate-400",
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]} text-lg shadow-sm`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold text-slate-800">{title}</div>
        <div className="text-[10px] text-slate-400">{sub}</div>
      </div>
    </div>
  );
}

function CardHead({
  accent,
  title,
  children,
}: {
  accent: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className={`h-1 w-full ${accent}`} />
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</div>
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </span>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </label>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function PayloadRow({
  name,
  type,
  desc,
}: {
  name: string;
  type: string;
  desc?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-b-0">
      <span className="font-semibold text-slate-800">{name}</span>
      <span className="text-slate-400">{type}</span>
      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 ring-1 ring-red-100">
        required
      </span>
      {desc && <span className="ml-auto text-[10px] text-slate-400">{desc}</span>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white/70"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
