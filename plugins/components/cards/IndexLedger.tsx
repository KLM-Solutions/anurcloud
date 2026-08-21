"use client";

/**
 * Index Ledger — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): a spec sheet. A narrow right-aligned LABEL
 * gutter runs down the left, values in the wide column beside it, one hairline per
 * row. Section headings sit BESIDE their content, never above — no other layout
 * does that. No colour block: colour lives only in the gutter labels and the top
 * rule.
 *
 * Interaction matches the ledger: a single continuous scroll of label|value rows
 * (no tabs, no open-a-screen — a ledger reads straight down). Identity rows are
 * fixed chrome (Name / Course / Contact / Online, the last carrying the icons).
 * Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface IndexLedgerProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function IndexLedger({ profile: p, theme }: IndexLedgerProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("index-ledger", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Contact + links ride in the head rows; keep them out of the detail rows.
  const rows = useMemo(() => studentSections(p).filter((s) => !["contact", "links"].includes(s.key)), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-index-ledger ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Identity rows — fixed chrome, under the top rule. */}
      <div className="iv-il-head">
        {nonEmpty(p.fullName) && (
          <div className="iv-il-row">
            <div className="iv-il-k">Name</div>
            <div className="iv-il-v">
              <span className="iv-name">{p.fullName}</span>
            </div>
          </div>
        )}
        {nonEmpty(p.designation) && (
          <div className="iv-il-row">
            <div className="iv-il-k">Course</div>
            <div className="iv-il-v">{p.designation}</div>
          </div>
        )}
        {contact && (
          <div className="iv-il-row">
            <div className="iv-il-k">Contact</div>
            <div className="iv-il-v">{contact}</div>
          </div>
        )}
        {p.socialLinks.length > 0 && (
          <div className="iv-il-row">
            <div className="iv-il-k">Online</div>
            <div className="iv-il-v">
              <SocialIcons links={p.socialLinks} big />
            </div>
          </div>
        )}
      </div>

      {/* Detail rows — the scrolling ledger. */}
      <div className="iv-il-wrap">
        <div
          className="iv-il-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && (
            <div className="iv-il-row">
              <div className="iv-il-k">About</div>
              <div className="iv-il-v">
                <p className="iv-bio">{p.bio}</p>
              </div>
            </div>
          )}
          {rows.map((sec) => (
            <div key={sec.key} className="iv-il-row">
              <div className="iv-il-k">{sec.label}</div>
              <div className="iv-il-v">{sec.node}</div>
            </div>
          ))}
        </div>
        <div className="iv-il-fade" aria-hidden />
        {!atBottom && <div className="iv-il-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-il-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-index-ledger{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column}

/* A ledger row: right-aligned label gutter + wide value column, one hairline each. */
${s} .iv-il-row{display:flex;gap:.75em;align-items:baseline;padding:.4em 0}
${s} .iv-il-row+.iv-il-row{border-top:1px solid color-mix(in srgb,var(--iv-muted) 15%,transparent)}
${s} .iv-il-k{flex:0 0 7.4em;text-align:right;font-family:var(--iv-font-h);font-size:.6em;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--iv-primary);line-height:1.5;overflow-wrap:break-word}
${s} .iv-il-v{flex:1 1 auto;min-width:0;font-size:.78em;overflow-wrap:anywhere}

/* Identity head — under a heavy top rule. */
${s} .iv-il-head{flex:0 0 auto;margin:1.15em 1.05em 0;border-top:2px solid var(--iv-primary);padding-top:.2em}
${s} .iv-il-head .iv-name{font-size:1.35em;line-height:1.15;display:block}
${s} .iv-il-head .iv-socials{margin-top:.1em}

/* Scrolling detail rows. */
${s} .iv-il-wrap{position:relative;flex:1 1 auto;min-height:0;margin-top:.6em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 30%,transparent)}
${s} .iv-il-scroll{position:absolute;inset:0;overflow-y:auto;padding:.4em 1.05em 2.8em;scrollbar-width:thin}
${s} .iv-il-v .iv-bio{margin:0;font-size:1em}
${s} .iv-il-v .iv-item{padding:.15em 0}
${s} .iv-il-v .iv-item+.iv-item{border-top:none;margin-top:.35em}
${s} .iv-il-v .iv-item-t{font-size:.95em}
${s} .iv-il-v .iv-item-m,${s} .iv-il-v .iv-item-d{font-size:.85em}

${s} .iv-il-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-il-more,${s} .iv-il-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:320px){
  ${s} .iv-il-row{display:block}
  ${s} .iv-il-k{text-align:left;margin-bottom:.15em}
}
`;
}
