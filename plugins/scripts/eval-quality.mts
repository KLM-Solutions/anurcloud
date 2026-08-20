/**
 * Quality eval harness for the two LLM jobs (enhancement + card-picking).
 *
 *   npm run eval                 # run against the configured model, autolabelled
 *   npm run eval -- --label qwen # run and save results as qwen.json
 *   npm run eval -- --compare gpt-4.1 qwen   # diff two saved runs (before/after)
 *
 * A `run` executes the REAL production flow on every golden profile:
 *   enhance → build CardProfile (bio threaded in) → card-pick
 * then scores both outputs deterministically (scripts/eval/score.mts) and writes
 * eval-results/<label>.json. Point the env at GPT-4.1, run; point it at Qwen,
 * run; then `--compare` the two — that side-by-side IS the "before/after check"
 * the compute/quality notes keep asking for and which never existed until now.
 *
 * The model is whatever the env selects (see lib/llm-chat.ts): set
 * LOCAL_LLM_BASE_URL + LOCAL_LLM_MODEL for Qwen/Ollama, or OPENAI_API_KEY for
 * GPT-4.1. With neither set, enhancement uses its grounded fallback and
 * card-picking uses the rules — useful only to self-test the harness offline.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { enhanceProfile } from "@/lib/enhance-engine";
import { suggestTemplatesLLM } from "@/lib/suggest-llm";
import { profileToCard } from "@/lib/profile-to-card";
import { offerableTemplates } from "@/templates";
import { MODEL, isLocalLLM } from "@/lib/llm-chat";
import type { EnhanceRequest } from "@/lib/enhance-types";

import { GOLDEN } from "./eval/golden";
import {
  scoreBio,
  scorePicks,
  flattenProfileText,
  type BioScore,
  type PickScore,
} from "./eval/score";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "eval-results");

interface CaseResult {
  id: string;
  profile_type: string;
  notes: string;
  bio: string;
  bioScore: BioScore;
  pickScore: PickScore;
  latencyMs: number;
  error?: string;
}

interface RunResult {
  label: string;
  model: string;
  isLocal: boolean;
  timestamp: string;
  cases: CaseResult[];
  summary: {
    bioChecksPassed: number;
    bioChecksTotal: number;
    pickChecksPassed: number;
    pickChecksTotal: number;
    groundingFailures: number; // cases whose bio invented a fact
    errors: number;
    avgLatencyMs: number;
  };
}

/* ── run mode ─────────────────────────────────────────────────────────────── */

async function run(label: string): Promise<void> {
  if (!isLocalLLM() && !process.env.OPENAI_API_KEY) {
    console.warn(
      "⚠  No model configured (no LOCAL_LLM_BASE_URL, no OPENAI_API_KEY).\n" +
        "   Enhancement will use its grounded fallback and picking the rules.\n" +
        "   This only self-tests the harness — it does not measure a model.\n",
    );
  }

  console.log(`▶ eval run "${label}"  ·  model: ${MODEL}${isLocalLLM() ? " (local)" : ""}\n`);

  const cases: CaseResult[] = [];
  for (const g of GOLDEN) {
    const started = Date.now();
    let bio = "";
    let bioScore: BioScore;
    let pickScore: PickScore;
    let error: string | undefined;

    try {
      const enhanced = await enhanceProfile({
        profile: g.profile as EnhanceRequest["profile"],
        profile_type: g.profile_type,
      });
      bio = enhanced.bio;

      const card = profileToCard({
        profile: g.profile,
        profile_type: g.profile_type,
        enhanced,
      });
      const picks = await suggestTemplatesLLM(card);
      const eligibleIds = new Set(offerableTemplates(card).map((t) => t.id));

      const profileText = flattenProfileText(g.profile);
      bioScore = scoreBio(bio, profileText);
      pickScore = scorePicks(picks, eligibleIds);
    } catch (err) {
      error = (err as Error).message;
      bioScore = scoreBio(bio, flattenProfileText(g.profile));
      pickScore = scorePicks([], new Set());
    }

    const latencyMs = Date.now() - started;
    cases.push({
      id: g.id,
      profile_type: g.profile_type,
      notes: g.notes,
      bio,
      bioScore,
      pickScore,
      latencyMs,
      error,
    });

    printCaseLine(cases[cases.length - 1]);
  }

  const result: RunResult = {
    label,
    model: MODEL,
    isLocal: isLocalLLM(),
    timestamp: new Date().toISOString(),
    cases,
    summary: summarize(cases),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `${safe(label)}.json`);
  writeFileSync(file, JSON.stringify(result, null, 2));

  printSummary(result);
  console.log(`\n✔ saved → eval-results/${safe(label)}.json`);
}

function summarize(cases: CaseResult[]): RunResult["summary"] {
  const sum = (f: (c: CaseResult) => number) => cases.reduce((a, c) => a + f(c), 0);
  return {
    bioChecksPassed: sum((c) => c.bioScore.passed),
    bioChecksTotal: sum((c) => c.bioScore.total),
    pickChecksPassed: sum((c) => c.pickScore.passed),
    pickChecksTotal: sum((c) => c.pickScore.total),
    groundingFailures: cases.filter((c) => c.bioScore.ungrounded.length > 0).length,
    errors: cases.filter((c) => c.error).length,
    avgLatencyMs: Math.round(sum((c) => c.latencyMs) / Math.max(cases.length, 1)),
  };
}

/* ── console output ───────────────────────────────────────────────────────── */

