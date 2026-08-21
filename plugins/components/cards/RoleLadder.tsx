"use client";

/**
 * Role Ladder — React (TSX) card component.
 *
 * Signature (kept from the string card): a descending STAIRCASE. Each role is its
 * own rung with a short bar, and every rung further down is indented one step more
 * (depth d0..d3, the bar fading with depth), so career progression is read from the
 * shape before a word. Roles only — no spine, no dots (that would be the Timeline
 * card). The staircase LEADS and renders inline; it is the card, not a section to
 * open.
 *
 * Digital behaviour matches the other cards: identity + icons are the hero; the
 * staircase leads the scrolling overview; the remaining sections open their own
 * screen (big) or show inline (small). Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface RoleLadderProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function RoleLadder({ profile: p, theme }: RoleLadderProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("role-ladder", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Experience is drawn as the staircase, so keep it out of the generic nav list.
  const tail = useMemo(() => professionalSections(p).filter((s) => s.key !== "experience"), [p]);
  const tailBig = tail.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-role-ladder ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          <header className="iv-rl-id">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            <div className="iv-role">{joinParts([p.designation, p.currentCompany, nonEmpty(p.totalYearsExperience) ? `${p.totalYearsExperience} exp.` : null])}</div>
            <SocialIcons links={p.socialLinks} big />
          </header>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-rl-about">{p.bio}</p>}

              {/* The staircase — leads, inline. The signature. */}
              {p.experience.length > 0 && (
                <div className="iv-rl-ladder">
                  <div className="iv-ovh">Experience</div>
                  {p.experience.map((e, i) => {
                    const meta = joinParts([e.company, e.duration, e.location]);
                    const bullets = (e.highlights ?? []).filter(nonEmpty);
                    return (
                      <div key={i} className={`iv-rl-rung iv-rl-d${Math.min(i, 3)}`}>
                        {nonEmpty(e.role) && <div className="iv-item-t">{e.role}</div>}
                        {meta && <div className="iv-item-m">{meta}</div>}
                        {bullets.length > 0 && (
                          <ul className="iv-hl">
                            {bullets.map((h, j) => (
                              <li key={j}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Remaining sections. */}
              <div className="iv-secs">
                {tail.map((sec) =>
                  isBig(sec) ? (
                    <button key={sec.key} type="button" className="iv-ovsec" onClick={() => setView(sec.key)}>
                      <div className="iv-ovh">{sec.label}</div>
                      <div className="iv-ovs">{sec.node}</div>
                      <div className="iv-ovnav">{sec.count > 1 ? `View all ${sec.count}` : "Open"} ›</div>
                    </button>
                  ) : (
                    <div key={sec.key} className="iv-ovinline">
                      <div className="iv-ovh">{sec.label}</div>
                      {sec.node}
                    </div>
                  ),
                )}
                {contact && (
                  <div className="iv-ovinline">
                    <div className="iv-ovh">Contact</div>
                    <div className="iv-rl-contact">{contact}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="iv-ovfade" aria-hidden />
            {!atBottom && <div className="iv-ovmore" aria-hidden>⌄ scroll</div>}
            {atBottom && <div className="iv-ovup" aria-hidden>⌃ scroll up</div>}
          </div>
        </div>
      ) : (
        (() => {
          const sec = tailBig.find((b) => b.key === view);
          if (!sec) return null;
          return (
            <div className="iv-view">
              <div className="iv-bar">
                <button type="button" className="iv-back" onClick={() => setView("overview")}>
                  ‹ Back
                </button>
                <span className="iv-ptitle">{sec.label}</span>
              </div>
              <div className="iv-pbody">{sec.node}</div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-role-ladder{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* Identity hero — no colour block; the brand colour lives in the rung bars. */
${s} .iv-rl-id{flex:0 0 auto;padding:1.1em 1.15em .85em;border-bottom:1px solid var(--iv-edge)}
${s} .iv-rl-id .iv-name{font-size:1.2em}
${s} .iv-rl-id .iv-role{font-size:.8em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-rl-id .iv-socials{margin-top:.6em}

/* Scrolling body. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-rl-about{margin:0 0 1em}

/* The staircase. Each rung carries its own bar; depth is baked into the class so
   a single continuous spine (Timeline) never forms. The bar fades with depth so
   the most recent role reads strongest without a label. */
${s} .iv-rl-ladder{margin-bottom:.4em}
${s} .iv-rl-rung{position:relative;padding:.15em 0 .15em .8em;border-left:.2em solid var(--iv-primary)}
${s} .iv-rl-rung+.iv-rl-rung{margin-top:.55em}
${s} .iv-ovh+.iv-rl-rung{margin-top:.2em}
${s} .iv-rl-d1{margin-left:.95em;border-left-color:color-mix(in srgb,var(--iv-primary) 78%,var(--iv-surface))}
${s} .iv-rl-d2{margin-left:1.9em;border-left-color:color-mix(in srgb,var(--iv-primary) 56%,var(--iv-surface))}
${s} .iv-rl-d3{margin-left:2.85em;border-left-color:color-mix(in srgb,var(--iv-primary) 38%,var(--iv-surface))}

${s} .iv-secs{display:flex;flex-direction:column;margin-top:.4em}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}
${s} .iv-rl-contact{font-size:.82em;color:var(--iv-muted)}

${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

/* Section screen — Back bar + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

@container (max-width:320px){
  ${s} .iv-rl-d1{margin-left:.55em}
  ${s} .iv-rl-d2{margin-left:1.1em}
  ${s} .iv-rl-d3{margin-left:1.65em}
}
`;
}
