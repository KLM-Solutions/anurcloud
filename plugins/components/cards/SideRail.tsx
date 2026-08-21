"use client";

/**
 * Side Rail — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): two columns read left-to-right, no top
 * banner. A full-height coloured RAIL on the left carries the avatar, contact,
 * languages and social icons; the white main column on the right carries the name,
 * the about text and the sections. Contact lives in the rail, not the body — the
 * point of the student batch is that the skeletons differ, not the paint.
 *
 * Digital behaviour: the rail is persistent chrome (identity + icons, always
 * visible); the main column shows a content-first overview that scrolls (about +
 * sections). A big section opens its own screen (in the main column, rail stays)
 * with a Back bar; a small one shows inline. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, Chips, cardTheme } from "./card-kit";

export interface SideRailProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function SideRail({ profile: p, theme }: SideRailProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("side-rail", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Contact, languages and links live in the rail; keep them out of the main column.
  const sections = useMemo(
    () => studentSections(p).filter((s) => !["contact", "languages", "links"].includes(s.key)),
    [p],
  );
  const big = sections.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contactLines = [p.email, p.phone, p.location].filter(nonEmpty);

  return (
    <div className={`${scope} iv-side-rail ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      <div className="iv-sr-wrap">
        {/* LEFT — the coloured rail (persistent). */}
        <aside className="iv-sr-rail">
          <Avatar profile={p} cls="iv-sr-av" logoUrl={resolved.logo?.url} />
          {contactLines.length > 0 && (
            <div className="iv-sr-block iv-sr-contact">
              {contactLines.map((v, i) => (
                <div key={i}>{v}</div>
              ))}
            </div>
          )}
          {p.languages.length > 0 && (
            <div className="iv-sr-block">
              <Chips items={p.languages} />
            </div>
          )}
          <div className="iv-sr-block iv-sr-social">
            <SocialIcons links={p.socialLinks} big />
          </div>
        </aside>

        {/* RIGHT — the main column. */}
        <main className="iv-sr-main">
          <header className="iv-sr-head">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
          </header>

          <div className="iv-sr-region">
            {view === "overview" ? (
              <>
                <div
                  className="iv-ovscroll"
                  onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
                >
                  {nonEmpty(p.bio) && <p className="iv-bio iv-sr-about">{p.bio}</p>}
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
        </main>
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-side-rail{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-sr-wrap{position:absolute;inset:0;display:flex;align-items:stretch}

/* LEFT — coloured rail. 38%, wide enough that an email does not break mid-word. */
${s} .iv-sr-rail{flex:0 0 38%;max-width:38%;background:var(--iv-grad);color:var(--iv-onp);padding:1.1em .6em;display:flex;flex-direction:column;align-items:center;gap:.8em;text-align:center;overflow-y:auto;scrollbar-width:thin}
${s} .iv-sr-av{width:3.6em;height:3.6em;flex:0 0 auto;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 45%,transparent)}
${s} .iv-sr-rail .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-sr-block{width:100%}
${s} .iv-sr-contact{font-size:.72em;line-height:1.5;color:color-mix(in srgb,var(--iv-onp) 92%,transparent);overflow-wrap:anywhere}
${s} .iv-sr-rail .iv-chips{justify-content:center}
${s} .iv-sr-rail .iv-chip{background:color-mix(in srgb,var(--iv-onp) 20%,transparent);color:var(--iv-onp)}
${s} .iv-sr-social{display:flex;justify-content:center}
${s} .iv-sr-rail .iv-socials{justify-content:center}

/* RIGHT — main column. */
${s} .iv-sr-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;background:var(--iv-surface)}
${s} .iv-sr-head{flex:0 0 auto;padding:1.1em 1em .75em;border-bottom:1px solid var(--iv-edge)}
${s} .iv-sr-head .iv-name{font-size:1.2em}
${s} .iv-sr-head .iv-role{font-size:.8em;color:var(--iv-muted);margin-top:.15em}

${s} .iv-sr-region{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1em 2.8em;scrollbar-width:thin}
${s} .iv-sr-about{margin:0 0 1em}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.6em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec:first-child,${s} .iv-ovinline:first-child{border-top:0;padding-top:.2em}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen inside the main column. */
${s} .iv-bar{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);background:var(--iv-surface);z-index:1}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{position:absolute;inset:0;overflow-y:auto;padding:3.2em 1em 1.2em}

@container (max-width:320px){
  ${s} .iv-sr-rail{padding:.9em .5em}
  ${s} .iv-sr-av{width:3em;height:3em}
}
`;
}
