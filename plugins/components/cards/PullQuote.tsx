"use client";

/**
 * Pull Quote — React (TSX) card component.
 *
 * Signature (kept from the string card): the bio is set as a big DISPLAY QUOTE and
 * that quote IS the card — the largest type on it. The name is demoted to a small
 * attribution caption below the quote (name as byline, not headline). No fill; the
 * only colour is in the oversized quote mark and the attribution rule. Hierarchy is
 * done entirely with type size.
 *
 * Digital behaviour matches the other cards: the quote hero + attribution (with the
 * social icons) is fixed chrome; below it a content-first overview scrolls. A big
 * section opens its own screen with a Back bar; a small one shows inline. Missing
 * field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface PullQuoteProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function PullQuote({ profile: p, theme }: PullQuoteProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("pull-quote", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.filter(isBig);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");
  const quote = nonEmpty(p.bio) ? p.bio.trim() : joinParts([p.designation, p.currentCompany]);

  return (
    <div className={`${scope} iv-pull-quote ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* The display quote hero (the signature) — fixed chrome. */}
          <figure className="iv-pq-hero">
            <span className="iv-pq-mark" aria-hidden>“</span>
            <blockquote className="iv-pq-q">{quote}</blockquote>
            <span className="iv-pq-rule" aria-hidden />
            <figcaption className="iv-pq-by">
              {nonEmpty(p.fullName) && <div className="iv-pq-name">{p.fullName}</div>}
              {nonEmpty(p.bio) && <div className="iv-role">{joinParts([p.designation, p.currentCompany, nonEmpty(p.totalYearsExperience) ? `${p.totalYearsExperience} exp.` : null])}</div>}
              {contact && <div className="iv-pq-contact">{contact}</div>}
              <SocialIcons links={p.socialLinks} big />
            </figcaption>
          </figure>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
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
${s}.iv-pull-quote{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* The display quote hero — no fill; colour only in the mark and the rule. Fixed
   chrome: it sizes to the quote and does NOT scroll (only the body below does). */
${s} .iv-pq-hero{flex:0 0 auto;padding:1em 1.2em .8em}
${s} .iv-pq-mark{display:block;font-family:var(--iv-font-h);font-weight:800;font-size:2.3em;line-height:.72;color:color-mix(in srgb,var(--iv-primary) 34%,var(--iv-surface))}
/* The largest type on the card, and the reason the layout exists. */
${s} .iv-pq-q{font-family:var(--iv-font-h);font-weight:600;font-size:1.1em;line-height:1.3;letter-spacing:-.01em;color:var(--iv-text);margin:.05em 0 0}
${s} .iv-pq-rule{display:block;width:2.4em;height:2.5px;background:var(--iv-primary);margin:.7em 0 .5em}
/* Deliberately small — the name is the attribution here, not the headline. */
${s} .iv-pq-name{font-family:var(--iv-font-h);font-weight:700;font-size:.82em;letter-spacing:.13em;text-transform:uppercase;line-height:1.3}
${s} .iv-pq-by .iv-role{font-size:.72em;margin-top:.1em;color:var(--iv-muted)}
${s} .iv-pq-contact{font-size:.72em;color:var(--iv-muted);margin-top:.3em}
${s} .iv-pq-by .iv-socials{margin-top:.6em}

/* Scrolling body below the hero. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0;border-top:1px solid var(--iv-edge)}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:.9em 1.2em 2.8em;scrollbar-width:thin}
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
  ${s} .iv-pq-hero{padding:.9em 1em .8em}
  ${s} .iv-pq-q{font-size:1em}
  ${s} .iv-pq-mark{font-size:2em}
}
`;
}
