"use client";

/**
 * Split Halves — React (TSX) card component.
 *
 * A different interaction from Skill Meters: a persistent 50/50 split where the
 * split IS the navigation. The RIGHT half (coloured — the signature) holds the
 * identity and a vertical menu of sections; the LEFT half (white) shows the
 * selected section's content. Tapping a menu item swaps the left content (React
 * state) — the menu stays visible, no back needed. The left content scrolls with
 * a scroll cue.
 *
 * Small sections are grouped under "Overview" (shown in full); big sections are
 * their own menu items. Missing field → no menu item.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface SplitHalvesProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function SplitHalves({ profile: p, theme }: SplitHalvesProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("split-halves", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.filter(isBig);
  const small = sections.filter((s) => !isBig(s));

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const menu = [{ key: "overview", label: "Overview" }, ...big.map((b) => ({ key: b.key, label: b.label }))];
  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  return (
    <div className={`${scope} iv-split-halves ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      <div className="iv-hl-wrap">
        {/* LEFT — content (the selected view) */}
        <main className="iv-hl-content">
          <div
            className="iv-hl-pscroll"
            onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
          >
            {view === "overview" ? (
              <>
                {nonEmpty(p.bio) && <p className="iv-bio iv-hl-about">{p.bio}</p>}
                {small.map((s) => (
                  <div key={s.key} className="iv-hl-sec">
                    <div className="iv-hl-h">{s.label}</div>
                    {s.node}
                  </div>
                ))}
                {small.length === 0 && !nonEmpty(p.bio) && <div className="iv-hl-h">Select a section →</div>}
              </>
            ) : (
              (() => {
                const sec = big.find((b) => b.key === view);
                if (!sec) return null;
                return (
                  <>
                    <div className="iv-hl-h iv-hl-h-top">{sec.label}</div>
                    {sec.node}
                  </>
                );
              })()
            )}
          </div>
          <div className="iv-hl-fade" aria-hidden />
          {!atBottom && <div className="iv-hl-more" aria-hidden>⌄ scroll</div>}
          {atBottom && <div className="iv-hl-up" aria-hidden>⌃ scroll up</div>}
        </main>

        {/* RIGHT — coloured menu with identity */}
        <aside className="iv-hl-menu">
          <div className="iv-hl-id">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
            {nonEmpty(p.totalYearsExperience) && <div className="iv-hl-yrs">{p.totalYearsExperience} experience</div>}
            <SocialIcons links={p.socialLinks} big />
          </div>
          <nav className="iv-hl-nav">
            {menu.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`iv-hl-item${view === m.key ? " iv-hl-active" : ""}`}
                onClick={() => {
                  setView(m.key);
                  setAtBottom(false);
                }}
              >
                <span className="iv-hl-dot" aria-hidden>▸</span>
                {m.label}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-split-halves{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-hl-wrap{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr}

${s} .iv-hl-content{position:relative;min-width:0;overflow:hidden}
${s} .iv-hl-pscroll{position:absolute;inset:0;overflow-y:auto;padding:1.1em 1em 2.6em;scrollbar-width:thin}
${s} .iv-hl-about{margin:0 0 1em}
${s} .iv-hl-sec+.iv-hl-sec{margin-top:1em}
${s} .iv-hl-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.09em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-hl-h-top{margin-top:0}
${s} .iv-hl-content .iv-item-t{font-size:.82em}
${s} .iv-hl-content .iv-item-m{font-size:.72em}
${s} .iv-hl-fade{position:absolute;left:0;right:0;bottom:0;height:2.6em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-hl-more,${s} .iv-hl-up{position:absolute;left:25%;bottom:.4em;transform:translateX(-50%);font-size:.58em;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-hl-menu{background:var(--iv-grad);color:var(--iv-onp);padding:1.2em .9em;min-width:0;display:flex;flex-direction:column;gap:1em;overflow-y:auto}
${s} .iv-hl-id .iv-name{color:var(--iv-onp);font-size:1.1em;line-height:1.15}
${s} .iv-hl-id .iv-role{color:color-mix(in srgb,var(--iv-onp) 85%,transparent);font-size:.74em;margin-top:.2em}
${s} .iv-hl-yrs{color:color-mix(in srgb,var(--iv-onp) 78%,transparent);font-size:.68em;margin-top:.25em}
${s} .iv-hl-id .iv-socials{margin-top:.6em}
${s} .iv-hl-nav{display:flex;flex-direction:column;gap:.3em}
${s} .iv-hl-item{display:flex;align-items:center;gap:.4em;padding:.5em .6em;border-radius:.5em;font-size:.78em;font-weight:700;color:var(--iv-onp);cursor:pointer;user-select:none;border:0;background:none;font-family:inherit;text-align:left;transition:background .12s}
${s} .iv-hl-item:hover{background:color-mix(in srgb,var(--iv-onp) 16%,transparent)}
${s} .iv-hl-active{background:var(--iv-onp);color:var(--iv-primary)}
${s} .iv-hl-dot{opacity:.7}

@container (max-width:300px){
  ${s} .iv-hl-wrap{grid-template-columns:1fr;grid-template-rows:auto 1fr}
  ${s} .iv-hl-menu{order:-1}
  ${s} .iv-hl-more,${s} .iv-hl-up{left:50%}
}
`;
}
