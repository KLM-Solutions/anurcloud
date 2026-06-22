/**
 * Extraction engine client wrapper — Module 1 (server-only).
 *
 * Uploads a file, runs schema-driven extraction against the per-profile-type
 * schema (from lib/schema.ts), and maps the result onto our ExtractedProfile
 * contract + confidence_scores + flagged_fields.
 */

import LlamaCloud from "@llamaindex/llama-cloud";
import { EXTRACTION_SCHEMA, toJsonSchema } from "@/lib/schema";
import type { ConfidenceScores, ExtractedProfile, ProfileType } from "@/lib/types";

/** Fields with combined confidence below this are flagged for manual review. */
const _rawThreshold = parseFloat(process.env.EXTRACT_FLAG_THRESHOLD ?? "");
const FLAG_THRESHOLD =
  Number.isFinite(_rawThreshold) && _rawThreshold > 0 && _rawThreshold <= 1
    ? _rawThreshold
    : 0.7;

let cached: LlamaCloud | null = null;
function getClient(): LlamaCloud {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) throw new Error("LLAMA_CLOUD_API_KEY is not set.");
  cached ??= new LlamaCloud({ apiKey });
  return cached;
}

export interface ExtractionResult {
  data: ExtractedProfile;
  confidence_scores: ConfidenceScores;
  flagged_fields: string[];
}

export async function extractProfile(
  file: File,
  profileType: ProfileType,
): Promise<ExtractionResult> {
  const client = getClient();

  // 1. Upload the file (PDF/DOCX/JPG/PNG — images are OCR'd).
  const uploaded = await client.files.create({ file, purpose: "extract" });

  // 2. Create the extraction job against the profile-type schema.
  const created = await client.extract.create({
    file_input: uploaded.id,
    configuration: {
      data_schema: toJsonSchema(profileType),
      extraction_target: "per_doc",
      tier: "agentic",
      confidence_scores: true,
    },
  });

  // Poll until complete, requesting `extract_metadata` via expand — confidence
  // metadata is NOT returned by default (only with expand=extract_metadata).
  const job = await client.extract.waitForCompletion(created.id, {
    expand: ["extract_metadata"],
  });

  // Throw if the job did not succeed so callers get a proper error instead of
  // silently receiving an all-null profile. LlamaCloud terminal statuses are
  // "SUCCESS", "ERROR", "CANCELLED", and "PARTIAL".
  if (job.status !== "SUCCESS") {
    throw new Error(`Extraction job ended with status "${job.status}".`);
  }

  // 3. Normalize extracted data → our ExtractedProfile shape.
  const raw = (job.extract_result ?? {}) as Record<string, unknown>;
  const data = normalizeProfile(raw, profileType);

  // 4. Per-field confidence → confidence_scores + flagged_fields.
  const docMeta = (job.extract_metadata?.field_metadata?.document_metadata ?? {}) as Record<
    string,
    unknown
  >;
  const confidence_scores = readConfidence(docMeta);
  const flagged_fields = Object.entries(confidence_scores)
    .filter(([, score]) => score < FLAG_THRESHOLD)
    .map(([field]) => field);

  return { data, confidence_scores, flagged_fields };
}

/** Coerce raw extraction output into the typed profile (string→null, list→[]). */
function normalizeProfile(raw: Record<string, unknown>, profileType: ProfileType): ExtractedProfile {
  const out: Record<string, unknown> = {};
  for (const field of EXTRACTION_SCHEMA[profileType]) {
    const value = raw[field.key];
    if (field.type === "string") {
      out[field.key] = typeof value === "string" && value.trim() ? value : null;
    } else {
      out[field.key] = Array.isArray(value) ? value : [];
    }
  }
  return out as unknown as ExtractedProfile;
}

/** Build a flat {field: confidence} map, aggregating nested/array confidences. */
function readConfidence(docMeta: Record<string, unknown>): ConfidenceScores {
  const scores: ConfidenceScores = {};
  for (const [field, entry] of Object.entries(docMeta)) {
    const score = aggregateConfidence(entry);
    if (score !== null) scores[field] = Number(score.toFixed(3));
  }
  return scores;
}

/** Recursively pull a single confidence number from a metadata entry. */
function aggregateConfidence(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.confidence === "number") return obj.confidence;
    const nested = Array.isArray(value) ? value : Object.values(obj);
    const nums = nested.map(aggregateConfidence).filter((n): n is number => n !== null);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  }
  return null;
}