function printCaseLine(c: CaseResult): void {
  const bio = `bio ${c.bioScore.passed}/${c.bioScore.total}`;
  const pick = `pick ${c.pickScore.passed}/${c.pickScore.total}`;
  const flags: string[] = [];
  if (c.bioScore.ungrounded.length) flags.push(`⚠ invented: ${c.bioScore.ungrounded.join(", ")}`);
  if (c.error) flags.push(`✖ ${c.error}`);
  console.log(`  ${c.id.padEnd(22)} ${bio}   ${pick}   ${flags.join("  ") || "✓"}`);
}

function printSummary(r: RunResult): void {
  const s = r.summary;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  console.log("\n─── summary ───────────────────────────────");
  console.log(`  bio checks   ${s.bioChecksPassed}/${s.bioChecksTotal}  (${pct(s.bioChecksPassed, s.bioChecksTotal)}%)`);
  console.log(`  pick checks  ${s.pickChecksPassed}/${s.pickChecksTotal}  (${pct(s.pickChecksPassed, s.pickChecksTotal)}%)`);
  console.log(`  grounding failures  ${s.groundingFailures}/${r.cases.length}  (bios that invented a fact)`);
  console.log(`  errors              ${s.errors}/${r.cases.length}`);
  console.log(`  avg latency         ${s.avgLatencyMs} ms`);
}

/* ── compare mode ─────────────────────────────────────────────────────────── */

function loadRun(label: string): RunResult {
  const file = join(OUT_DIR, `${safe(label)}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as RunResult;
}

function compare(labelA: string, labelB: string): void {
  const a = loadRun(labelA);
  const b = loadRun(labelB);
  const pct = (x: number, y: number) => (y ? Math.round((x / y) * 100) : 0);

  const lines: string[] = [];
  lines.push(`# Quality eval — ${a.label} vs ${b.label}`);
  lines.push("");
  lines.push(`- **${a.label}** · model \`${a.model}\`${a.isLocal ? " (local)" : ""} · ${a.timestamp}`);
  lines.push(`- **${b.label}** · model \`${b.model}\`${b.isLocal ? " (local)" : ""} · ${b.timestamp}`);
  lines.push("");
  lines.push("## Aggregate");
  lines.push("");
  lines.push(`| Metric | ${a.label} | ${b.label} |`);
  lines.push("|---|---|---|");
  lines.push(`| Bio checks | ${pct(a.summary.bioChecksPassed, a.summary.bioChecksTotal)}% | ${pct(b.summary.bioChecksPassed, b.summary.bioChecksTotal)}% |`);
  lines.push(`| Pick checks | ${pct(a.summary.pickChecksPassed, a.summary.pickChecksTotal)}% | ${pct(b.summary.pickChecksPassed, b.summary.pickChecksTotal)}% |`);
  lines.push(`| Grounding failures | ${a.summary.groundingFailures}/${a.cases.length} | ${b.summary.groundingFailures}/${b.cases.length} |`);
  lines.push(`| Errors | ${a.summary.errors} | ${b.summary.errors} |`);
  lines.push(`| Avg latency | ${a.summary.avgLatencyMs} ms | ${b.summary.avgLatencyMs} ms |`);
  lines.push("");

  const byId = new Map(b.cases.map((c) => [c.id, c]));
  lines.push("## Per profile");
  for (const ca of a.cases) {
    const cb = byId.get(ca.id);
    lines.push("");
    lines.push(`### ${ca.id}`);
    lines.push("");
    lines.push(`| | ${a.label} | ${b.label} |`);
    lines.push("|---|---|---|");
    lines.push(`| bio checks | ${ca.bioScore.passed}/${ca.bioScore.total} | ${cb ? `${cb.bioScore.passed}/${cb.bioScore.total}` : "—"} |`);
    lines.push(`| invented | ${ca.bioScore.ungrounded.join(", ") || "none"} | ${cb ? cb.bioScore.ungrounded.join(", ") || "none" : "—"} |`);
    lines.push(`| pick checks | ${ca.pickScore.passed}/${ca.pickScore.total} | ${cb ? `${cb.pickScore.passed}/${cb.pickScore.total}` : "—"} |`);
    lines.push("");
    lines.push(`- **${a.label} bio:** ${ca.bio || "_(none)_"}`);
    lines.push(`- **${b.label} bio:** ${cb?.bio || "_(none)_"}`);
  }

  const md = lines.join("\n");
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `compare-${safe(labelA)}-vs-${safe(labelB)}.md`);
  writeFileSync(file, md);
  console.log(md);
  console.log(`\n✔ saved → eval-results/compare-${safe(labelA)}-vs-${safe(labelB)}.md`);
}

/* ── cli ──────────────────────────────────────────────────────────────────── */

function safe(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]/g, "-");
}

function defaultLabel(): string {
  return safe(isLocalLLM() ? MODEL : "gpt-4.1");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const cmpIdx = argv.indexOf("--compare");
  if (cmpIdx !== -1) {
    const a = argv[cmpIdx + 1];
    const b = argv[cmpIdx + 2];
    if (!a || !b) {
      console.error("usage: npm run eval -- --compare <labelA> <labelB>");
      process.exit(1);
    }
    compare(a, b);
    return;
  }

  const labelIdx = argv.indexOf("--label");
  const label = labelIdx !== -1 && argv[labelIdx + 1] ? argv[labelIdx + 1] : defaultLabel();
  await run(label);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
