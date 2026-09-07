/**
 * Shared LLM chat helper (server-only).
 *
 * One place that knows how to talk to the model, used by both enhancement
 * (Module 3) and card-picking (Module 4). Returns the raw text response.
 *
 * The model is the SELF-HOSTED Qwen 3.5 4B served with vLLM from the private
 * Cloud Run service in Anur Cloud's own GCP. There is no third-party provider in
 * this path — every call goes to `LOCAL_LLM_BASE_URL`.
 *
 * The service is private (Anur Cloud's org policy forbids public access), so each
 * request carries a Google identity token whose audience is the service's root
 * URL. The token is minted from a service-account key and auto-refreshed by
 * google-auth-library.
 *
 * Config (env, server-only):
 *  - LOCAL_LLM_BASE_URL   vLLM OpenAI-compatible endpoint, e.g. https://…run.app/v1
 *  - LOCAL_LLM_MODEL      served model id (e.g. Qwen/Qwen3.5-4B)
 *  - GCP_SA_KEY_B64       base64 of the service-account JSON key (the invoker identity).
 *                         If unset, falls back to Application Default Credentials
 *                         (e.g. GOOGLE_APPLICATION_CREDENTIALS = path to the key file)
 *                         for local testing.
 *  - LLM_TEMPERATURE      sampling temperature (default 0.2)
 */

import OpenAI from "openai";
import { GoogleAuth, type IdTokenClient } from "google-auth-library";

/** Model id — the served self-hosted model. */
export const MODEL = process.env.LOCAL_LLM_MODEL ?? "Qwen/Qwen3.5-4B";

/**
 * Both jobs (enhancement, card-picking) are GROUNDED, not creative — the model
 * rewrites or ranks facts already in the profile, it must not invent. Left at the
 * SDK default a small model embellishes: on a bio it expanded "CKA" into
 * "Certified Kubernetes Administrator", words that were not in the profile. A low
 * temperature cuts that and makes output more consistent, with no quality cost for
 * a fact-bound task. Env-overridable for experiments.
 */
const TEMPERATURE = Number(process.env.LLM_TEMPERATURE ?? "0.2");

/** True when the self-hosted model endpoint is configured. */
export const isLocalLLM = (): boolean => !!process.env.LOCAL_LLM_BASE_URL;

/** The Cloud Run service root — the identity-token audience — i.e. base URL minus `/v1`. */
function serviceAudience(baseURL: string): string {
  return baseURL.replace(/\/v1\/?$/, "");
}

/**
 * Mint a Google identity token for the private Cloud Run service. The service
 * account comes from GCP_SA_KEY_B64 (base64 of the JSON key) in production, or
 * Application Default Credentials locally. The client is kept per-process; the
 * token itself is fetched (and cached/refreshed) by google-auth-library.
 */
let idClientPromise: Promise<IdTokenClient> | null = null;
async function identityToken(baseURL: string): Promise<string> {
  const audience = serviceAudience(baseURL);
  if (!idClientPromise) {
    const b64 = process.env.GCP_SA_KEY_B64;
    const auth = b64
      ? new GoogleAuth({ credentials: JSON.parse(Buffer.from(b64, "base64").toString("utf8")) })
      : new GoogleAuth(); // ADC fallback (GOOGLE_APPLICATION_CREDENTIALS) for local testing
    idClientPromise = auth.getIdTokenClient(audience);
  }
  const client = await idClientPromise;
  return client.idTokenProvider.fetchIdToken(audience);
}

let cached: OpenAI | null = null;
function getClient(baseURL: string): OpenAI {
  // The SDK requires a non-empty apiKey, but the real credential is a fresh
  // identity token passed per request (see runChatJSON) — this is only a placeholder.
  cached ??= new OpenAI({ baseURL, apiKey: "identity" });
  return cached;
}

/**
 * Run a single JSON-returning chat against the self-hosted model and return the
 * raw text. `tag` only labels the diagnostic log line.
 */
