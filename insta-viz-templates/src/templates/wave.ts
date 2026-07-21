/** Template 1 — "Wave": coloured header banner with a wave divider into the body. */

import type { CardProfile } from "../types.js";
import type { ResolvedTheme } from "../theme.js";
import { avatar, bannerSVG, credentialPill, esc, logoBlock, nonEmpty, profileTypeOf } from "../helpers.js";
import { audienceBody } from "../sections.js";

function subtitle(profile: CardProfile): string {
  if (profileTypeOf(profile) === "professional") {
    return profile.currentCompany ?? profile.totalYearsExperience ?? "";
  }
  return profile.education?.find((e) => nonEmpty(e.institution))?.institution ?? "";
}

export function buildWave(profile: CardProfile, theme: ResolvedTheme): string {
  const sub = subtitle(profile);
  return `<div class="iv-head">
    ${bannerSVG(profileTypeOf(profile))}
    <div class="iv-head-top">
      ${logoBlock(theme.logo)}
    </div>
    <div class="iv-head-main">
      <div>
        <h2 class="iv-name">${esc(profile.fullName ?? "")}</h2>
        ${nonEmpty(profile.designation) ? `<div class="iv-desig">${esc(profile.designation)}</div>` : ""}
        ${nonEmpty(sub) ? `<div class="iv-sub">${esc(sub)}</div>` : ""}
        <div class="iv-credrow">${credentialPill(profile)}</div>
      </div>
      ${avatar(profile)}
    </div>
    <svg class="iv-wave" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,18 C60,0 120,14 180,6 C240,-1 270,12 300,7 L300,18 Z" fill="var(--iv-bg)"/>
    </svg>
  </div>
  <div class="iv-body">
    ${audienceBody(profile)}
  </div>`;
}
