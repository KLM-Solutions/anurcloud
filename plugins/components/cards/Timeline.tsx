"use client";

/**
 * Timeline — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): the only card organised by TIME rather
 * than by section type. Education, internships, projects, experience, awards and
 * papers are interleaved along ONE spine (dots + years down the left), already
 * merged and sorted by lib/profile-to-card.ts. Identity sits top-right, off the
 * spine. The undated families (certs, activities, skills, languages, contact) sit
 * below as labelled sections.
 *
 * Interaction matches the metaphor: a single chronological scroll (no tabs, no
 * open-a-screen). The header is fixed chrome (with the social icons). Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface TimelineProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

// Families that live on the spine — keep them out of the below-spine sections.
const ON_SPINE = new Set(["education", "projects", "internships", "awards", "papers"]);

export function Timeline({ profile: p, theme }: TimelineProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("timeline", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const belowSpine = useMemo(() => studentSections(p).filter((s) => !ON_SPINE.has(s.key)), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  return (
    <div className={`${scope} iv-timeline ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Identity top-right, off the spine (the spine owns the left edge). */}
      <header className="iv-tl-head">
        <div className="iv-tl-id">
          {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
          {nonEmpty(p.designation) && <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>}
          <SocialIcons links={p.socialLinks} big />
        </div>
        <Avatar profile={p} cls="iv-tl-av" logoUrl={resolved.logo?.url} />
      </header>

      <div className="iv-tl-wrap">
        <div
          className="iv-tl-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && <p className="iv-bio iv-tl-intro">{p.bio}</p>}

          {/* The spine — the signature. */}
          {p.timeline.length > 0 && (
            <div className="iv-tl-spine">
              {p.timeline.map((e, i) => (
                <div key={i} className="iv-tl-row">
                  <span className="iv-tl-dot" aria-hidden />
                  <div className="iv-tl-body">
                    {nonEmpty(e.dateText) && <span className="iv-tl-d">{e.dateText}</span>}
                    <div className="iv-item-t">{e.title}</div>
                    {nonEmpty(e.subtitle) && <div className="iv-item-m">{e.subtitle}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Undated families below the spine. */}
          {belowSpine.map((sec) => (
            <div key={sec.key} className="iv-tl-sec">
              <div className="iv-tl-h">{sec.label}</div>
              {sec.node}
            </div>
          ))}
        </div>
        <div className="iv-tl-fade" aria-hidden />
        {!atBottom && <div className="iv-tl-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-tl-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-timeline{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* Identity top-right, off the spine. */
${s} .iv-tl-head{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-end;gap:.7em;text-align:right;padding:1.2em 1.1em 1em;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent)}
${s} .iv-tl-id{min-width:0}
${s} .iv-tl-id .iv-role{font-size:.78em;color:var(--iv-muted);margin-top:.12em}
${s} .iv-tl-id .iv-socials{justify-content:flex-end;margin-top:.5em}
${s} .iv-tl-av{width:3.1em;height:3.1em;flex:0 0 auto;order:2}

/* Chronological scroll. */
${s} .iv-tl-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-tl-scroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1.1em 2.8em;scrollbar-width:thin}
${s} .iv-tl-intro{margin:0 0 1.1em}
${s} .iv-tl-sec{margin-top:.9em;padding-top:.85em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 20%,transparent)}
${s} .iv-tl-h{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}

${s} .iv-tl-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-tl-more,${s} .iv-tl-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
`;
}
