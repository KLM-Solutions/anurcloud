"use client";

/**
 * Ticket Stub — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): an event ticket. A coloured header band
 * carries the identity, then a dashed PERFORATION line with a semicircular NOTCH
 * bitten out of the left and right card edges, and the content sits on the stub
 * below. The tear-and-notch silhouette is the tell.
 *
 * Body: a RECEIPT — each section is a block separated by a dashed tear line (the
 * same dashed language as the perforation), read straight down like a printed
 * stub. Distinct from Monogram Block (accordion) and Corner Wedge (grid). Scroll
 * cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface TicketStubProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function TicketStub({ profile: p, theme }: TicketStubProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("ticket-stub", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Contact rides in the ticket top; keep it out of the stub sections.
  const sections = useMemo(() => studentSections(p).filter((s) => s.key !== "contact"), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-ticket-stub ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* Ticket top + perforation (the signature) — fixed chrome. */}
      <div className="iv-tk-chrome">
        <div className="iv-tk-top">
          <Avatar profile={p} cls="iv-tk-av" logoUrl={resolved.logo?.url} />
          <div className="iv-tk-who">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            {nonEmpty(p.designation) && <div className="iv-role">{p.designation}</div>}
            {contact && <div className="iv-tk-contact">{contact}</div>}
            <SocialIcons links={p.socialLinks} big />
          </div>
        </div>
        <div className="iv-tk-perf" aria-hidden />
      </div>

      {/* Stub — a receipt: sections separated by dashed tear lines. */}
      <div className="iv-tk-wrap">
        <div
          className="iv-tk-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && (
            <section className="iv-tk-row">
              <div className="iv-tk-h">About</div>
              <p className="iv-bio">{p.bio}</p>
            </section>
          )}
          {sections.map((sec) => (
            <section key={sec.key} className="iv-tk-row">
              <div className="iv-tk-h">{sec.label}</div>
              {sec.node}
            </section>
          ))}
        </div>
        <div className="iv-tk-fade" aria-hidden />
        {!atBottom && <div className="iv-tk-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-tk-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-ticket-stub{position:relative;height:537px;background:var(--iv-surface);overflow:hidden;display:flex;flex-direction:column}

/* Ticket top — full-bleed coloured band. */
${s} .iv-tk-chrome{flex:0 0 auto}
${s} .iv-tk-top{padding:1.15em 1.15em 1.2em;background:var(--iv-grad);color:var(--iv-onp);display:flex;align-items:center;gap:.7em}
${s} .iv-tk-av{width:3.2em;height:3.2em;flex:0 0 auto;box-shadow:0 0 0 2px color-mix(in srgb,var(--iv-onp) 40%,transparent)}
${s} .iv-tk-top .iv-av-fallback{background:color-mix(in srgb,var(--iv-onp) 18%,transparent);color:var(--iv-onp)}
${s} .iv-tk-who{min-width:0;flex:1 1 auto}
${s} .iv-tk-top .iv-name{font-size:1.15em;color:var(--iv-onp)}
${s} .iv-tk-top .iv-role{color:color-mix(in srgb,var(--iv-onp) 82%,transparent);font-size:.8em;margin-top:.1em}
${s} .iv-tk-contact{color:color-mix(in srgb,var(--iv-onp) 80%,transparent);font-size:.68em;margin-top:.2em}
${s} .iv-tk-top .iv-socials{margin-top:.5em}

/* The perforation — a dashed tear with a notch bitten out of each card edge. */
${s} .iv-tk-perf{position:relative;height:0;border-top:2px dashed color-mix(in srgb,var(--iv-primary) 45%,var(--iv-surface))}
${s} .iv-tk-perf::before,${s} .iv-tk-perf::after{content:"";position:absolute;top:-.72em;width:1.4em;height:1.4em;border-radius:50%;background:var(--iv-surface)}
${s} .iv-tk-perf::before{left:-.7em}
${s} .iv-tk-perf::after{right:-.7em}

/* The stub — a receipt: each section a row, torn from the next by a dashed line. */
${s} .iv-tk-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-tk-scroll{position:absolute;inset:0;overflow-y:auto;padding:0 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-tk-row{padding:.95em 0}
${s} .iv-tk-row+.iv-tk-row{border-top:1.5px dashed color-mix(in srgb,var(--iv-primary) 32%,var(--iv-surface))}
${s} .iv-tk-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.12em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-tk-row .iv-bio{margin:0}
${s} .iv-tk-row .iv-item+.iv-item{border-top:none;margin-top:.4em}

${s} .iv-tk-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-tk-more,${s} .iv-tk-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
`;
}
