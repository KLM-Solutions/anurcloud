"use client";

/**
 * Skill Meters â React (TSX) card component.
 *
 * Dynamic digital card as a real React component: `<SkillMeters profile={...} />`.
 * Navigation is React state; the scroll cue is a real scroll handler. Renders to
 * plain HTML+CSS in the browser (React does that) â authored as a component so it
 * drops into a React/TypeScript app.
 *
 * Signature: the skill-meters chart leads the overview â bars count how often a
 * skill appears in the person's own role highlights (evidence), captioned as such,
 * never a proficiency rating and never a percentage of a declared scale.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { measuredSkills } from "@/templates/guards";
import { professionalSections, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface SkillMetersProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function SkillMeters({ profile: p, theme }: SkillMetersProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("skill-meters", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.slice(2);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const chartRows = useMemo(() => measuredSkills(p, 6), [p]);
  const chartTop = chartRows.length ? Math.max(...chartRows.map((r) => r.count)) : 1;

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  return (
    <div className={`${scope} iv-skill-meters ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          <header className="iv-sm-head">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
            {nonEmpty(p.totalYearsExperience) && <div className="iv-sm-yrs">{p.totalYearsExperience} of experience</div>}
            <SocialIcons links={p.socialLinks} big />
          </header>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-sm-about">{p.bio}</p>}

              {chartRows.length > 0 && (
                <div className="iv-sm-chart">
                  {chartRows.map((r) => (
                    <div key={r.skill} className="iv-sm-row">
                      <div className="iv-sm-k">{r.skill}</div>
                      <div className="iv-sm-track">
                        <div className="iv-sm-fill" style={{ width: `${Math.max(8, Math.round((r.count / chartTop) * 100))}%` }} />
                      </div>
                      <div className="iv-sm-n">{r.count}</div>
                    </div>
                  ))}
                  <p className="iv-sm-cap">Bars count how often each skill appears in the role highlights â not a proficiency rating.</p>
                </div>
              )}

              <div className="iv-secs">
                {sections.map((sec, i) =>
                  i >= 2 ? (
                    <button key={sec.key} type="button" className="iv-ovsec" onClick={() => setView(sec.key)}>
                      <div className="iv-ovh">{sec.label}</div>
                      <div className="iv-ovs iv-preview">{sec.node}</div>
                      <div className="iv-ovnav">{sec.count > 1 ? `View all ${sec.count}` : "Open"} ›</div>
                    </button>
                  ) : (
                    <div key={sec.key} className="iv-ovinline">
                      <div className="iv-ovh">{sec.label}</div>
                      <div className="iv-preview">{sec.node}</div>{sec.count > 2 && (<button type="button" className="iv-ovmore-link" onClick={() => setView(sec.key)}>View all {sec.count} ›</button>)}
                    </div>
                  ),
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
          const sec = big.find((b) => b.key === view);
          if (!sec) return null;
          return (
            <div className="iv-view">
              <div className="iv-bar">
                <button type="button" className="iv-back" onClick={() => setView("overview")}>
                  â¹ Back
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
${s}.iv-skill-meters{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}
${s} .iv-sm-head{padding:1.1em 1.2em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-sm-head .iv-name{font-size:1.25em}
${s} .iv-sm-head .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-sm-yrs{font-size:.72em;color:var(--iv-muted);margin-top:.2em}
${s} .iv-sm-head .iv-socials{margin-top:.6em}
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1.1em 1.2em 2.8em;scrollbar-width:thin}
${s} .iv-sm-about{margin:0 0 1em}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
${s} .iv-sm-row{display:grid;grid-template-columns:6em 1fr 1.2em;align-items:center;gap:.5em}
${s} .iv-sm-row+.iv-sm-row{margin-top:.42em}
${s} .iv-sm-k{font-size:.72em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${s} .iv-sm-track{height:.5em;border-radius:999px;background:color-mix(in srgb,var(--iv-muted) 16%,transparent);overflow:hidden}
${s} .iv-sm-fill{height:100%;border-radius:999px;background:var(--iv-grad)}
${s} .iv-sm-n{font-family:var(--iv-font-h);font-size:.64em;font-weight:700;color:var(--iv-muted);text-align:right}
${s} .iv-sm-cap{margin-top:.6em;font-size:.6em;line-height:1.5;color:var(--iv-muted)}
${s} .iv-secs{display:flex;flex-direction:column;margin-top:1em}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}
`;
}
