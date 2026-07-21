/** Template 4 — "Editorial": no colour blocks, big typographic name, thin rules, whitespace. */

import type { CardProfile } from "../types.js";
import type { ResolvedTheme } from "../theme.js";
import { avatar, credentialPill, esc, logoBlock, nonEmpty } from "../helpers.js";
import { audienceBody } from "../sections.js";

export function buildEditorial(profile: CardProfile, theme: ResolvedTheme): string {
  return `<div class="iv-ed-body">
    <div class="iv-ed-top">
      ${logoBlock(theme.logo)}
      ${avatar(profile)}
    </div>
    <h2 class="iv-ed-name">${esc(profile.fullName ?? "")}</h2>
    ${nonEmpty(profile.designation) ? `<div class="iv-ed-desig">${esc(profile.designation)}</div>` : ""}
    <div class="iv-ed-meta">${credentialPill(profile)}</div>
    <div class="iv-ed-rule"></div>
    ${audienceBody(profile)}
  </div>`;
}
