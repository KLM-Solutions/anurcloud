/**
 * Module 4 — Template · request/response contract.
 *
 * Mirrors the shape of Modules 1 and 3: Bearer auth, JSON body, a discriminated
 * `status` union so the caller can branch without inspecting field presence.
 */

import type { ProfileType, TemplateEligibility, TemplateInfo, ThemeOptions } from "@/templates/types";
import type { BrandTheme, ExtractedProfile } from "@/lib/types";
import type { DataLevel } from "@/templates/guards";
import type { Suggestion } from "@/templates/rank";

export interface TemplateRequest {
  /** Human-reviewed profile from Module 1 / the client's Review step. */
  profile: ExtractedProfile | Record<string, unknown>;
  profile_type: ProfileType;
  /** Module 3 output. Its bio is preferred over the extracted summary. */
  enhanced?: { bio?: string | null } | null;
  /**
   * Brand colours from extraction. When present, the card is themed from it
   * automatically — the caller does not work out a palette.
   */
  brand?: BrandTheme | null;
  /** Supplied by AnurCloud; extraction does not produce a photo. */
  photo_url?: string | null;
  /** Template number or key. Omit to get eligibility without rendering. */
  template?: number | string;
  /** Explicit overrides. Anything set here beats the derived palette. */
  theme?: ThemeOptions;
}

/** How the card was themed — lets the caller see whether brand colours landed. */
export interface ThemeReport {
  /** True when the palette came from the user's own logo or website. */
  brand_applied: boolean;
  /** Null when applied; otherwise why we fell back to the default. */
  reason: string | null;
  primary: string | null;
  accent: string | null;
  logo_url: string | null;
}

export interface TemplateSuccess {
  status: "success";
  profile_type: ProfileType;
  /** How much content the profile carries — drives which layouts suit it. */
  data_level: DataLevel;
  /**
   * **The three to put in front of the user**, best first, each with plain-language
   * reasons. This is what a UI should show.
   *
   * There is no fit percentage in here on purpose: rank and a coarse three-value
   * tier are claims we can stand behind, a "94% match" is not. See `templates/rank.ts`.
   */
  suggested: Suggestion[];
  /** Every renderable template for this profile type, with pass/fail and reason. */
  eligibility: TemplateEligibility[];
  /**
   * Everything this profile *could* fill, in catalogue order.
   *
   * Kept for the "show me all the layouts" case and for callers written before
   * `suggested` existed. For a full profile this is nearly the whole pool, which
   * is why it is not the thing to put in a picker.
   */
  offered: TemplateInfo[];
  theme: ThemeReport;
  /** Present only when `template` was requested. Self-contained HTML. */
  html?: string;
  /** Which template produced `html`. */
  rendered?: { id: number; key: string; name: string };
}

export interface TemplateError {
  status: "error";
  error: { code: string; message: string };
}

/**
 * Returned while the card set is still being built (DEV-3035 … DEV-3039).
 *
 * The profile is validated and the theme resolved, but no card can be rendered
 * yet. Deliberately explicit rather than an empty success — the caller should
 * never be told a card exists when it does not.
 */
export interface TemplateReceived {
  status: "received";
  message: string;
  profile_type: ProfileType;
  data_level: DataLevel;
  theme: ThemeReport;
  /** The declared v1 set, including cards not yet built. */
  planned: TemplateInfo[];
}

export type TemplateResponse = TemplateSuccess | TemplateError | TemplateReceived;
