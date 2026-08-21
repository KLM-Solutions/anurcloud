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

import { useCallback, useEffect, useMemo, useState } from "react";
import { EXTRACTION_SCHEMA } from "@/lib/schema";
import { DUMMY } from "@/lib/dev-dummy-profiles";
import type { ProfileType } from "@/lib/types";
import { profileToCard } from "@/lib/profile-to-card";
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
import type { CardProfile } from "@/templates/types";

/** Templates delivered as React (TSX) components render live, not via the API. */
const REACT_CARDS: Record<string, (p: CardProfile) => React.ReactNode> = {
  "side-rail": (p) => <SideRail profile={p} />,
  "hero-split": (p) => <HeroSplit profile={p} />,
  "centre-portrait": (p) => <CentrePortrait profile={p} />,
  "timeline": (p) => <Timeline profile={p} />,
  "tile-grid": (p) => <TileGrid profile={p} />,
  "ticket-stub": (p) => <TicketStub profile={p} />,
  "corner-wedge": (p) => <CornerWedge profile={p} />,
  "monogram-block": (p) => <MonogramBlock profile={p} />,
  "index-ledger": (p) => <IndexLedger profile={p} />,
  "column-flow": (p) => <ColumnFlow profile={p} />,
  "skill-meters": (p) => <SkillMeters profile={p} />,
  "split-halves": (p) => <SplitHalves profile={p} />,
  "overlap": (p) => <Overlap profile={p} />,
  "numbered": (p) => <Numbered profile={p} />,
  "folder-tab": (p) => <FolderTab profile={p} />,
  "stat-strip": (p) => <StatStrip profile={p} />,
  "role-ladder": (p) => <RoleLadder profile={p} />,
  "letterhead": (p) => <Letterhead profile={p} />,
  "edge-spine": (p) => <EdgeSpine profile={p} />,
  "pull-quote": (p) => <PullQuote profile={p} />,
  "badge": (p) => <Badge profile={p} />,
  "spotlight": (p) => <Spotlight profile={p} />,
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

/** Default toggles for a type: every field on, list counts at their dummy length. */
function defaultsFor(t: ProfileType) {
  const include: Record<string, boolean> = {};
  const counts: Record<string, number> = {};
  for (const f of EXTRACTION_SCHEMA[t]) {
    include[f.key] = true;
    if (f.type !== "string") {
      const v = DUMMY[t][f.key];
      counts[f.key] = Array.isArray(v) ? v.length : 0;
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

  const token = process.env.NEXT_PUBLIC_EXTRACT_TOKEN ?? "";
  const fields = EXTRACTION_SCHEMA[type];

  /* Switch profile type and reset toggles together — no setState-in-effect. */
  const changeType = useCallback((t: ProfileType) => {
    const d = defaultsFor(t);
    setType(t);
    setInclude(d.include);
    setCounts(d.counts);
    setTemplateId(null); // pick first eligible after the next fetch
  }, []);

  /* Build the profile object from the current toggles + counts. */
  const profile = useMemo(() => {
    const src = DUMMY[type];
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
  }, [type, fields, include, counts]);

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

  /* Build the CardProfile the component renders from (no API needed). */
  const cardProfile = useMemo(
    () => profileToCard({ profile, profile_type: type, enhanced: { bio: (profile.summary as string) ?? null } }),
    [profile, type],
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
      } catch (err) {
        setNote(err instanceof Error ? err.message : "Request failed.");
      }
    }, 150);
    return () => clearTimeout(t);
  }, [profile, type, token]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* DEV banner */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-2">
          <div className="text-sm font-bold text-amber-900">
            Card Playground — DEV / QA only
          </div>
          <div className="text-[11px] text-amber-700">
            Not shown in production · these controls never render on the card itself
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
                <div className="w-[380px]">{reactRender(cardProfile)}</div>
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
