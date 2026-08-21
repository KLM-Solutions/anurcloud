"use client";

/**
 * Column Flow — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): a newspaper masthead (name + course + a
 * double rule), then a genuine multi-column FLOW — sections run down column one and
 * continue into column two, so the break lands wherever the content reaches.
 * Nothing else in the set flows. No colour block, no avatar; the brand shows only
 * in the rule and the section headings.
 *
 * Digital note: the two-column flow is an AUTO-height inner block inside a
 * vertically-scrolling container (not `columns` on the scroll box itself — that
 * would overflow sideways). So it balances into two columns and the card scrolls
 * DOWN. `break-inside:avoid` keeps an entry from splitting across the column break.
 * Masthead is fixed chrome (with the icons). Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface ColumnFlowProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function ColumnFlow({ profile: p, theme }: ColumnFlowProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("column-flow", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Contact rides in the footer; keep it out of the flow sections.
  const sections = useMemo(() => studentSections(p).filter((s) => s.key !== "contact"), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-column-flow ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Masthead — fixed chrome. */}
      <header className="iv-cf-mast">
        {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
        {nonEmpty(p.designation) && <div className="iv-role">{p.designation}</div>}
        <SocialIcons links={p.socialLinks} big />
      </header>

      {/* The two-column flow, scrolling vertically. */}
      <div className="iv-cf-wrap">
        <div
          className="iv-cf-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          <main className="iv-cf-flow">
            {nonEmpty(p.bio) && (
              <div className="iv-cf-block">
                <div className="iv-cf-h">About</div>
                <p className="iv-bio">{p.bio}</p>
              </div>
            )}
            {sections.map((sec) => (
              <div key={sec.key} className="iv-cf-block">
                <div className="iv-cf-h">{sec.label}</div>
                {sec.node}
              </div>
            ))}
          </main>
          {contact && <footer className="iv-cf-foot">{contact}</footer>}
        </div>
        <div className="iv-cf-fade" aria-hidden />
        {!atBottom && <div className="iv-cf-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-cf-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-column-flow{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* Masthead — no colour block; the brand is in the double rule and the headings. */
${s} .iv-cf-mast{flex:0 0 auto;margin:1.1em 1.05em 0;border-bottom:3px double var(--iv-primary);padding-bottom:.5em}
${s} .iv-cf-mast .iv-name{font-size:1.5em;line-height:1.1;text-transform:uppercase;letter-spacing:-.005em}
${s} .iv-cf-mast .iv-role{font-size:.72em;letter-spacing:.04em;text-transform:uppercase;color:var(--iv-muted);margin-top:.15em}
${s} .iv-cf-mast .iv-socials{margin-top:.55em}

/* Scroll box (vertical). The flow inside is auto-height so columns balance side by
   side and the box scrolls down instead of overflowing sideways. */
${s} .iv-cf-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-cf-scroll{position:absolute;inset:0;overflow-y:auto;padding:.7em 1.05em 2.8em;scrollbar-width:thin}
${s} .iv-cf-flow{columns:2;column-gap:1.05em;column-fill:balance;column-rule:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
/* Load-bearing: keep an entry (and its heading) from splitting across the break. */
${s} .iv-cf-block{break-inside:avoid;-webkit-column-break-inside:avoid;margin-bottom:.75em}
${s} .iv-cf-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);break-after:avoid;margin-bottom:.4em}
${s} .iv-cf-flow .iv-bio{margin:0;font-size:.78em}
${s} .iv-cf-flow .iv-item{padding:.12em 0}
${s} .iv-cf-flow .iv-item+.iv-item{border-top:none;margin-top:.3em}
${s} .iv-cf-flow .iv-item-t{font-size:.8em}
${s} .iv-cf-flow .iv-item-m,${s} .iv-cf-flow .iv-item-d{font-size:.72em}

${s} .iv-cf-foot{margin-top:.4em;padding-top:.5em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent);font-size:.7em;color:var(--iv-muted)}

${s} .iv-cf-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-cf-more,${s} .iv-cf-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:320px){
  ${s} .iv-cf-flow{columns:1;column-rule:none}
}
`;
}
