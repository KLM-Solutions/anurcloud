/** Template 2 — "Split": coloured avatar panel on the left, details on the right. */

import type { CardProfile } from "../types.js";
import type { ResolvedTheme } from "../theme.js";
import { avatar, bannerSVG, credentialPill, esc, logoBlock, nonEmpty, profileTypeOf } from "../helpers.js";
import { audienceBody } from "../sections.js";

export function buildSplit(profile: CardProfile, theme: ResolvedTheme): string {
  return `<div class="iv-split-head">
    <div class="iv-split-left">
      ${bannerSVG(profileTypeOf(profile), true)}
      ${avatar(profile)}
    </div>
    <div class="iv-split-right">
      ${logoBlock(theme.logo)}
      <h2 class="iv-name">${esc(profile.fullName ?? "")}</h2>
      ${nonEmpty(profile.designation) ? `<div class="iv-desig">${esc(profile.designation)}</div>` : ""}
      <div class="iv-tags">${credentialPill(profile)}</div>
    </div>
  </div>
  <div class="iv-body">
    ${audienceBody(profile)}
  </div>`;
}
