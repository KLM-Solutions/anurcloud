"use client";

/**
 * Overlap â React (TSX) card component.
 *
 * Signature (kept from the string card): a coloured ZONE at the top with a raised
 * white PLATE straddling its lower edge â the plate carries the identity and casts
 * a shadow onto the zone, so it reads as a surface sitting ON the band, not a notch
 * cut out of it.
 *
 * Digital behaviour matches the other cards: the plate is fixed chrome; below it a
 * content-first overview scrolls (bio + small sections in full + a sample of each
 * big section). A big section opens its own screen with a Back bar. Missing field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface OverlapProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function Overlap({ profile: p, theme }: OverlapProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("overlap", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.slice(2);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  // The band carries the standing facts, never the name â that is the plate's job.
  const banner = joinParts(
    [nonEmpty(p.totalYearsExperience) ? `${p.totalYearsExperience} experience` : null, p.location],
    " · ",
  );
  const contact = joinParts([p.email, p.phone], " · ");

  return (
    <div className={`${scope} iv-overlap ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* Chrome â the layered zone + raised plate. */}
          <div className="iv-ov-chrome">
            <div className="iv-ov-zone">{banner && <div className="iv-ov-banner">{banner}</div>}</div>
            <div className="iv-ov-plate">
              {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
              <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
              {contact && <div className="iv-ov-contact">{contact}</div>}
              <SocialIcons links={p.socialLinks} big />
            </div>
          </div>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-ov-about">{p.bio}</p>}

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
${s}.iv-overlap{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* Chrome â the layered zone + raised plate (the signature). Fixed, not scrolled. */
${s} .iv-ov-chrome{flex:0 0 auto;padding-bottom:.4em}
${s} .iv-ov-zone{background:var(--iv-grad);color:var(--iv-onp);min-height:4.6em;padding:.7em 1.05em 2.6em;display:flex;align-items:flex-start;justify-content:flex-end}
${s} .iv-ov-banner{font-size:.62em;font-weight:700;text-transform:uppercase;letter-spacing:.11em;color:color-mix(in srgb,var(--iv-onp) 85%,transparent);text-align:right;max-width:70%}
/* margin-top is the lift; it stays below the zone height. The shadow sells the
   layering â without it the plate reads as a notch, not a surface on the band. */
${s} .iv-ov-plate{position:relative;z-index:1;margin:-2.3em .9em 0;background:var(--iv-surface);border-radius:calc(var(--iv-radius) * .5);padding:.8em .9em;box-shadow:0 2px 4px rgba(15,23,42,.06),0 12px 24px -12px rgba(15,23,42,.28);border:1px solid color-mix(in srgb,var(--iv-muted) 14%,transparent)}
${s} .iv-ov-plate .iv-name{font-size:1.12em}
${s} .iv-ov-plate .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-ov-contact{margin-top:.3em;font-size:.72em;color:var(--iv-muted)}
${s} .iv-ov-plate .iv-socials{margin-top:.55em}

/* Scrolling body below the chrome. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:.6em 1.05em 2.8em;scrollbar-width:thin}
${s} .iv-ov-about{margin:0 0 1em}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen â Back bar + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

@container (max-width:320px){
  ${s} .iv-ov-plate{margin-left:.65em;margin-right:.65em;padding:.7em .75em}
}
`;
}
