"use client";

/**
 * Monogram Block — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): built to break the "banner + circular
 * avatar" pattern. The colour region is a SQUARE occupying part of the width (not a
 * banner), the monogram is oversized TYPE inside it (no circle anywhere), and the
 * identity sits BESIDE the colour on white. A logo/photo is square-cropped to fill
 * the block in place of the initials.
 *
 * Body: an ACCORDION — each section is a row you tap to expand inline (first row
 * open). Distinct from Corner Wedge (grid) and Ticket Stub (receipt). Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { initials, safeUrl } from "@/templates/helpers";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, Accordion, cardTheme, type AccRow } from "./card-kit";

export interface MonogramBlockProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

/** Square monogram — logo, else square photo, else oversized initials. Not a circle. */
function Monogram({ p, logoUrl }: { p: CardProfile; logoUrl?: string | null }) {
  const logo = logoUrl ? safeUrl(logoUrl, { allowDataImage: true }) : null;
  if (logo) {
    return (
      <div className="iv-mb-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={`${nonEmpty(p.fullName) ? p.fullName + " " : ""}logo`} />
      </div>
    );
  }
  const src = p.photoUrl ? safeUrl(p.photoUrl, { allowDataImage: true }) : null;
  if (src) {
    return (
      <div className="iv-mb-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={p.fullName ?? "photo"} />
      </div>
    );
  }
  return (
    <div className="iv-mb-block">
      <span className="iv-mb-mono">{initials(p.fullName)}</span>
    </div>
  );
}

export function MonogramBlock({ profile: p, theme }: MonogramBlockProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("monogram-block", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const rows: AccRow[] = useMemo(() => {
    const secs = studentSections(p).filter((s) => s.key !== "contact");
    const out: AccRow[] = [];
    if (nonEmpty(p.bio)) out.push({ key: "about", label: "About", node: <p className="iv-bio">{p.bio}</p> });
    for (const s of secs) out.push({ key: s.key, label: s.label, node: s.node });
    return out;
  }, [p]);

  const [atBottom, setAtBottom] = useState(false);
  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-monogram-block ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Square monogram beside the identity, on white (the signature). */}
      <header className="iv-mb-head">
        <Monogram p={p} logoUrl={resolved.logo?.url} />
        <div className="iv-mb-who">
          {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
          {nonEmpty(p.designation) && <div className="iv-role">{p.designation}</div>}
          {contact && <div className="iv-cinline">{contact}</div>}
          <SocialIcons links={p.socialLinks} big />
        </div>
      </header>

      {/* Body — accordion. */}
      <div className="iv-mb-wrap">
        <div
          className="iv-mb-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          <Accordion rows={rows} />
        </div>
        <div className="iv-mb-fade" aria-hidden />
        {!atBottom && <div className="iv-mb-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-mb-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-monogram-block{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* Identity sits BESIDE the colour, on the white surface — not on a band. */
${s} .iv-mb-head{flex:0 0 auto;display:flex;align-items:center;gap:.85em;padding:1.05em 1.05em .85em;border-bottom:1px solid var(--iv-edge)}
${s} .iv-mb-who{min-width:0;flex:1 1 auto}
${s} .iv-mb-head .iv-name{font-size:1.2em;text-transform:uppercase;letter-spacing:.01em}
${s} .iv-mb-head .iv-role{font-size:.8em;color:var(--iv-muted);margin-top:.12em}
${s} .iv-mb-head .iv-cinline{font-size:.7em;color:var(--iv-muted);margin-top:.3em}
${s} .iv-mb-who .iv-socials{margin-top:.45em}

/* A SQUARE, part-width block — not a banner, not round. */
${s} .iv-mb-block{flex:0 0 auto;width:4.6em;aspect-ratio:1;background:var(--iv-grad);border-radius:calc(var(--iv-radius) * .28);display:flex;align-items:center;justify-content:center;overflow:hidden}
${s} .iv-mb-block img{width:100%;height:100%;object-fit:cover}
${s} .iv-mb-mono{font-family:var(--iv-font-h);font-weight:700;font-size:1.7em;line-height:1;letter-spacing:.03em;color:var(--iv-onp)}

/* Body — scrolling accordion. */
${s} .iv-mb-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-mb-scroll{position:absolute;inset:0;overflow-y:auto;padding:.2em 1.05em 2.8em;scrollbar-width:thin}
${s} .iv-mb-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-mb-more,${s} .iv-mb-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:310px){
  ${s} .iv-mb-block{width:3.6em}
  ${s} .iv-mb-mono{font-size:1.3em}
}
`;
}
