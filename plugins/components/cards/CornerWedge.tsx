"use client";

/**
 * Corner Wedge — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): the only card whose colour region is NOT a
 * rectangle. A clip-path diagonal WEDGE cuts across the top-left corner, the
 * identity sits inside it, and a short Skills aside tucks into the space the
 * diagonal opens up on the right. The wedge is a background layer, so text is never
 * sliced by the clip edge.
 *
 * Body: a two-column SECTION GRID — small sections sit side by side, long ones span
 * the full width. Everything visible, one scroll (no open-a-screen). Distinct from
 * Monogram Block (accordion) and Ticket Stub (receipt). Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, Chips, cardTheme } from "./card-kit";

export interface CornerWedgeProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function CornerWedge({ profile: p, theme }: CornerWedgeProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("corner-wedge", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Skills sit in the wedge aside; contact in the wedge id — keep both out of body.
  // Split the remaining sections across two clean columns (About spans the top).
  const { colA, colB } = useMemo(() => {
    const secs = studentSections(p).filter((s) => !["skills", "contact"].includes(s.key));
    const a: typeof secs = [];
    const b: typeof secs = [];
    secs.forEach((s, i) => (i % 2 === 0 ? a : b).push(s));
    return { colA: a, colB: b };
  }, [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-corner-wedge ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* The diagonal wedge header (the signature). */}
      <header className="iv-cw-head">
        <div className="iv-cw-id">
          <Avatar profile={p} cls="iv-cw-av" logoUrl={resolved.logo?.url} />
          {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
          {nonEmpty(p.designation) && <div className="iv-role">{p.designation}</div>}
          {contact && <div className="iv-cinline">{contact}</div>}
          <SocialIcons links={p.socialLinks} big />
        </div>
        {p.skills.length > 0 && (
          <aside className="iv-cw-aside">
            <div className="iv-cw-h">Skills</div>
            <Chips items={p.skills} />
          </aside>
        )}
      </header>

      {/* Body — a two-column section grid. */}
      <div className="iv-cw-wrap">
        <div
          className="iv-cw-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && (
            <section className="iv-cw-cell iv-cw-about">
              <div className="iv-cw-ch">About</div>
              <p className="iv-bio">{p.bio}</p>
            </section>
          )}
          <div className="iv-cw-cols">
            <div className="iv-cw-col">
              {colA.map((sec) => (
                <section key={sec.key} className="iv-cw-cell">
                  <div className="iv-cw-ch">{sec.label}</div>
                  {sec.node}
                </section>
              ))}
            </div>
            <div className="iv-cw-col">
              {colB.map((sec) => (
                <section key={sec.key} className="iv-cw-cell">
                  <div className="iv-cw-ch">{sec.label}</div>
                  {sec.node}
                </section>
              ))}
            </div>
          </div>
        </div>
        <div className="iv-cw-fade" aria-hidden />
        {!atBottom && <div className="iv-cw-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-cw-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-corner-wedge{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* The wedge is the header's own background layer (a clipped ::before behind the
   content), so text is never sliced. The diagonal lives in the bottom padding. */
${s} .iv-cw-head{position:relative;isolation:isolate;flex:0 0 auto;display:flex;gap:.7em;padding:1.15em 1.1em 2.5em;color:var(--iv-onp)}
${s} .iv-cw-head::before{content:"";position:absolute;inset:0;background:var(--iv-grad);clip-path:polygon(0 0,100% 0,100% calc(100% - 2.1em),0 100%);z-index:-1}
${s} .iv-cw-id{min-width:0;flex:1 1 auto}
${s} .iv-cw-av{width:3.1em;height:3.1em;flex:0 0 auto;margin-bottom:.45em;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 40%,transparent)}
${s} .iv-cw-head .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-cw-head .iv-name{color:var(--iv-onp);font-size:1.15em}
${s} .iv-cw-head .iv-role,${s} .iv-cw-head .iv-cinline{color:color-mix(in srgb,var(--iv-onp) 82%,transparent)}
${s} .iv-cw-head .iv-cinline{font-size:.66em;margin-top:.2em}
${s} .iv-cw-head .iv-socials{margin-top:.5em}
${s} .iv-cw-aside{flex:0 0 42%;max-width:42%;min-width:0}
${s} .iv-cw-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb,var(--iv-onp) 78%,transparent);margin-bottom:.45em}
${s} .iv-cw-aside .iv-chip{background:color-mix(in srgb,var(--iv-onp) 20%,transparent);color:var(--iv-onp)}

/* Body — two-column section grid, scrolling vertically. */
${s} .iv-cw-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-cw-scroll{position:absolute;inset:0;overflow-y:auto;padding:.9em 1.1em 2.8em;scrollbar-width:thin}
${s} .iv-cw-about{margin-bottom:.9em}
${s} .iv-cw-cols{display:flex;gap:1em;align-items:flex-start}
${s} .iv-cw-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:.9em}
${s} .iv-cw-cell{min-width:0}
${s} .iv-cw-ch{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.4em}
${s} .iv-cw-cell .iv-bio{margin:0;font-size:.82em}
${s} .iv-cw-cell .iv-item{padding:.12em 0}
${s} .iv-cw-cell .iv-item+.iv-item{border-top:none;margin-top:.3em}

${s} .iv-cw-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-cw-more,${s} .iv-cw-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:320px){
  ${s} .iv-cw-aside{display:none}
  ${s} .iv-cw-cols{flex-direction:column}
}
`;
}
