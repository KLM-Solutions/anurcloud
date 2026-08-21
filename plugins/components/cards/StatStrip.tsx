"use client";

/**
 * Stat Strip — React (TSX) card component.
 *
 * Signature (kept from the string card): the card OPENS on a divided, filled strip
 * of oversized figures (Years · Roles · Certs …). The identity follows underneath
 * on white — this is the one card that leads with DATA, not a name. The figures are
 * counted, never estimated, and capped at three (a fourth cell drops each numeral
 * below the size that makes the strip work).
 *
 * Digital behaviour matches the other cards: the strip + identity are fixed chrome;
 * below them a content-first overview scrolls (bio + sections). A big section opens
 * its own screen with a Back bar; a small one shows inline. Missing field → no
 * section. Scroll cue (⌄ scroll → ⌃ scroll up).
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { professionalSections, isBig, nonEmpty, joinParts, styleObject, SocialIcons, cardTheme } from "./card-kit";

export interface StatStripProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

interface Stat {
  value: string;
  label: string;
}

/** The figures, in priority order, capped at three. Counted from the profile. */
function statCells(p: CardProfile): Stat[] {
  const out: Stat[] = [];
  if (nonEmpty(p.totalYearsExperience)) {
    const digits = p.totalYearsExperience.match(/\d+/)?.[0];
    out.push(
      digits
        ? { value: digits, label: digits === "1" ? "Year" : "Years" }
        : { value: p.totalYearsExperience, label: "Experience" },
    );
  }
  if (p.experience.length > 0) out.push({ value: String(p.experience.length), label: p.experience.length === 1 ? "Role" : "Roles" });
  if (p.certifications.length > 0) out.push({ value: String(p.certifications.length), label: p.certifications.length === 1 ? "Cert" : "Certs" });
  if (p.skills.length > 0) out.push({ value: String(p.skills.length), label: "Skills" });
  if (p.education.length > 0) out.push({ value: String(p.education.length), label: p.education.length === 1 ? "Degree" : "Degrees" });
  return out.slice(0, 3);
}

export function StatStrip({ profile: p, theme }: StatStripProps) {
  const profileType: ProfileType = p.profileType ?? "professional";
  const resolved = useMemo(() => resolveTheme(cardTheme("stat-strip", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  const sections = useMemo(() => professionalSections(p), [p]);
  const big = sections.filter(isBig);
  const stats = useMemo(() => statCells(p), [p]);

  const [view, setView] = useState<string>("overview");
  const [atBottom, setAtBottom] = useState(false);

  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const contact = joinParts([p.email, p.phone, p.location], " · ");

  return (
    <div className={`${scope} iv-stat-strip ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      {view === "overview" ? (
        <div className="iv-view">
          {/* The opening figure strip (the signature) — leads, before the name. */}
          {stats.length > 0 && (
            <div className="iv-ss-strip">
              {stats.map((st) => (
                <div key={st.label} className="iv-ss-cell">
                  <div className="iv-ss-n">{st.value}</div>
                  <div className="iv-ss-l">{st.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Identity on white, below the figures. */}
          <header className="iv-ss-id">
            {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
            <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>
            <SocialIcons links={p.socialLinks} big />
          </header>

          <div className="iv-ovwrap">
            <div
              className="iv-ovscroll"
              onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
            >
              {nonEmpty(p.bio) && <p className="iv-bio iv-ss-about">{p.bio}</p>}
              {contact && (
                <div className="iv-ovinline">
                  <div className="iv-ovh">Contact</div>
                  <div className="iv-ss-contact">{contact}</div>
                </div>
              )}

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
${s}.iv-stat-strip{position:relative;height:537px;background:var(--iv-surface)}
${s} .iv-view{position:absolute;inset:0;display:flex;flex-direction:column}

/* The opening strip — full-bleed, filled, divided into equal cells. Equal cells
   matter: a flexed-to-content strip reads as tags, not as headline figures. */
${s} .iv-ss-strip{flex:0 0 auto;display:flex;background:var(--iv-grad);color:var(--iv-onp)}
${s} .iv-ss-cell{flex:1 1 0;min-width:0;padding:.75em .4em .65em;text-align:center}
${s} .iv-ss-cell+.iv-ss-cell{border-left:1px solid color-mix(in srgb,var(--iv-onp) 28%,transparent)}
${s} .iv-ss-n{font-family:var(--iv-font-h);font-weight:800;font-size:1.85em;line-height:1;letter-spacing:-.02em}
${s} .iv-ss-l{font-size:.55em;font-weight:700;text-transform:uppercase;letter-spacing:.12em;margin-top:.35em;color:color-mix(in srgb,var(--iv-onp) 82%,transparent)}

/* Identity on white, below the figures. */
${s} .iv-ss-id{flex:0 0 auto;padding:1em 1.15em .85em}
${s} .iv-ss-id .iv-name{font-size:1.2em}
${s} .iv-ss-id .iv-role{font-size:.82em;color:var(--iv-muted);margin-top:.15em}
${s} .iv-ss-id .iv-socials{margin-top:.6em}

/* Scrolling body below the chrome. */
${s} .iv-ovwrap{position:relative;flex:1 1 auto;min-height:0;border-top:1px solid var(--iv-edge)}
${s} .iv-ovscroll{position:absolute;inset:0;overflow-y:auto;padding:1em 1.15em 2.8em;scrollbar-width:thin}
${s} .iv-ss-about{margin:0 0 1em}
${s} .iv-ss-contact{font-size:.82em;color:var(--iv-muted)}
${s} .iv-ovfade{position:absolute;left:0;right:0;bottom:0;height:2.8em;background:linear-gradient(to top,var(--iv-surface),transparent);pointer-events:none}
${s} .iv-ovmore,${s} .iv-ovup{position:absolute;left:50%;bottom:.5em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

${s} .iv-secs{display:flex;flex-direction:column}
${s} .iv-ovsec,${s} .iv-ovinline{display:block;width:100%;text-align:left;padding:.85em 0;border:0;border-top:1px solid var(--iv-edge);background:none;font:inherit;color:inherit}
${s} .iv-ovsec{cursor:pointer}
${s} .iv-ovsec:hover .iv-ovnav{color:var(--iv-primary)}
${s} .iv-ovh{font-family:var(--iv-font-h);font-weight:700;font-size:.66em;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);margin-bottom:.5em}
${s} .iv-ovnav{margin-top:.5em;font-size:.72em;font-weight:700;color:var(--iv-muted)}

/* Section screen — Back bar + body. */
${s} .iv-bar{display:flex;align-items:center;gap:.6em;padding:.85em 1em;border-bottom:1px solid var(--iv-edge);flex:0 0 auto}
${s} .iv-back{display:inline-flex;align-items:center;gap:.15em;font-size:.78em;font-weight:700;color:var(--iv-primary);cursor:pointer;border:0;background:none;font-family:inherit}
${s} .iv-ptitle{font-family:var(--iv-font-h);font-weight:700;font-size:.9em}
${s} .iv-pbody{flex:1 1 auto;overflow-y:auto;padding:1.2em}

@container (max-width:300px){
  ${s} .iv-ss-n{font-size:1.5em}
  ${s} .iv-ss-l{letter-spacing:.08em}
}
`;
}
