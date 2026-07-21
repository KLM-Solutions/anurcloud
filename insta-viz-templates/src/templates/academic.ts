/** Template 3 — "Academic": scholarly header with round avatar, badge, department line. */

import type { CardProfile } from "../types.js";
import type { ResolvedTheme } from "../theme.js";
import { avatar, bannerSVG, credentialPill, esc, logoBlock, nonEmpty, profileTypeOf } from "../helpers.js";
import { audienceBody } from "../sections.js";

export function buildAcademic(profile: CardProfile, theme: ResolvedTheme): string {
  const isStudent = profileTypeOf(profile) === "student";
  const sub = isStudent
    ? profile.education?.find((e) => nonEmpty(e.institution))?.institution ?? ""
    : profile.currentCompany ?? profile.totalYearsExperience ?? "";
  return `<div class="iv-head">
    ${bannerSVG(profileTypeOf(profile))}
    <div class="iv-head-top">
      ${logoBlock(theme.logo)}
      ${credentialPill(profile)}
    </div>
    <div class="iv-acad-main">
      ${avatar(profile)}
      <div class="iv-acad-info">
        <h2 class="iv-name">${esc(profile.fullName ?? "")}</h2>
        ${nonEmpty(profile.designation) ? `<div class="iv-desig">${esc(profile.designation)}</div>` : ""}
        ${nonEmpty(sub) ? `<div class="iv-sub">${esc(sub)}</div>` : ""}
      </div>
    </div>
  </div>
  <div class="iv-body">
    ${audienceBody(profile)}
  </div>`;
}
