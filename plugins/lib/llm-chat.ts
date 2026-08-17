/**
 * Shared LLM chat helper (server-only).
 *
 * One place that knows how to talk to the model, used by both enhancement
 * (Module 3) and card-picking (Module 4). Returns the raw text response.
 *
 * Local (Ollama/Qwen 3.5) and OpenAI take different paths on purpose:
 *  - OpenAI: the SDK with `response_format: json_object`.
 *  - Local: Ollama's OpenAI-compatible `/v1` endpoint does NOT honour `think:false`
 *    (known bug — thinking output lands in a `reasoning` field and `content` is
 *    empty). Its NATIVE `/api/chat` endpoint DOES honour it, so for local we call
 *    that directly with `think:false` + native `format:"json"`.
 *
 * NOTE: this local branch is a Mac/Ollama test workaround. Production runs vLLM,
 * whose `/v1` endpoint is not buggy — swap this for the vLLM branch (OpenAI API +
 * `chat_template_kwargs: { enable_thinking: false }`) at deploy time.
 */

import OpenAI from "openai";

/** Model id — env-overridable so we can point at a local LLM (Ollama/Qwen). */
export const MODEL = process.env.LOCAL_LLM_MODEL ?? "gpt-4.1";

/** True when a local LLM endpoint is configured. */
export const isLocalLLM = (): boolean => !!process.env.LOCAL_LLM_BASE_URL;

let cached: OpenAI | null = null;
function getClient(): OpenAI {
  const baseURL = process.env.LOCAL_LLM_BASE_URL;
  if (baseURL) {
    // key is ignored by Ollama, but the SDK requires a non-empty value
    cached ??= new OpenAI({ baseURL, apiKey: "ollama" });
    return cached;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
  cached ??= new OpenAI({ apiKey });
  return cached;
}

/**
 * Run a single JSON-returning chat and return the raw text.
 * `tag` only labels the diagnostic log line.
 */
export async function runChatJSON(system: string, user: string, tag = "llm"): Promise<string> {
  const baseURL = process.env.LOCAL_LLM_BASE_URL;

  if (baseURL) {
    const nativeURL = baseURL.replace(/\/v1\/?$/, "") + "/api/chat";
    const res = await fetch(nativeURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        think: false,
        stream: false,
        format: "json",
        options: { num_predict: 2048 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Local model HTTP ${res.status}`);
    const data = (await res.json()) as {
      message?: { content?: string; thinking?: string };
      done_reason?: string;
    };
    const text = data.message?.content ?? "";
    console.log(`[${tag}] LOCAL model:`, MODEL, "| done:", data.done_reason,
      "| contentLen:", text.length, "| thinkingLen:", (data.message?.thinking ?? "").length);
    if (!text) throw new Error(`Local model returned empty content (done_reason=${data.done_reason}).`);
    return text;
  }

  const completion = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "";
  if (!text) throw new Error(`[${tag}] model returned an empty response.`);
  return text;
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
  return JSON.parse(slice) as T;
}
