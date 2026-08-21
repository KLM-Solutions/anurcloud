"use client";

/**
 * Numbered — React (TSX) card component.
 *
 * Signature (kept from the string card): an editorial contents page. Every section
 * sits in a left gutter behind an oversized tinted numeral; identity is section 00,
 * numbered like everything else. No rules anywhere — the numerals are the only
 * graphic element. The numbering is of what actually renders (00, 01, 02 …), so a
 * profile with no certifications never runs 01, 03, 04.
 *
 * Digital behaviour matches the other cards: 00 identity is fixed chrome; below it
 * a content-first overview scrolls (bio + numbered sections). A big section shows a
 * sample and opens its own screen (its number rides along); a small one shows in
 * full inline. Missing field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface NumberedProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Numbered({ profile: p, theme }: NumberedProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("numbered", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  // Number every rendered section 01.. in order (00 is the identity above).
  const numbered = sections.map((sec, i) => ({ sec, num: pad(i + 1) }));

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-numbered ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* Section 00 — identity, fixed chrome. */}
          <div className="iv-nb-head">
            <div className="iv-nb-row">
              <div className="iv-nb-n">00</div>
              <div className="iv-nb-c">
                {nonEmpty(p.fullName) && <div className="iv-nb-name">{p.fullName}</div>}
                <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
                {nonEmpty(p.totalYearsExperience) && <div className="iv-nb-yrs">{p.totalYearsExperience} experience</div>}
                {contact && <div className="iv-nb-contact">{contact}</div>}
                <SocialIcons links={p.socialLinks} big />
              </div>
            </div>
          </div>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-nb-about">{p.bio}</p>}

              {numbered.map(({ sec, num }, i) =>
                i >= 2 ? (
                  <button key={sec.key} type="button" className="iv-nb-row iv-nb-sec" onClick={() => setView(sec.key)}>
                    <div className="iv-nb-n">{num}</div>
                    <div className="iv-nb-c">
                      <h3 className="iv-nb-t">{sec.label}</h3>
                      <div className="iv-nb-s iv-preview">{sec.node}</div>
                      <div className="iv-nb-nav">{sec.count > 1 ? `View all ${sec.count}` : "Open"} ›</div>
                    </div>
                  </button>
                ) : (
                  <div key={sec.key} className="iv-nb-row iv-nb-inline">
                    <div className="iv-nb-n">{num}</div>
                    <div className="iv-nb-c">
                      <h3 className="iv-nb-t">{sec.label}</h3>
                      <div className="iv-preview">{sec.node}</div>
                      {sec.count > 2 && (
                        <button type="button" className="iv-ovmore-link" onClick={() => setView(sec.key)}>
                          View all {sec.count} ›
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="iv-ovfade" aria-hidden />
            {!atBottom && <div className="iv-ovmore" aria-hidden>⌄ scroll</div>}
            {atBottom && <div className="iv-ovup" aria-hidden>⌃ scroll up</div>}
          </div>
        </div>
      ) : (
        (() => {
          const hit = numbered.find(({ sec }) => sec.key === view);
          if (!hit) return null;
          return (
            <div className="iv-view">
              <div className="iv-bar">
                <button type="button" className="iv-back" onClick={() => setView("overview")}>
                  ‹ Back
                </button>
                <span className="iv-nb-bn">{hit.num}</span>
                <span className="iv-ptitle">{hit.sec.label}</span>
              </div>
              <div className="iv-pbody">{hit.sec.node}</div>
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
${s}.iv-numbered{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* The numbered gutter (the signature). Tinted, not outlined, so the numerals
   survive a print path that drops text strokes. */
${s} .iv-nb-row{display:grid;grid-template-columns:2.5em 1fr;gap:.65em;align-items:start;text-align:left}
${s} .iv-nb-n{font-family:var(--iv-font-h);font-weight:800;font-size:1.55em;line-height:.95;letter-spacing:-.04em;color:color-mix(in srgb,var(--iv-primary) 32%,var(--iv-surface))}
${s} .iv-nb-c{min-width:0}

/* Section 00 — identity, fixed. */
${s} .iv-nb-head{flex:0 0 auto;padding:1.15em 1.15em .5em}
${s} .iv-nb-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.15em;line-height:1.15;letter-spacing:.02em;text-transform:uppercase}
${s} .iv-nb-head .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-nb-yrs{font-size:.72em;color:var(--iv-muted);margin-top:.2em}
${s} .iv-nb-contact{margin-top:.3em;font-size:.72em;color:var(--iv-muted)}
${s} .iv-nb-head .iv-socials{margin-top:.55em}

/* Scrolling body. Whitespace between rows, no rules. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:.4em 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-nb-about{margin:0 0 1em}
${s} .iv-ovscroll .iv-nb-row{padding:.85em 0 0;border:0;background:none;font:inherit;color:inherit;width:100%}
${s} .iv-nb-sec{cursor:pointer}
${s} .iv-nb-sec:hover .iv-nb-nav{color:var(--iv-primary)}
${s} .iv-nb-t{font-family:var(--iv-font-h);font-size:.62em;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.4em}
${s} .iv-nb-c .iv-item+.iv-item{border-top:none;margin-top:.45em}
${s} .iv-nb-nav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

/* Section screen — Back bar (with the section's number) + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.5em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-nb-bn{font-family:var(--iv-font-h);font-weight:800;font-size:1.15em;letter-spacing:-.04em;color:color-mix(in srgb,var(--iv-primary) 32%,var(--iv-surface))}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

@container (max-width:320px){
  ${s} .iv-nb-row{grid-template-columns:2em 1fr;gap:.5em}
  ${s} .iv-nb-n{font-size:1.3em}
}
`;
}
