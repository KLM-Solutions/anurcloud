"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { takeHandoff, TEMPLATE_PREFILL, type TemplateHandoff } from "@/lib/handoff";
import type { TemplateResponse, TemplateSuccess } from "@/lib/template-types";

/**
 * "Your card" — the live end of the pipeline.
 *
 * Everything else on this page is a gallery rendered at build time from sample
 * profiles. This panel is the real thing: it picks up the profile handed over by
 * Module 1 or Module 3, asks /api/template which layouts that person can fill,
 * and renders the one the user picks with the colours derived from their logo.
 *
 * Renders nothing but a prompt when there is no handoff — arriving at /template
 * directly is a legitimate way to browse the set.
 *
 * ── Enhancement runs first, always ─────────────────────────────────────────
 * The product pipeline is Extract → Review → Enhance → Template, and the card
 * step is where that is enforced (owner's call, 11 Aug 2026). Enhancement used to
 * be optional and skippable, which had a visible cost once the recommender
 * landed: Pull Quote requires a summary, so a profile that skipped Module 3 could
 * never be suggested the layout built around one, and every card's bio block came
 * out empty.
 *
 * This panel is the right place for the gate rather than the extraction page,
 * because it is the single choke point — every route into the card step passes
 * through here, so the chain cannot be bypassed by arriving from somewhere else.
 * A handoff that already carries an `enhanced` bio (the user walked through
 * Module 3 themselves) is not re-enhanced; there is nothing to gain from a second
 * OpenAI call over the same profile.
 */

/**
 * `unsupported` is deliberately not `error`.
 *
 * It covers the API's `status: "received"` — the profile validated but its
 * audience has no built cards. Both pools are complete now, so it should be
 * unreachable; it is kept because reporting that case as a failure would send
 * the reader hunting for a bug that isn't there.
 *
 * `enhancing` is the first half of the two-step chain described above.
 */
type Phase = "boot" | "empty" | "enhancing" | "loading" | "ready" | "unsupported" | "error";

/**
 * What happened when enhancement ran, so the panel can be honest about it.
 *
 * `ran: false` is deliberately NOT an error state. The enhancement engine
 * degrades on purpose — a missing `OPENAI_API_KEY` returns a validation-only stub
 * rather than failing — and refusing to show anyone their card because OpenAI is
 * unreachable would be a worse product than showing it without a written bio.
 * The card step says which happened instead of hiding it.
 */
type EnhanceOutcome =
  | { ran: true; bio: string | null; source: "just now" | "module 3" }
  | { ran: false; reason: string };

