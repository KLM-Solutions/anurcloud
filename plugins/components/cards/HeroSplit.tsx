"use client";

/**
 * Hero Split — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): a coloured HERO BAND across the top with
 * the avatar + name + course set ON the colour (no professional card does this),
 * then a body that genuinely SPLITS into two columns. Here the small sections fill
 * that two-column grid (the split); big sections open their own screen full-width.
 *
 * Digital behaviour: the hero band is fixed chrome (with the social icons); below
 * it a content-first overview scrolls — bio full width, small sections in a 2-col
 * grid, big sections as open-a-screen rows. Missing field → no section. Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, isBig, nonEmpty, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface HeroSplitProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function HeroSplit({ profile: p, theme }: HeroSplitProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("hero-split", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => studentSections(p), [p]);
  const small = sections.filter((sec) => !isBig(sec));
  const big = sections.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  return (
    <div className={`${scope} iv-hero-split ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* The coloured hero band (the signature) — fixed chrome. */}
          <header className="iv-hs-hero">
            <Avatar profile={p} cls="iv-hs-av" logoUrl={resolved.logo?.url} />
            <div className="iv-hs-id">
              {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
              {nonEmpty(p.designation) && <div className="iv-hs-role">{p.designation}</div>}
              <SocialIcons links={p.socialLinks} big />
            </div>
          </header>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-hs-about">{p.bio}</p>}

              {/* Small sections — the two-column split. */}
              {small.length > 0 && (
                <div className="iv-hs-grid">
                  {small.map((sec) => (
                    <div key={sec.key} className="iv-hs-cell">
                      <div className="iv-ovh">{sec.label}</div>
                      {sec.node}
                    </div>
                  ))}
                </div>
              )}

              {/* Big sections — full width, open their own screen. */}
              <div className="iv-secs">
                {big.map((sec) => (
                  <button key={sec.key} type="button" className="iv-ovsec" onClick={() => setView(sec.key)}>
                    <div className="iv-ovh">{sec.label}</div>
                    <div className="iv-ovs">{sec.node}</div>
                    <div className="iv-ovnav">{sec.count > 1 ? `View all ${sec.count}` : "Open"} ›</div>
                  </button>
                ))}
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
${s}.iv-hero-split{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* The coloured hero band — avatar + name + course set ON the colour. */
${s} .iv-hs-hero{flex:0 0 auto;background:var(--iv-grad);color:var(--iv-onp);padding:1.2em 1em;display:flex;align-items:center;gap:.8em}
${s} .iv-hs-av{width:3.4em;height:3.4em;flex:0 0 auto;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 45%,transparent)}
${s} .iv-hs-hero .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-hs-id{min-width:0}
${s} .iv-hs-hero .iv-name{color:var(--iv-onp);font-size:1.2em}
${s} .iv-hs-role{font-size:.78em;color:color-mix(in srgb,var(--iv-onp) 80%,transparent);margin-top:.15em}
${s} .iv-hs-hero .iv-socials{margin-top:.55em}

/* Scrolling body. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1em 2.8em;scrollbar-width:thin}
${s} .iv-hs-about{margin:0 0 1em}

/* The split — small sections in two columns. */
${s} .iv-hs-grid{display:grid;grid-template-columns:1fr 1fr;gap:1em}
${s} .iv-hs-cell{min-width:0}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column;margin-top:.4em}
${s} .iv-ovsec{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit;cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen — Back bar + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

/* Responsive: the split is the first thing to go on a narrow container. */
@container (max-width:340px){
  ${s} .iv-hs-grid{grid-template-columns:1fr}
}
`;
}
