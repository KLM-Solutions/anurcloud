"use client";

/**
 * DEV-ONLY card playground — NOT part of the product / not shown in production.
 *
 * One dynamic card viewer for Anur Cloud + our own QA: switch template at the
 * top, toggle any field on/off, and dial each list's item count up or down, then
 * watch a single card re-render live. Lets us see exactly how a card looks when a
 * field is MISSING and when a field is HEAVY. Uses the real rendering path
 * (`/api/template`) with dummy data from `lib/dev-dummy-profiles.ts`.
 *
 * The controls live only on this page — the rendered card itself carries none of
 * them. In production these choices are made automatically from the real profile.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXTRACTION_SCHEMA } from "@/lib/schema";
import { DUMMY } from "@/lib/dev-dummy-profiles";
import type { ProfileType } from "@/lib/types";
import { profileToCard } from "@/lib/profile-to-card";
import { brandToTheme } from "@/lib/brand-to-theme";
import { TEMPLATE_PREFILL, takeHandoff, type TemplateHandoff } from "@/lib/handoff";
import type { BrandTheme } from "@/lib/types";
import { SkillMeters } from "@/components/cards/SkillMeters";
import { SplitHalves } from "@/components/cards/SplitHalves";
import { Overlap } from "@/components/cards/Overlap";
import { Numbered } from "@/components/cards/Numbered";
import { FolderTab } from "@/components/cards/FolderTab";
import { StatStrip } from "@/components/cards/StatStrip";
import { RoleLadder } from "@/components/cards/RoleLadder";
import { Letterhead } from "@/components/cards/Letterhead";
import { EdgeSpine } from "@/components/cards/EdgeSpine";
import { PullQuote } from "@/components/cards/PullQuote";
import { Badge } from "@/components/cards/Badge";
import { Spotlight } from "@/components/cards/Spotlight";
import { SideRail } from "@/components/cards/SideRail";
import { HeroSplit } from "@/components/cards/HeroSplit";
import { CentrePortrait } from "@/components/cards/CentrePortrait";
import { Timeline } from "@/components/cards/Timeline";
import { TileGrid } from "@/components/cards/TileGrid";
import { TicketStub } from "@/components/cards/TicketStub";
import { CornerWedge } from "@/components/cards/CornerWedge";
import { MonogramBlock } from "@/components/cards/MonogramBlock";
import { IndexLedger } from "@/components/cards/IndexLedger";
import { ColumnFlow } from "@/components/cards/ColumnFlow";
import type { CardProfile, ThemeOptions } from "@/templates/types";

/** Templates delivered as React (TSX) components render live, not via the API. */
const REACT_CARDS: Record<string, (p: CardProfile, theme?: ThemeOptions) => React.ReactNode> = {
  "side-rail": (p, theme) => <SideRail profile={p} theme={theme} />,
  "hero-split": (p, theme) => <HeroSplit profile={p} theme={theme} />,
  "centre-portrait": (p, theme) => <CentrePortrait profile={p} theme={theme} />,
  "timeline": (p, theme) => <Timeline profile={p} theme={theme} />,
  "tile-grid": (p, theme) => <TileGrid profile={p} theme={theme} />,
  "ticket-stub": (p, theme) => <TicketStub profile={p} theme={theme} />,
  "corner-wedge": (p, theme) => <CornerWedge profile={p} theme={theme} />,
  "monogram-block": (p, theme) => <MonogramBlock profile={p} theme={theme} />,
  "index-ledger": (p, theme) => <IndexLedger profile={p} theme={theme} />,
  "column-flow": (p, theme) => <ColumnFlow profile={p} theme={theme} />,
  "skill-meters": (p, theme) => <SkillMeters profile={p} theme={theme} />,
  "split-halves": (p, theme) => <SplitHalves profile={p} theme={theme} />,
  "overlap": (p, theme) => <Overlap profile={p} theme={theme} />,
  "numbered": (p, theme) => <Numbered profile={p} theme={theme} />,
  "folder-tab": (p, theme) => <FolderTab profile={p} theme={theme} />,
  "stat-strip": (p, theme) => <StatStrip profile={p} theme={theme} />,
  "role-ladder": (p, theme) => <RoleLadder profile={p} theme={theme} />,
  "letterhead": (p, theme) => <Letterhead profile={p} theme={theme} />,
  "edge-spine": (p, theme) => <EdgeSpine profile={p} theme={theme} />,
  "pull-quote": (p, theme) => <PullQuote profile={p} theme={theme} />,
  "badge": (p, theme) => <Badge profile={p} theme={theme} />,
  "spotlight": (p, theme) => <Spotlight profile={p} theme={theme} />,
};

