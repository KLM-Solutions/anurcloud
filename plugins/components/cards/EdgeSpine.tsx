"use client";

/**
 * Edge Spine — React (TSX) card component.
 *
 * Signature (kept from the string card): the name is set VERTICALLY on the right
 * edge as a coloured spine, like the spine of a book. The body sits beside it on
 * the left, and the role — not the name — is the largest type in the body. The
 * spine is narrow (a strip, not a half), which is what tells it apart from Split
 * Halves' 50/50 coloured menu.
 *
 * Digital behaviour: the spine + identity header are persistent chrome; the left
 * body shows a content-first overview that scrolls (bio + sections). A big section
 * opens its own screen (in the body, spine stays) with a Back bar; a small one
 * shows inline. Missing field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface EdgeSpineProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function EdgeSpine({ profile: p, theme }: EdgeSpineProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("edge-spine", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-edge-spine ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      <div className="iv-es-wrap">
        {/* LEFT — body */}
        <div className="iv-es-body">
          <header className="iv-es-head">
            <div className="iv-es-role">{joinParts([p.designation, p.currentCompany]) || (nonEmpty(p.fullName) ? p.fullName : "")}</div>
            {nonEmpty(p.totalYearsExperience) && <div className="iv-es-yrs">{p.totalYearsExperience} experience</div>}
            {contact && <div className="iv-es-contact">{contact}</div>}
            <SocialIcons links={p.socialLinks} big />
          </header>

          <div className="iv-es-region">
            {view === "overview" ? (
              <>
                <div
                  className="iv-ovscroll"
                  onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
                >
                  {nonEmpty(p.bio) && <p className="iv-bio iv-es-about">{p.bio}</p>}
                  <div className="iv-secs">
                    {sections.map((sec) =>
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
                  </div>
                </div>
                <div className="iv-ovfade" aria-hidden />
                {!atBottom && <div className="iv-ovmore" aria-hidden>⌄ scroll</div>}
                {atBottom && <div className="iv-ovup" aria-hidden>⌃ scroll up</div>}
              </>
            ) : (
              (() => {
                const sec = big.find((b) => b.key === view);
                if (!sec) return null;
                return (
                  <>
                    <div className="iv-bar">
                      <button type="button" className="iv-back" onClick={() => setView("overview")}>
                        ‹ Back
                      </button>
                      <span className="iv-ptitle">{sec.label}</span>
                    </div>
                    <div className="iv-pbody">{sec.node}</div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* RIGHT — the vertical name spine (the signature). */}
        {nonEmpty(p.fullName) && (
          <div className="iv-es-spine">
            <span className="iv-es-name">{p.fullName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-edge-spine{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-es-wrap{position:absolute;inset:0;display:flex;align-items:stretch}

/* LEFT — body. */
${s} .iv-es-body{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}
${s} .iv-es-head{flex:0 0 auto;padding:1.15em 1em .75em 1.15em;border-bottom:1px solid var(--iv-edge)}
/* The role is the largest type in the body — the name lives on the spine. */
${s} .iv-es-role{font-family:var(--iv-font-h);font-weight:700;font-size:1.05em;line-height:1.2}
${s} .iv-es-yrs{font-size:.72em;color:var(--iv-muted);margin-top:.25em}
${s} .iv-es-contact{font-size:.72em;color:var(--iv-muted);margin-top:.3em}
${s} .iv-es-head .iv-socials{margin-top:.6em}

/* The switching content region (overview scroll / opened section). */
${s} .iv-es-region{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1em 2.8em 1.15em;scrollbar-width:thin}
${s} .iv-es-about{margin:0 0 1em}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.6em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen inside the body region. */
${s} .iv-bar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);background:var(--iv-surface);z-index:1}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{position:absolute;inset:0;overflow-y:auto;padding:3.2em 1em 1.2em 1.15em}

/* RIGHT — the vertical name spine. Narrow strip, sized to content up to a cap. */
${s} .iv-es-spine{flex:0 0 auto;max-width:5.5em;background:var(--iv-grad);color:var(--iv-onp);display:flex;padding:1.05em .55em}
${s} .iv-es-name{writing-mode:vertical-rl;text-orientation:mixed;text-align:center;font-family:var(--iv-font-h);font-weight:700;font-size:1.05em;line-height:1.3;letter-spacing:.07em;text-transform:uppercase}

@container (max-width:320px){
  ${s} .iv-es-spine{max-width:3.6em;padding:.85em .45em}
  ${s} .iv-es-name{font-size:.95em}
}
`;
}
