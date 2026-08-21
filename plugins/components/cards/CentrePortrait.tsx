"use client";

/**
 * Centre Portrait — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): everything is CENTRED and there is NO
 * colour block anywhere. Hierarchy comes from typography, centring and whitespace;
 * colour survives only as accents — the outlined initials ring, the hairlines
 * between sections, links. It is the strongest card when there is little to show.
 *
 * Interaction is deliberately quiet to match: no tabs, no open-a-screen. The body
 * is a single centred column that scrolls, each section divided by a centred
 * hairline. Missing field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface CentrePortraitProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function CentrePortrait({ profile: p, theme }: CentrePortraitProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("centre-portrait", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Social links live in the centred header; keep them out of the flowing sections.
  const sections = useMemo(() => studentSections(p).filter((s) => s.key !== "links"), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  return (
    <div className={`${scope} iv-centre-portrait ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Centred header — outlined ring, name, course, icons. No colour block. */}
      <header className="iv-cp-head">
        <Avatar profile={p} cls="iv-cp-av" logoUrl={resolved.logo?.url} />
        {nonEmpty(p.fullName) && <h2 className="iv-cp-name">{p.fullName}</h2>}
        {nonEmpty(p.designation) && <div className="iv-cp-role">{p.designation}</div>}
        <SocialIcons links={p.socialLinks} big />
      </header>

      {/* Centred, continuous body. */}
      <div className="iv-cp-wrap">
        <div
          className="iv-cp-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && (
            <div className="iv-cp-sec">
              <p className="iv-bio">{p.bio}</p>
            </div>
          )}
          {sections.map((sec) => (
            <div key={sec.key} className="iv-cp-sec">
              <div className="iv-cp-h">{sec.label}</div>
              {sec.node}
            </div>
          ))}
        </div>
        <div className="iv-cp-fade" aria-hidden />
        {!atBottom && <div className="iv-cp-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-cp-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-centre-portrait{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column;text-align:center}

/* Centred header. The initials fallback is an OUTLINED ring, not a filled disc. */
${s} .iv-cp-head{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:.5em;padding:1.7em 1.5em 1.1em}
${s} .iv-cp-av{width:4.6em;height:4.6em;flex:0 0 auto}
${s} .iv-cp-head .iv-av-fallback{background:transparent;color:var(--iv-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 40%,transparent)}
${s} .iv-cp-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.35em;line-height:1.15;letter-spacing:-.015em;margin:0}
${s} .iv-cp-role{font-size:.78em;color:var(--iv-muted);letter-spacing:.06em;text-transform:uppercase}
${s} .iv-cp-head .iv-socials{justify-content:center;margin-top:.55em}

/* Centred, continuous body with a hairline between sections. */
${s} .iv-cp-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-cp-scroll{position:absolute;inset:0;overflow-y:auto;padding:0 1.5em 2.8em;scrollbar-width:thin}
${s} .iv-cp-sec+.iv-cp-sec{margin-top:1.1em;padding-top:1.1em;position:relative}
${s} .iv-cp-sec+.iv-cp-sec::before{content:"";position:absolute;top:0;left:20%;width:60%;height:1px;background:color-mix(in srgb,var(--iv-primary) 22%,transparent)}
${s} .iv-cp-h{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.14em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-cp-sec .iv-bio{margin:0;font-size:.82em}
${s} .iv-cp-sec .iv-chips{justify-content:center}
${s} .iv-cp-sec .iv-chip{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-primary) 30%,transparent)}
/* Centred layout: list items lose their dividing lines, spacing carries them. */
${s} .iv-cp-sec .iv-item{padding:0}
${s} .iv-cp-sec .iv-item+.iv-item{border-top:none;margin-top:.5em}

${s} .iv-cp-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-cp-more,${s} .iv-cp-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
`;
}
