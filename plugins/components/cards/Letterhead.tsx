"use client";

/**
 * Letterhead — React (TSX) card component.
 *
 * Signature (kept from the string card): a business letterhead. A heavy rule above
 * the name and a hairline rule below the header block; contact set right-aligned
 * BESIDE the name rather than under it; generous margins; no fill of any kind — the
 * only colour is in the rules.
 *
 * Body (after the header): an ACCORDION — each section is a row you tap to expand
 * inline (no separate screen). The first row opens on load. Missing field → no row.
 * Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, nonEmpty, joinParts, styleObject, SocialIcons, Accordion, cardTheme, type AccRow } from "./card-kit";

export interface LetterheadProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function Letterhead({ profile: p, theme }: LetterheadProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("letterhead", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Contact rides in the header; drop it from the accordion rows.
  const rows: AccRow[] = useMemo(() => {
    const secs = professionalSections(p).filter((s) => s.key !== "contact");
    const out: AccRow[] = [];
    if (nonEmpty(p.bio)) out.push({ key: "profile", label: "Profile", node: <p className="iv-bio">{p.bio}</p> });
    for (const s of secs) out.push({ key: s.key, label: s.label, node: s.node });
    return out;
  }, [p]);

  const [atBottom, setAtBottom] = useState(false);
  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contactLines = [p.email, p.phone, p.location].filter(nonEmpty);

  return (
    <div className={`${scope} iv-letterhead ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* The letterhead header (the signature) — fixed chrome. */}
      <header className="iv-lh-head">
        <div className="iv-lh-id">
          {nonEmpty(p.fullName) && <div className="iv-lh-name">{p.fullName}</div>}
          <div className="iv-lh-role">{joinParts([p.designation, p.currentCompany])}</div>
          {nonEmpty(p.totalYearsExperience) && <div className="iv-lh-yrs">{p.totalYearsExperience} experience</div>}
          <SocialIcons links={p.socialLinks} big />
        </div>
        {contactLines.length > 0 && (
          <div className="iv-lh-contact">
            {contactLines.map((v, i) => (
              <div key={i}>{v}</div>
            ))}
          </div>
        )}
      </header>

      {/* Body — accordion of sections. */}
      <div className="iv-lh-wrap">
        <div
          className="iv-lh-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          <Accordion rows={rows} />
        </div>
        <div className="iv-lh-fade" aria-hidden />
        {!atBottom && <div className="iv-lh-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-lh-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-letterhead{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* The letterhead header — no fill; a heavy rule over the name and a hairline under
   the whole block. Contact is a right-aligned column beside the name. */
${s} .iv-lh-head{flex:0 0 auto;margin:1.3em 1.4em 0;display:flex;align-items:flex-start;justify-content:space-between;gap:1em;border-top:2.5px solid var(--iv-primary);padding:.75em 0;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 32%,transparent)}
${s} .iv-lh-id{min-width:0;flex:1 1 auto}
${s} .iv-lh-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.2em;line-height:1.15;letter-spacing:.06em;text-transform:uppercase}
${s} .iv-lh-role{font-size:.72em;color:var(--iv-muted);margin-top:.3em;letter-spacing:.02em}
${s} .iv-lh-yrs{font-size:.66em;color:var(--iv-muted);margin-top:.25em}
${s} .iv-lh-id .iv-socials{margin-top:.6em}
${s} .iv-lh-contact{flex:0 1 auto;text-align:right;font-size:.66em;line-height:1.65;color:var(--iv-muted);overflow-wrap:anywhere;max-width:48%}

/* Body — scrolling accordion, generous side margins (a narrow measure). */
${s} .iv-lh-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-lh-scroll{position:absolute;inset:0;overflow-y:auto;padding:.2em 1.4em 2.8em;scrollbar-width:thin}
${s} .iv-lh-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-lh-more,${s} .iv-lh-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:320px){
  ${s} .iv-lh-head{flex-direction:column;gap:.5em;margin:1.1em 1.05em 0}
  ${s} .iv-lh-contact{text-align:left;max-width:100%}
  ${s} .iv-lh-scroll{padding-left:1.05em;padding-right:1.05em}
}
`;
}
