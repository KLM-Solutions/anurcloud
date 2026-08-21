"use client";

/**
 * Spotlight — React (TSX) card component. The second professional AVATAR card.
 *
 * Signature (kept from the string card): the identity is a large ringed portrait
 * anchored into the top-left corner — big enough to be a graphic element, pulled up
 * and left so the card's own overflow clips its ring against the corner. The name
 * sits to its right, baseline-aligned to the foot of the circle. No panel (that is
 * Badge) — the portrait runs off the edge. The circle takes an uploaded logo in
 * place of the initials.
 *
 * Body: a content-first OVERVIEW — the bio and a sample of each section show up
 * front; a big section opens its own screen with a Back bar, a small one shows
 * inline. Distinct from Letterhead (accordion). Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface SpotlightProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function Spotlight({ profile: p, theme }: SpotlightProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("spotlight", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p).filter((s) => s.key !== "contact"), [p]);
  const big = sections.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-spotlight ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* The oversized ringed portrait anchored to the corner (the signature). */}
          <header className="iv-sp-head">
            <Avatar profile={p} cls="iv-sp-av" logoUrl={resolved.logo?.url} />
            <div className="iv-sp-who">
              {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
              <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
              {nonEmpty(p.totalYearsExperience) && <div className="iv-sp-yrs">{p.totalYearsExperience} experience</div>}
              <SocialIcons links={p.socialLinks} big />
            </div>
          </header>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-sp-about">{p.bio}</p>}
              {contact && (
                <div className="iv-ovinline">
                  <div className="iv-ovh">Contact</div>
                  <div className="iv-sp-contact-row">{contact}</div>
                </div>
              )}

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
${s}.iv-spotlight{position:relative;height:537px;background:var(--iv-surface);overflow:hidden}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* The head — align-items:flex-end so the name sits at the FOOT of the portrait. */
${s} .iv-sp-head{flex:0 0 auto;display:flex;align-items:flex-end;gap:.9em;padding:1.2em 1.1em .9em;overflow:hidden;border-bottom:1px solid var(--iv-edge)}
${s} .iv-sp-av{width:5.4em;height:5.4em;flex:0 0 auto;margin:-.45em 0 -.15em -.25em;box-shadow:0 0 0 4px var(--iv-surface),0 0 0 6px color-mix(in srgb,var(--iv-primary) 28%,var(--iv-surface))}
${s} .iv-sp-who{min-width:0;padding-bottom:.15em}
${s} .iv-sp-who .iv-name{font-size:1.3em;line-height:1.15}
${s} .iv-sp-who .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.12em}
${s} .iv-sp-yrs{font-size:.7em;color:var(--iv-muted);margin-top:.2em}
${s} .iv-sp-who .iv-socials{margin-top:.5em}

/* Content-first overview. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1.1em 2.8em;scrollbar-width:thin}
${s} .iv-sp-about{margin:0 0 1em}
${s} .iv-sp-contact-row{font-size:.82em;color:var(--iv-muted)}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec:first-child,${s} .iv-ovinline:first-child{border-top:0;padding-top:.2em}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen — Back bar + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

@container (max-width:320px){
  ${s} .iv-sp-av{width:4.6em;height:4.6em}
  ${s} .iv-sp-who .iv-name{font-size:1.15em}
}
`;
}