type Elig = { id: number; key: string; name: string; eligible: boolean; reason: string | null };

/** Repeat/trim a list to exactly n items, suffixing extras so they stay distinct. */
function expandList(list: unknown[], n: number): unknown[] {
  if (n <= list.length) return list.slice(0, n);
  const out: unknown[] = [];
  const SUFFIXABLE = ["title", "name", "role", "degree", "activity", "type", "platform"];
  for (let i = 0; i < n; i += 1) {
    const base = list[i % list.length];
    const copy = Math.floor(i / list.length);
    if (copy === 0) {
      out.push(base);
    } else if (typeof base === "string") {
      out.push(`${base} ${copy + 1}`);
    } else if (base && typeof base === "object") {
      const o = { ...(base as Record<string, unknown>) };
      const key = SUFFIXABLE.find((k) => typeof o[k] === "string");
      if (key) o[key] = `${o[key]} ${copy + 1}`;
      out.push(o);
    } else {
      out.push(base);
    }
  }
  return out;
}

/** Default toggles for a source: a field is ON when the source actually has it,
 *  and each list's count starts at how many items the source holds. Works for the
 *  dummy profile (all fields present) and for a real extracted profile (only the
 *  fields it carries turn on). */
function defaultsFor(t: ProfileType, src: Record<string, unknown> = DUMMY[t]) {
  const include: Record<string, boolean> = {};
  const counts: Record<string, number> = {};
  for (const f of EXTRACTION_SCHEMA[t]) {
    const v = src[f.key];
    if (f.type === "string") {
      include[f.key] = typeof v === "string" && v.trim().length > 0;
    } else {
      const arr = Array.isArray(v) ? v : [];
      include[f.key] = arr.length > 0;
      counts[f.key] = arr.length;
    }
  }
  return { include, counts };
}

