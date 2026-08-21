"use client";

/**
 * Folder Tab — React (TSX) card component.
 *
 * Redesigned so it is NOT another "coloured block on top + scroll" (that made it
 * read like Overlap). The signature here is a real FOLDER: a row of tabs across
 * the top IS the navigation. The active tab is raised and coloured and merges into
 * the sheet below; the others sit behind it. Tapping a tab swaps the sheet's
 * content — no Back needed, the tabs stay put. The tab strip scrolls sideways when
 * there are many, exactly like the tabs of a fat folder.
 *
 *   ┌ Priya Menon · VP Eng ·  (icons) ┐   ← identity header (persistent)
 *   ╭─────╮ ╭──────╮ ╭───────╮
 *   │Over.│ │Exper.│ │Skills │ …           ← folder tabs (active = coloured)
 *   ┴─────┴─┴──────┴─┴───────┴──────────    ← rule; active tab merges in
 *   │  content of the selected tab  │        ← sheet, scrolls (⌄ / ⌃ cue)
 *
 * Overview holds the bio + all the small sections; every big section is its own
 * tab. Missing field → no tab. Identity + social icons stay in the header, visible
 * on every tab without scrolling.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface FolderTabProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function FolderTab({ profile: p, theme }: FolderTabProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("folder-tab", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.filter(isBig);
  const small = sections.filter((s) => !isBig(s));

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const tabs = [{ key: "overview", label: "Overview" }, ...big.map((b) => ({ key: b.key, label: b.label }))];
  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  const onScroll = (e: React.UIEvent<HTMLDivElement>) =>
    setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4);

  return (
    <div className={`${scope} iv-folder-tab ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Identity header — persistent across tabs. */}
      <header className="iv-ft-id">
        {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
        <div className="iv-role">{joinParts([p.designation, p.currentCompany, nonEmpty(p.totalYearsExperience) ? `${p.totalYearsExperience} exp.` : null])}</div>
        <SocialIcons links={p.socialLinks} big />
      </header>

      {/* The folder tabs — the navigation and the signature. */}
      <nav className="iv-ft-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            className={`iv-ft-tab${view === t.key ? " iv-ft-on" : ""}`}
            onClick={() => {
              setView(t.key);
              setAtBottom(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* The sheet — content of the active tab. */}
      <div className="iv-ft-sheet">
        <div className="iv-ft-scroll" onScroll={onScroll}>
          {view === "overview" ? (
            <>
              {nonEmpty(p.bio) && <p className="iv-bio iv-ft-about">{p.bio}</p>}
              {contact && (
                <div className="iv-ft-sec">
                  <div className="iv-ft-h">Contact</div>
                  <div className="iv-ft-contact">{contact}</div>
                </div>
              )}
              {small.map((sec) => (
                <div key={sec.key} className="iv-ft-sec">
                  <div className="iv-ft-h">{sec.label}</div>
                  {sec.node}
                </div>
              ))}
              {small.length === 0 && !nonEmpty(p.bio) && !contact && <div className="iv-ft-h">Pick a tab above ↑</div>}
            </>
          ) : (
            (() => {
              const sec = big.find((b) => b.key === view);
              if (!sec) return null;
              return (
                <div className="iv-ft-sec">
                  <div className="iv-ft-h">{sec.label}</div>
                  {sec.node}
                </div>
              );
            })()
          )}
        </div>
        <div className="iv-ft-fade" aria-hidden />
        {!atBottom && <div className="iv-ft-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-ft-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-folder-tab{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* Identity header — persistent, white, so the colour belongs to the tabs. */
${s} .iv-ft-id{flex:0 0 auto;padding:1.05em 1.15em .85em}
${s} .iv-ft-id .iv-name{font-size:1.2em}
${s} .iv-ft-id .iv-role{font-size:.8em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-ft-id .iv-socials{margin-top:.6em}

/* The folder tabs. A sideways-scrolling strip; the active tab is filled and
   rounded at the top and overlaps the rule so it merges into the sheet below. */
${s} .iv-ft-tabs{flex:0 0 auto;display:flex;gap:.25em;padding:0 .7em;overflow-x:auto;scrollbar-width:none;border-bottom:.24em solid var(--iv-primary)}
${s} .iv-ft-tabs::-webkit-scrollbar{display:none}
${s} .iv-ft-tab{flex:0 0 auto;margin-bottom:-.24em;padding:.5em .8em .55em;border:0;background:color-mix(in srgb,var(--iv-primary) 12%,var(--iv-surface));color:var(--iv-muted);font-family:var(--iv-font-h);font-weight:700;font-size:.68em;letter-spacing:.04em;border-radius:.6em .6em 0 0;cursor:pointer;white-space:nowrap;transition:background .12s,color .12s}
${s} .iv-ft-tab:hover{color:var(--iv-primary)}
${s} .iv-ft-on{background:var(--iv-grad);color:var(--iv-onp)}
${s} .iv-ft-on:hover{color:var(--iv-onp)}

/* The sheet — the active tab's content, scrolling with a cue. */
${s} .iv-ft-sheet{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-ft-scroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-ft-about{margin:0 0 1em}
${s} .iv-ft-sec+.iv-ft-sec{margin-top:1em}
${s} .iv-ft-h{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ft-contact{font-size:.82em;color:var(--iv-muted)}
${s} .iv-ft-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ft-more,${s} .iv-ft-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:320px){
  ${s} .iv-ft-tab{padding:.45em .65em .5em;font-size:.64em}
}
`;
}