export async function runChatJSON(
  system: string,
  user: string,
  tag = "llm",
  maxTokens = 2048,
): Promise<string> {
  const baseURL = process.env.LOCAL_LLM_BASE_URL;
  if (!baseURL) throw new Error("LOCAL_LLM_BASE_URL is not set (self-hosted model endpoint).");

  const token = await identityToken(baseURL);

  // vLLM (Qwen): `chat_template_kwargs.enable_thinking=false` turns off "thinking"
  // so `content` is the answer, not reasoning. It's a vendor field the SDK types
  // don't know, so the request body is attached via a cast.
  const params: Record<string, unknown> = {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: TEMPERATURE,
    response_format: { type: "json_object" },
    chat_template_kwargs: { enable_thinking: false },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };

  const completion = await getClient(baseURL).chat.completions.create(
    params as unknown as Parameters<OpenAI["chat"]["completions"]["create"]>[0],
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const text = ("choices" in completion ? completion.choices[0]?.message?.content : "") ?? "";
  console.log(`[${tag}] self-hosted model:`, MODEL, "| contentLen:", text.length);
  if (!text) throw new Error(`[${tag}] model returned an empty response.`);
  return text;
}

/**
 * Fire a tiny request to wake the model EARLY, before it is actually needed.
 *
 * Why this exists: the service is scale-to-zero, so a cold instance takes ~150s
 * to become ready (GPU provisioning + engine init: profiling, CUDA-graph capture,
 * warmup — see the deployment log). If the first request to hit it is a real
 * user's card-picking call, that user waits through the whole cold start (a blank
 * screen). The pipeline's FIRST step is extraction, which does NOT use this model,
 * so we kick a warm-up off there: by the time the flow reaches enhancement/
 * card-picking (extraction + the human review step later), the instance is warm.
 *
 * It also generates a couple of JSON tokens on purpose: the JSON-decoding kernel
 * (`apply_token_bitmask_inplace_kernel`) JIT-compiles on the first *generation*,
 * a one-off latency spike — doing it here means the first REAL answer is fast too.
 *
 * Fire-and-forget by contract: it NEVER throws and NEVER blocks the caller. Any
 * failure (model unreachable, still booting, auth) is swallowed — its only job is
 * to start the boot, not to get an answer. Callers must not await it in the
 * request's critical path.
 */
let lastWarmAt = 0;
const WARM_MIN_GAP_MS = 5 * 60_000; // don't re-ping a just-warmed instance from the same process
export function warmUpModel(): void {
  const baseURL = process.env.LOCAL_LLM_BASE_URL;
  if (!baseURL) return; // no self-hosted model configured → nothing to warm
  const now = Date.now();
  if (now - lastWarmAt < WARM_MIN_GAP_MS) return; // best-effort throttle (per serverless instance)
  lastWarmAt = now;

  void (async () => {
    try {
      const token = await identityToken(baseURL);
      const params: Record<string, unknown> = {
        model: MODEL,
        max_tokens: 8, // enough to trigger the JSON generation kernel, still trivial
        temperature: 0,
        response_format: { type: "json_object" },
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          { role: "system", content: 'Reply with {"ok":true}.' },
          { role: "user", content: "warmup" },
        ],
      };
      await getClient(baseURL).chat.completions.create(
        params as unknown as Parameters<OpenAI["chat"]["completions"]["create"]>[0],
        { headers: { Authorization: `Bearer ${token}` } },
      );
      console.log("[warmup] self-hosted model pinged:", MODEL);
    } catch (err) {
      // Expected while the instance is still cold-booting — never surface it.
      console.log("[warmup] ping did not complete (model likely still starting):", (err as Error).message);
      lastWarmAt = 0; // let the next request retry the wake rather than wait out the gap
    }
  })();
}

/**
 * Extract the outermost JSON value from model text (handles ```json fences or
 * stray prose) and parse it. Throws on unparseable output.
 */
export function parseJSONLoose<T>(text: string): T {
  const trimmed = text.trim();
  // object first, then array
  const objStart = trimmed.indexOf("{");
  const objEnd = trimmed.lastIndexOf("}");
  const arrStart = trimmed.indexOf("[");
  const arrEnd = trimmed.lastIndexOf("]");
  let slice = trimmed;
  if (objStart !== -1 && objEnd > objStart && (arrStart === -1 || objStart < arrStart)) {
    slice = trimmed.slice(objStart, objEnd + 1);
  } else if (arrStart !== -1 && arrEnd > arrStart) {
    slice = trimmed.slice(arrStart, arrEnd + 1);
  }
  try {
    return JSON.parse(slice) as T;
  } catch {
    // Small-model repair: strip trailing commas before a } or ] and retry once.
    return JSON.parse(slice.replace(/,\s*([}\]])/g, "$1")) as T;
  }
}