export default function YourCard() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [handoff, setHandoff] = useState<TemplateHandoff | null>(null);
  const [enhance, setEnhance] = useState<EnhanceOutcome | null>(null);
  const [result, setResult] = useState<TemplateSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_EXTRACT_TOKEN ?? "");
  const [selected, setSelected] = useState<number | null>(null);
  const [rendering, setRendering] = useState(false);

  /** Rendered HTML per template id — a card already fetched is never refetched. */
  const cardCache = useRef<Map<number, string>>(new Map());
  const [html, setHtml] = useState<string | null>(null);
  /** The card stage, read on Download so the PDF matches the shown card exactly. */
  const printRef = useRef<HTMLDivElement>(null);

  const call = useCallback(
    async (payload: TemplateHandoff, template?: number): Promise<TemplateResponse> => {
      const res = await fetch("/api/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_type: payload.profile_type,
          profile: payload.profile,
          enhanced: payload.enhanced ?? null,
          brand: payload.brand ?? null,
          ...(template !== undefined ? { template } : {}),
        }),
      });
      return (await res.json()) as TemplateResponse;
    },
    [token],
  );

  /**
   * Step 1 of the chain: write the bio with Module 3.
   *
   * Never throws and never rejects — every failure path returns `ran: false` with
   * a reason, because a card must still be produced when enhancement cannot run.
   * The engine's own `status: "received"` (no API key configured) lands here too,
   * and is reported as "did not run", not as "failed": nothing broke, it simply
   * is not switched on.
   */
  const runEnhance = useCallback(
    async (payload: TemplateHandoff): Promise<EnhanceOutcome> => {
      try {
        const res = await fetch("/api/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            profile: payload.profile,
            profile_type: payload.profile_type,
          }),
        });
        const data = (await res.json()) as
          | { status: "success"; bio?: string | null }
          | { status: "received"; message?: string }
          | { status: "error"; error?: { message?: string } };

        if (data.status === "success") {
          return { ran: true, bio: data.bio ?? null, source: "just now" };
        }
        if (data.status === "received") {
          return {
            ran: false,
            reason: data.message ?? "The enhancement engine is not configured on this deployment.",
          };
        }
        return { ran: false, reason: data.error?.message ?? "Enhancement could not be completed." };
      } catch (err) {
        return {
          ran: false,
          reason: err instanceof Error ? err.message : "The enhancement service could not be reached.",
        };
      }
    },
    [token],
  );

  /**
   * Render one card. Cached, so flipping between layouts is instant.
   *
   * Takes the profile explicitly rather than reading it from state: the first
   * card is rendered during the same run that fetched the shortlist, before
   * `handoff` state has landed.
   */
  const render = useCallback(
    async (payload: TemplateHandoff, id: number) => {
      setSelected(id);
      const cached = cardCache.current.get(id);
      if (cached) {
        setHtml(cached);
        return;
      }
      setRendering(true);
      setError(null);
      try {
        const data = await call(payload, id);
        if (data.status === "success" && data.html) {
          cardCache.current.set(id, data.html);
          setHtml(data.html);
        } else if (data.status === "error") {
          setError(data.error.message);
          setHtml(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "The card could not be rendered.");
        setHtml(null);
      } finally {
        setRendering(false);
      }
    },
    [call],
  );

  /**
   * Guards the destructive read below against StrictMode's double mount.
   *
   * `takeHandoff` deletes the prefill as it reads it. In development React runs
   * a mount effect twice (mount → cleanup → mount), so without this ref the
   * second run finds an empty sessionStorage and drops the panel to "empty" —
   * while the first run's fetch, already in flight, has its result discarded.
   * The visible symptom was one request in the server log and a page still
   * inviting you to upload a resume. A once-only read has to be idempotent.
   */
  const started = useRef(false);

  /* Pick up the handoff once, on mount.
   *
   * eslint-disable below covers the synchronous setState calls. They have to
   * stay here: sessionStorage is browser-only and this route is prerendered, so
   * reading it in a lazy useState initialiser would produce different markup
   * than the prerendered HTML — a hydration mismatch, which is a real bug where
   * one extra render on mount is not. */
  /* eslint-disable react-hooks/set-state-in-effect -- justified above */
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const incoming = takeHandoff<TemplateHandoff>(TEMPLATE_PREFILL);
    if (!incoming || !incoming.profile || !incoming.profile_type) {
      setPhase("empty");
      return;
    }
    setHandoff(incoming);
    setPhase(incoming.enhanced?.bio ? "loading" : "enhancing");

    /*
     * No cancellation flag here, deliberately.
     *
     * StrictMode's cleanup fires between the two mounts, so a `cancelled` guard
     * would throw away the only request we make — the handoff is already gone
     * from sessionStorage and cannot be re-read. If the user navigates away
     * mid-flight these setState calls land on an unmounted component, which
     * React 19 ignores silently; that is the cheaper of the two failures.
     */
    void (async () => {
      try {
        /*
         * Step 1 — enhancement. Mandatory in the sense that it always runs; not
         * mandatory in the sense of blocking, because it can be unconfigured.
         *
         * `effective` is what every later call uses. The bio has to be threaded
         * into the profile sent to /api/template, or the suggestion is computed
         * against a profile with no summary and Pull Quote is silently dropped
         * from a shortlist it should be leading.
         */
        let effective = incoming;
        if (incoming.enhanced?.bio) {
          setEnhance({ ran: true, bio: incoming.enhanced.bio, source: "module 3" });
        } else {
          const outcome = await runEnhance(incoming);
          setEnhance(outcome);
          if (outcome.ran && outcome.bio) {
            effective = { ...incoming, enhanced: { bio: outcome.bio } };
            setHandoff(effective);
          }
        }

        // Step 2 — the shortlist, computed against the enhanced profile.
        setPhase("loading");
        const data = await call(effective);
        if (data.status === "error") {
          setError(data.error.message);
          setPhase("error");
          return;
        }
        if (data.status === "received") {
          setPhase("unsupported");
          return;
        }
        setResult(data);
        setPhase("ready");
        // Show the TOP SUGGESTION straight away, not the first card in catalogue
        // order — the user asked for their card, not for a menu, and the whole
        // point of the recommender is that the first thing they see is the one
        // that suits them. The rest stay one click away.
        const first = data.suggested[0] ?? data.offered[0];
        if (first) await render(effective, first.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "The template service could not be reached.");
        setPhase("error");
      }
    })();
    // Deliberately mount-only: the handoff is consumed on read, so re-running
    // this after a token change would find nothing and wipe the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /** Click handler — the profile is in state by the time any button exists. */
  const choose = useCallback(
    (id: number) => {
      if (handoff) void render(handoff, id);
    },
    [handoff, render],
  );

  /**
   * Download the SHOWN card as a PDF, entirely in the browser — no server, no
   * library. Opens a print window containing only the card (self-contained: its
   * scoped styles and theme vars travel with the markup), sizes each sheet to the
   * card so one card-page prints per sheet, and triggers the browser's native
   * "Save as PDF". The output matches the on-screen card exactly.
   */
  const downloadPdf = useCallback(() => {
    if (!html) return;
    const cardEl = printRef.current?.querySelector<HTMLElement>("[data-iv-template]");
    const width = cardEl?.offsetWidth || 380;
    const pageH =
      (cardEl && parseFloat(getComputedStyle(cardEl).getPropertyValue("--iv-page-h"))) || 537;
    const name = cardEl?.getAttribute("data-iv-template") ?? "card";
    const title = `insta-viz-${name}`;

    const win = window.open("", "_blank", "width=520,height=780");
    if (!win) {
      window.alert("Please allow pop-ups for this site to download the PDF.");
      return;
    }
    // Each .iv-page becomes one sheet; the card's screen border/shadow is dropped
    // because each sheet IS the page. Mirrors scripts/build-pdf.mts.
    win.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>` +
        `@page{size:${width}px ${pageH}px;margin:0}` +
        `html,body{margin:0;padding:0;background:#fff}` +
        `.iv-pdf{width:${width}px}` +
        `.iv-pdf>[data-iv-template]{border:none!important;box-shadow:none!important;border-radius:0!important}` +
        `.iv-pdf .iv-page{break-after:page}` +
        `.iv-pdf .iv-page:last-child{break-after:auto}` +
        `</style></head><body><div class="iv-pdf">${html}</div></body></html>`,
    );
    win.document.close();
    win.focus();
    // Let fonts, gradients and container queries settle before the print dialog.
    win.setTimeout(() => win.print(), 400);
  }, [html]);

  if (phase === "boot") return null;

  if (phase === "empty") {
    return (
      <section className="pt-10">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-8 text-center">
          <div className="text-sm font-bold text-slate-800">See a real resume as a card</div>
          <p className="max-w-md text-xs leading-relaxed text-slate-500">
            Upload a resume and a logo in Module 1, then press{" "}
            <span className="font-semibold text-slate-700">Enhance &amp; suggest cards</span> on
            the result. Enhancement runs automatically, then this panel shows the three layouts
            that suit that person, in their own brand colours.
          </p>
          <Link
            href="/extraction"
            className="rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition hover:opacity-95"
          >
            📄 Start at Module 1 →
          </Link>
        </div>
      </section>
    );
  }

  const name =
    (handoff?.profile?.full_name as string | undefined) ??
    (handoff?.profile?.name as string | undefined) ??
    "this profile";

  return (
    <section className="pt-10">
      {/* Deliberately a quiet container: a heavy border here competes with the
          card and makes the panel look like the product. The card is the product. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex flex-wrap items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Live · from Module {handoff?.from === "enhance" ? "3" : "1"}
          </span>
          <span className="text-lg font-black text-slate-900">Your card</span>
          {/* Stamped in every state: which audience a profile is decides whether any
              card exists at all, and reading that off a server log is no way to
              debug a page. */}
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {handoff?.profile_type ?? "unknown"}
          </span>
        </div>
        {/* The colour claim has to match what actually happened. This said
            "themed from the logo you uploaded" unconditionally, which was wrong
            on every run without a logo — and sat directly above a badge reading
            "default". */}
        <p className="mb-5 text-xs leading-relaxed text-slate-500">
          Real output for <span className="font-semibold text-slate-700">{name}</span>
          {result?.theme.brand_applied
            ? ", themed from the logo you uploaded"
            : ", in the default colour — no logo or website was supplied"}
          . Enhancement runs first, then the layouts are ranked. Not a sample.
        </p>

        {/* The chain is shown as two steps, because step 1 is an AI call and
            takes a few seconds — an unlabelled spinner for that long reads as a
            hang rather than as work. */}
        {(phase === "enhancing" || phase === "loading") && (
          <div className="flex flex-col gap-2 py-5">
            <Step
              n={1}
              label="Writing the bio with Module 3"
              state={phase === "enhancing" ? "running" : "done"}
            />
            <Step
              n={2}
              label="Working out which layouts suit this profile"
              state={phase === "loading" ? "running" : "waiting"}
            />
          </div>
        )}

        {phase === "unsupported" && (
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
            <div className="text-sm font-black text-amber-900">
              This is a{" "}
              <span className="rounded bg-amber-200 px-1.5 py-0.5">
                {handoff?.profile_type}
              </span>{" "}
              profile — no cards built for it yet
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              The API reported that no cards are built for this audience. Both pools are
              complete — 10 student and 10 professional — so this should not happen; if you
              are seeing it, the profile type reaching the API is not one of those two.
              Nothing went wrong with the extraction itself.
            </p>
            <Link
              href="/extraction"
              className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-700"
            >
              Re-run in Module 1 →
            </Link>
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-xs font-bold text-rose-800">Could not build the shortlist</div>
            <p className="mt-1 text-xs leading-relaxed text-rose-700">{error}</p>
            {!token && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Bearer token"
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 font-mono text-[11px] text-slate-700 outline-none focus:border-rose-400"
                />
                <span className="text-[11px] text-rose-600">
                  No token is configured for this browser — paste one to retry.
                </span>
              </div>
            )}
          </div>
        )}

        {phase === "ready" && result && (
          <>
            {/* ── What the engine worked out ── */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Pill label="Data level" value={result.data_level} />
              <Pill label="Cards that fit" value={`${result.offered.length} of ${result.eligibility.length}`} />
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Colour
                </span>
                <span
                  className="h-4 w-4 rounded-full ring-1 ring-slate-300"
                  style={{ background: result.theme.primary ?? "#be123c" }}
                />
                <span className="font-mono text-[11px] text-slate-600">
                  {result.theme.primary}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    result.theme.brand_applied
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {result.theme.brand_applied ? "from your logo" : "default"}
                </span>
              </div>
            </div>

            {!result.theme.brand_applied && result.theme.reason && (
              <p className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
                {result.theme.reason}
              </p>
            )}

            {/* What enhancement did, stated either way. A bio that quietly failed
                to be written changes which layouts are suggested, so hiding the
                outcome would make the shortlist look arbitrary. */}
            {enhance?.ran === true && (
              <div className="mb-5 rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  Module 3 · enhanced {enhance.source === "just now" ? "automatically" : "by you"}
                </div>
                {enhance.bio && (
                  <p className="mt-1 text-[11px] leading-relaxed text-violet-900">
                    &ldquo;{enhance.bio}&rdquo;
                  </p>
                )}
              </div>
            )}
            {enhance?.ran === false && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Enhancement did not run
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                  {enhance.reason} The cards below use the summary from the CV instead, and any
                  layout that needs a written bio is left out of the shortlist.
                </p>
              </div>
            )}

            {/* ── Pick a layout ── */}
            {result.offered.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
                None of the built cards can be filled by this profile yet. Add a few more
                fields in Module 1 — an education line, some skills, or contact details — and
                come back.
              </div>
            ) : (
              <>
                {/* ── The recommendation ──
                    Three, ranked, each explained. This is the whole point of the
                    panel: a rich profile can fill nearly every layout, so a row
                    of ten equal buttons is a catalogue, not a suggestion. */}
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-black text-slate-800">
                    Suggested for this profile
                  </span>
                  <span className="text-[11px] text-slate-400">
                    picked from the {result.offered.length} that fit
                  </span>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  {result.suggested.map((s) => {
                    const isSelected = selected === s.id;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => choose(s.id)}
                        className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                            {s.rank}
                          </span>
                          <span className="text-xs font-black text-slate-900">{s.name}</span>
                        </span>
                        <TierChip tier={s.tier} />
                        <ul className="flex flex-col gap-1">
                          {s.reasons.slice(0, 2).map((r) => (
                            <li key={r} className="text-[10px] leading-snug text-slate-500">
                              {r}
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                            showing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* The rest, demoted to a quiet row. Still reachable — the
                    recommendation is a shortcut, not a restriction. */}
                {result.offered.length > result.suggested.length && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-700">
                      Or pick from the other{" "}
                      {result.offered.length - result.suggested.length} that fit
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.offered
                        .filter((t) => !result.suggested.some((s) => s.id === t.id))
                        .map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => choose(t.id)}
                            className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
                              selected === t.id
                                ? "border-emerald-500 bg-emerald-600 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                    </div>
                  </details>
                )}

                <div className="flex flex-wrap items-start gap-6">
                  {/*
                    The card sits on its own tinted "stage" sized to the card, not
                    stretched to the panel. Without this the card was one small
                    white box inside a much larger white panel, and the panel read
                    as the card — all the surrounding gap looked like card padding
                    (client feedback, 11 Aug 2026).
                  */}
                  <div className="flex w-fit flex-col items-center gap-3">
                    <div
                      ref={printRef}
                      className="w-fit rounded-2xl bg-slate-100/80 p-5 ring-1 ring-slate-200/70"
                    >
                      {rendering && (
                        <div className="w-[380px] py-16 text-center text-xs font-semibold text-slate-400">
                          Rendering…
                        </div>
                      )}
                      {!rendering && html && <RenderedCard html={html} />}
                    </div>
                    {!rendering && html && (
                      <button
                        type="button"
                        onClick={downloadPdf}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <span aria-hidden="true">⬇</span> Download PDF
                      </button>
                    )}
                  </div>

                  {/*
                    All five layouts, passing and failing alike.
                    Listing only the failures left this column empty whenever a
                    profile filled everything — which is exactly the rich profile
                    we most want to demo, so the panel looked half-built.
                  */}
                  <div className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      All {result.eligibility.length} layouts
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {result.eligibility.map((e) => {
                        const isSelected = result.offered.some(
                          (o) => o.key === e.key && o.id === selected,
                        );
                        return (
                          <li key={e.key} className="flex gap-2 text-[11px] leading-relaxed">
                            <span
                              className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                e.eligible
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {e.eligible ? "✓" : "✕"}
                            </span>
                            <span className="min-w-0">
                              <span
                                className={`font-bold ${
                                  isSelected ? "text-emerald-700" : "text-slate-700"
                                }`}
                              >
                                {e.name}
                              </span>
                              {isSelected && (
                                <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                                  showing
                                </span>
                              )}
                              {!e.eligible && (
                                <span className="block text-slate-500">{e.reason}</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <p className="mt-5 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
              Ranked on what this profile actually contains — how much content there is, and
              which layouts that amount suits. Deliberately{" "}
              <strong className="font-semibold text-slate-500">no percentage match</strong>: there
              is no way to measure how well a layout suits a person, so a number like &ldquo;94%
              fit&rdquo; would be invented precision. The order and the reasons are real; the
              user still chooses.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

/** One step of the two-step chain, so a multi-second AI call reads as progress. */
function Step({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: "running" | "done" | "waiting";
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {state === "running" ? (
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      ) : (
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
            state === "done" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-400"
          }`}
        >
          {state === "done" ? "✓" : n}
        </span>
      )}
      <span
        className={
          state === "waiting" ? "text-slate-400" : "font-semibold text-slate-600"
        }
      >
        {label}
        {state === "running" && "…"}
      </span>
    </div>
  );
}

/**
 * The coarse fit band.
 *
 * Three values, no number. A percentage here would be the same dishonesty the
 * page used to carry ("TMP-101 · 94%") — see the note at the top of
 * `templates/rank.ts`.
 */
function TierChip({ tier }: { tier: "strong" | "good" | "possible" }) {
  const style: Record<string, string> = {
    strong: "bg-emerald-100 text-emerald-700",
    good: "bg-sky-100 text-sky-700",
    possible: "bg-slate-200 text-slate-600",
  };
  const label: Record<string, string> = {
    strong: "strong fit",
    good: "good fit",
    possible: "workable",
  };
  return (
    <span
      className={`w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${style[tier]}`}
    >
      {label[tier]}
    </span>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

/**
 * Renders engine output.
 *
 * Unlike the gallery below, this HTML is built from a profile the user supplied,
 * so it is untrusted input on its way through our own renderer. That renderer is
 * what makes this safe: every interpolated value passes through `esc()`/`attr()`
 * and every href/src through `safeUrl()`, so no profile field can close a tag or
 * carry a `javascript:` scheme. Returning an HTML string is the engine's
 * contract — AnurCloud embeds it in their own front end the same way.
 */
function RenderedCard({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
