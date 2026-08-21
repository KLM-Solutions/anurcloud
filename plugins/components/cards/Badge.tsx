"use client";

/**
 * Badge — React (TSX) card component. One of the two professional AVATAR cards.
 *
 * Design (lanyard badge): a hung ID card. A lanyard forms an inverted V up to the
 * top edge, a clip holds a laminated ID PANEL (photo/logo circle + name + role +
 * icons) that hangs with a punched hole, and the content sits below on the stub.
 * Reads unmistakably as a badge on a lanyard. The avatar circle is the reason this
 * card exists: an uploaded logo fills it in place of the initials.
 *
 * Digital behaviour: the lanyard + panel are fixed chrome; below it the sections
 * scroll. Missing field → no section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, cardTheme } from "./card-kit";

export interface BadgeProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

export function Badge({ profile: p, theme }: BadgeProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("badge", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p).filter((s) => s.key !== "contact"), [p]);
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-badge ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {/* The lanyard + hanging ID panel (the signature) — fixed chrome. */}
      <div className="iv-bd-hang">
        <div className="iv-bd-lanyard" aria-hidden>
          <span className="iv-bd-strap iv-bd-strap-l" />
          <span className="iv-bd-strap iv-bd-strap-r" />
          <span className="iv-bd-clip" />
        </div>
        <div className="iv-bd-panel">
          <span className="iv-bd-hole" aria-hidden />
          <Avatar profile={p} cls="iv-bd-av" logoUrl={resolved.logo?.url} />
          {nonEmpty(p.fullName) && <div className="iv-bd-name">{p.fullName}</div>}
          <div className="iv-bd-role">{joinParts([p.designation, p.currentCompany])}</div>
          {nonEmpty(p.totalYearsExperience) && <div className="iv-bd-cap">{p.totalYearsExperience} experience</div>}
          <SocialIcons links={p.socialLinks} big />
        </div>
      </div>

      {/* The stub — content below the badge. */}
      <div className="iv-bd-wrap">
        <div
          className="iv-bd-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {nonEmpty(p.bio) && <p className="iv-bio iv-bd-about">{p.bio}</p>}
          {contact && (
            <section className="iv-bd-sec">
              <div className="iv-bd-h">Contact</div>
              <div className="iv-bd-contact">{contact}</div>
            </section>
          )}
          {sections.map((sec) => (
            <section key={sec.key} className="iv-bd-sec">
              <div className="iv-bd-h">{sec.label}</div>
              {sec.node}
            </section>
          ))}
        </div>
        <div className="iv-bd-fade" aria-hidden />
        {!atBottom && <div className="iv-bd-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-bd-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-badge{position:relative;height:537px;background:var(--iv-surface);display:flex;flex-direction:column;overflow:hidden}

/* The lanyard: two straps pivoting from the clip up to the top edge (an inverted
   V), with a metal clip at the bottom of the V. */
${s} .iv-bd-hang{flex:0 0 auto}
${s} .iv-bd-lanyard{position:relative;height:2.7em}
${s} .iv-bd-strap{position:absolute;top:-.4em;left:50%;width:.95em;height:3.4em;background:var(--iv-grad);border-radius:.15em;transform-origin:bottom center}
${s} .iv-bd-strap-l{transform:translateX(-50%) rotate(23deg)}
${s} .iv-bd-strap-r{transform:translateX(-50%) rotate(-23deg)}
${s} .iv-bd-clip{position:absolute;bottom:-.15em;left:50%;transform:translateX(-50%);width:1.5em;height:.75em;border-radius:.2em;background:color-mix(in srgb,var(--iv-muted) 55%,var(--iv-surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-text) 20%,transparent)}

/* The hanging ID panel — laminated (border + faint tint) with a punched hole. */
${s} .iv-bd-panel{position:relative;margin:.15em .95em 0;border:1px solid color-mix(in srgb,var(--iv-primary) 34%,var(--iv-edge));border-radius:.7em;background:color-mix(in srgb,var(--iv-primary) 6%,var(--iv-surface));padding:1.25em .9em 1em;display:flex;flex-direction:column;align-items:center;text-align:center}
${s} .iv-bd-hole{position:absolute;top:.5em;left:50%;transform:translateX(-50%);width:1.7em;height:.5em;border-radius:999px;background:var(--iv-surface);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--iv-muted) 45%,transparent)}
${s} .iv-bd-av{width:3.9em;height:3.9em;flex:0 0 auto;box-shadow:0 0 0 3px var(--iv-surface),0 0 0 4px color-mix(in srgb,var(--iv-primary) 26%,transparent)}
${s} .iv-bd-name{font-family:var(--iv-font-h);font-weight:700;font-size:1.15em;margin-top:.5em;line-height:1.15}
${s} .iv-bd-role{font-size:.8em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-bd-cap{font-size:.68em;color:var(--iv-muted);margin-top:.3em;letter-spacing:.05em;text-transform:uppercase}
${s} .iv-bd-panel .iv-socials{margin-top:.6em;justify-content:center}

/* The stub — content below the badge. */
${s} .iv-bd-wrap{position:relative;flex:1 1 auto;min-height:0;margin-top:.9em}
${s} .iv-bd-scroll{position:absolute;inset:0;overflow-y:auto;padding:0 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-bd-about{margin:0 0 1em}
${s} .iv-bd-sec{padding-top:.85em;margin-top:.85em;border-top:1px solid var(--iv-edge)}
${s} .iv-bd-sec:first-child{border-top:0;margin-top:0;padding-top:0}
${s} .iv-bd-h{font-family:var(--iv-font-h);font-weight:700;font-size:.64em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.45em}
${s} .iv-bd-contact{font-size:.82em;color:var(--iv-muted)}
${s} .iv-bd-sec .iv-item+.iv-item{border-top:none;margin-top:.4em}

${s} .iv-bd-fade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-bd-more,${s} .iv-bd-up{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}
`;
}
