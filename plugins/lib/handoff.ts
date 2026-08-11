/**
 * One-shot page-to-page handoff, browser only.
 *
 * The demo pages are independent routes, but the pipeline they demonstrate is a
 * chain: extract → enhance → card. Each step hands the next one its result
 * through sessionStorage rather than a query string, because a profile is far
 * too big for a URL and must not end up in browser history or a server log.
 *
 * Read is destructive by design — a prefill is consumed once. Landing on
 * /template a second time should show the gallery, not silently re-run a stale
 * profile the user has moved on from.
 */

import type { BrandTheme } from "@/lib/types";

export const ENHANCE_PREFILL = "enhance_prefill";
export const TEMPLATE_PREFILL = "template_prefill";

export interface EnhanceHandoff {
  profile_type: "student" | "professional";
  profile: Record<string, unknown>;
  /** Carried through so the card keeps the user's colours without a re-extract. */
  brand?: BrandTheme | null;
}

export interface TemplateHandoff extends EnhanceHandoff {
  /** Present only when the user actually ran enhancement — it is optional. */
  enhanced?: { bio?: string | null } | null;
  /** Which step sent us here, for the "where this came from" line on the card page. */
  from?: "extraction" | "enhance";
}

/** Write a prefill for the next page. No-op outside the browser. */
export function putHandoff(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota. The next page falls back to its own
    // sample data, which is a degraded demo rather than a broken one.
  }
}

/**
 * Read and clear a prefill.
 *
 * Anything unparseable is treated as absent and cleared, so one bad write can
 * never wedge the page on every subsequent visit.
 *
 * ⚠️ **Destructive, so call sites must be idempotent.** React StrictMode runs a
 * mount effect twice in development; the second call finds nothing because the
 * first one deleted it. Guard every caller with a `useRef` latch — see
 * `app/template/your-card.tsx`. Without one the page silently shows its
 * "nothing handed over" state while the request from the first run is already in
 * flight, which reads as the whole feature being broken.
 */
export function takeHandoff<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}