export default function PlaygroundPage() {
  const [type, setType] = useState<ProfileType>("professional");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [include, setInclude] = useState<Record<string, boolean>>(() => defaultsFor("professional").include);
  const [counts, setCounts] = useState<Record<string, number>>(() => defaultsFor("professional").counts);
  const [eligibility, setEligibility] = useState<Elig[]>([]);
  const [note, setNote] = useState<string | null>(null);

  /* A real extracted profile handed over by the pipeline (Extraction / Enhance →
     /template → redirects here). When set, the playground shows THIS profile
     instead of the dummy; a direct visit leaves it null and uses the dummy. */
  const [source, setSource] = useState<Record<string, unknown> | null>(null);
  const [enhancedBio, setEnhancedBio] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandTheme | null>(null);
  /* LLM-ranked shortlist from /api/template. In flow mode the user can pick any of
     these; `pickedKey` overrides the default (top suggestion). */
  const [suggested, setSuggested] = useState<{ key: string; name: string; reasons?: string[] }[]>([]);
  const [pickedKey, setPickedKey] = useState<string | null>(null);

  const took = useRef(false);
  useEffect(() => {
    if (took.current) return;
    took.current = true;
    const h = takeHandoff<TemplateHandoff>(TEMPLATE_PREFILL);
    if (!h || !h.profile) return;
    const t = h.profile_type === "student" ? "student" : "professional";
    const d = defaultsFor(t, h.profile);
    // One-shot sessionStorage handoff — only available after mount. Same justified
    // pattern as app/template/your-card.tsx; the useRef latch keeps the destructive
    // read idempotent under StrictMode's double mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setType(t);
    setSource(h.profile);
    setInclude(d.include);
    setCounts(d.counts);
    setEnhancedBio(h.enhanced?.bio ?? null);
    setBrand(h.brand ?? null);
    setTemplateId(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  /* The logo/brand → card theme. Only applies when a logo actually yielded a
     usable colour; otherwise the card keeps its per-template default. */
  const theme = useMemo(() => (brand ? brandToTheme(brand).theme : undefined), [brand]);

  const token = process.env.NEXT_PUBLIC_EXTRACT_TOKEN ?? "";
  const fields = EXTRACTION_SCHEMA[type];

  /* Switch profile type and reset toggles together. Switching type is a dev action
     that drops back to the dummy for that type (the extracted profile has a fixed
     type). */
  const changeType = useCallback((t: ProfileType) => {
    const d = defaultsFor(t);
    setType(t);
    setSource(null);
    setEnhancedBio(null);
    setBrand(null);
    setInclude(d.include);
    setCounts(d.counts);
    setTemplateId(null); // pick first eligible after the next fetch
  }, []);

  /* Build the profile object from the current toggles + counts, off the real
     extracted profile when present, otherwise the dummy. */
  const profile = useMemo(() => {
    const src = source ?? DUMMY[type];
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      if (!include[f.key]) continue;
      const v = src[f.key];
      if (f.type === "string") {
        out[f.key] = v;
      } else if (Array.isArray(v)) {
        const n = counts[f.key] ?? v.length;
        if (n > 0) out[f.key] = expandList(v, n);
      }
    }
    return out;
  }, [type, fields, include, counts, source]);

  /* The effective template: the one selected, or — when nothing is selected — the
     first eligible one, so a dynamic card always shows without a click. */
  const effectiveId = useMemo(
    () => templateId ?? eligibility.find((e) => e.eligible)?.id ?? null,
    [templateId, eligibility],
  );
  const selectedKey = useMemo(
    () => eligibility.find((e) => e.id === effectiveId)?.key ?? null,
    [eligibility, effectiveId],
  );
  /* Every template is a React component now, so this always resolves once
     eligibility has loaded. */
  const reactRender = selectedKey ? REACT_CARDS[selectedKey] : undefined;

  /* Build the CardProfile the component renders from (no API needed). The enhanced
     bio from the pipeline wins over the profile's own summary when present. */
  const cardProfile = useMemo(
    () => profileToCard({ profile, profile_type: type, enhanced: { bio: enhancedBio ?? (profile.summary as string) ?? null } }),
    [profile, type, enhancedBio],
  );

  /* Fetch eligibility whenever the profile changes (light debounce). The cards are
     React components rendered client-side; the API is only asked which templates
     this profile can fill, to drive the template buttons + the default pick. */
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/template", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profile, profile_type: type, enhanced: { bio: profile.summary ?? null } }),
        });
        const data = await res.json();
        if (Array.isArray(data.eligibility)) {
          setEligibility(data.eligibility);
          setNote(data.eligibility.some((e: Elig) => e.eligible) ? null : "No template fits — toggle more fields on.");
        }
        // The LLM-ranked shortlist — drives the single suggested card in flow mode.
        if (Array.isArray(data.suggested)) setSuggested(data.suggested);
      } catch (err) {
        setNote(err instanceof Error ? err.message : "Request failed.");
      }
    }, 150);
    return () => clearTimeout(t);
  }, [profile, type, token]);

  /* Flow-mode card is scaled up to fill the space (the card is authored at 380×537;
     here we enlarge it responsively to the viewport). Dev mode keeps 380px. */
  const [flowScale, setFlowScale] = useState(1);
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      const target = Math.min(560, Math.max(320, w - 48)); // comfortable reading width
      setFlowScale(Math.min(1.6, Math.max(0.9, target / 380)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /* ── Flow mode: arrived from the pipeline → show the suggested shortlist; the
     user can pick any of the suggested cards (default: the top one). ── */
  if (source) {
    const activeKey = pickedKey ?? suggested[0]?.key ?? selectedKey; // first eligible until the shortlist lands
    const active = suggested.find((s) => s.key === activeKey) ?? suggested[0];
    const render = activeKey ? REACT_CARDS[activeKey] : undefined;
    // Any eligible template beyond the top 3 — so the user isn't locked to the suggestions.
    const suggestedKeys = new Set(suggested.map((s) => s.key));
    const others = eligibility.filter((e) => e.eligible && !suggestedKeys.has(e.key));
    return (
      <main className="flex min-h-screen flex-col items-center gap-4 bg-slate-100 p-6">
        <div className="flex w-full max-w-md items-center justify-between">
          <a href="/extraction" className="text-xs font-semibold text-slate-500 transition hover:text-slate-700">
            ‹ Start over
          </a>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Suggested for you
          </span>
        </div>

        {/* Pick any of the suggested cards. */}
        {suggested.length > 0 && (
          <div className="flex max-w-md flex-wrap justify-center gap-2">
            {suggested.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setPickedKey(s.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                  s.key === activeKey
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                }`}
              >
                {i === 0 && <span className="mr-1 opacity-70">★</span>}
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Any other eligible layout — user can pick beyond the suggestions. */}
        {others.length > 0 && (
          <details className="w-full max-w-md">
            <summary className="cursor-pointer list-none text-center text-[11px] font-semibold text-slate-400 transition hover:text-slate-600">
              Other layouts ({others.length}) ▾
            </summary>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {others.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => setPickedKey(e.key)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                    e.key === activeKey
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          </details>
        )}

        <div className="w-fit rounded-2xl bg-slate-200/70 p-4 sm:p-5">
          {render ? (
            <div style={{ width: 380 * flowScale, height: 537 * flowScale }}>
              <div
                style={{ width: 380, height: 537, transform: `scale(${flowScale})`, transformOrigin: "top left" }}
              >
                {render(cardProfile, theme)}
              </div>
            </div>
          ) : (
            <div className="w-[380px] py-20 text-center text-xs font-semibold text-slate-400">Preparing your card…</div>
          )}
        </div>

        {active?.reasons && active.reasons.length > 0 && (
          <ul className="max-w-md list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-500">
            {active.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* DEV banner */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-2">
          <div className="text-sm font-bold text-amber-900">
            Card Playground — DEV / QA only
          </div>
          <div className="text-[11px] font-semibold">
            {source ? (
              <span className="text-emerald-700">● Showing extracted profile</span>
            ) : (
              <span className="text-amber-700">Sample data · these controls never render on the card itself</span>
            )}
          </div>
        </div>

        {/* Top bar: profile type + template switcher */}
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Profile</span>
            {(["student", "professional"] as const).map((t) => (
              <button
                key={t}
                onClick={() => changeType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  type === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="mr-1 self-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Template</span>
            {eligibility.map((e) => (
              <button
                key={e.key}
                onClick={() => e.eligible && setTemplateId(e.id)}
                disabled={!e.eligible}
                title={e.reason ?? ""}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                  effectiveId === e.id
                    ? "border-emerald-500 bg-emerald-600 text-white"
                    : e.eligible
                      ? "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                }`}
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          {/* Controls */}
          <div className="min-w-[280px] flex-1 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Fields — toggle on/off, set how many
            </div>
            <div className="flex flex-col gap-1">
              {fields.map((f) => {
                const isList = f.type !== "string";
                const on = include[f.key] ?? false;
                return (
                  <div key={f.key} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-slate-50">
                    <label className="flex flex-1 items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setInclude((s) => ({ ...s, [f.key]: e.target.checked }))}
                      />
                      <span className={on ? "font-semibold text-slate-700" : "text-slate-400"}>
                        {f.label}
                      </span>
                    </label>
                    {isList && on && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCounts((s) => ({ ...s, [f.key]: Math.max(0, (s[f.key] ?? 0) - 1) }))}
                          className="h-5 w-5 rounded bg-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-300"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-700">{counts[f.key] ?? 0}</span>
                        <button
                          onClick={() => setCounts((s) => ({ ...s, [f.key]: (s[f.key] ?? 0) + 1 }))}
                          className="h-5 w-5 rounded bg-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-300"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live card */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-fit rounded-2xl bg-slate-200/70 p-5">
              {reactRender ? (
                <div className="w-[380px]">{reactRender(cardProfile, theme)}</div>
              ) : (
                <div className="w-[380px] py-20 text-center text-xs font-semibold text-slate-400">
                  {note ?? "Rendering…"}
                </div>
              )}
            </div>
            {reactRender && (
              <span className="text-[11px] font-semibold text-emerald-600">React component (TSX) — live</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
