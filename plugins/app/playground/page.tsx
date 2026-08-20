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
  const [html, setHtml] = useState<string | null>(null);
  const [pages, setPages] = useState<number | null>(null);
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

  /* Re-render the card on any change (light debounce). */
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/template", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            profile,
            profile_type: type,
            enhanced: { bio: profile.summary ?? null },
            ...(templateId !== null ? { template: templateId } : {}),
          }),
        });
        const data = await res.json();
        if (Array.isArray(data.eligibility)) setEligibility(data.eligibility);

        // First load / type change: auto-pick the first eligible template.
        if (templateId === null && Array.isArray(data.eligibility)) {
          const first = data.eligibility.find((e: Elig) => e.eligible);
          if (first) {
            setTemplateId(first.id);
            return; // state change re-runs this effect with a template
          }
        }

        if (data.status === "success" && typeof data.html === "string") {
          setHtml(data.html);
          setPages(typeof data.pages === "number" ? data.pages : null);
          setNote(null);
        } else if (data.status === "error") {
          setHtml(null);
          setNote(data.error?.message ?? "This template can't render with the current fields.");
        } else {
          setHtml(null);
          setNote("Not enough content for this template — toggle more fields on.");
        }
      } catch (err) {
        setHtml(null);
        setNote(err instanceof Error ? err.message : "Request failed.");
      }
    }, 150);
    return () => clearTimeout(t);
  }, [profile, type, templateId, token]);

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
                  templateId === e.id
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
              {html ? (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <div className="w-[380px] py-20 text-center text-xs font-semibold text-slate-400">
                  {note ?? "Rendering…"}
                </div>
              )}
            </div>
            {html && pages !== null && (
              <span className="text-[11px] font-semibold text-slate-500">{pages} page{pages === 1 ? "" : "s"}</span>
            )}
            {html && note && <div className="text-[11px] text-amber-600">{note}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
