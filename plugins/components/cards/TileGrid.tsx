"use client";

/**
 * Tile Grid — React (TSX) card component. Student pool.
 *
 * Signature (kept from the string card): equal-weight TILES with no single reading
 * order. Identity is one tile among peers — no header band, no card demotes it that
 * way. Tiles sit on the page background (not the surface) so each reads as its own
 * boxed card.
 *
 * Digital behaviour: the identity tile spans the top, then every section is its own
 * tile laid out in two vertically-scrolling columns (a real masonry — the tiles
 * are split across two flex columns, so varying heights never leave a hole and the
 * card scrolls DOWN, not sideways). No tabs, no open-a-screen — a grid shows
 * everything at once. Social icons live in the identity tile. Scroll cue.
 */

import { useMemo, useState } from "react";
import type { CardProfile, ProfileType, ThemeOptions } from "@/templates/types";
import { resolveTheme } from "@/templates/theme";
import { cardStyles } from "@/templates/styles";
import { studentSections, nonEmpty, joinParts, styleObject, SocialIcons, Avatar, cardTheme, type Section } from "./card-kit";

export interface TileGridProps {
  profile: CardProfile;
  theme?: ThemeOptions;
}

interface TileDef {
  key: string;
  label: string;
  node: React.ReactNode;
}

export function TileGrid({ profile: p, theme }: TileGridProps) {
  const profileType: ProfileType = p.profileType ?? "student";
  const resolved = useMemo(() => resolveTheme(cardTheme("tile-grid", theme), profileType), [theme, profileType]);
  const scope = resolved.scopeId;

  // Every content tile (About first, then each section), split across two columns.
  const { colA, colB } = useMemo(() => {
    const tiles: TileDef[] = [];
    if (nonEmpty(p.bio)) tiles.push({ key: "about", label: "About", node: <p className="iv-bio">{p.bio}</p> });
    for (const s of studentSections(p) as Section[]) tiles.push({ key: s.key, label: s.label, node: s.node });
    const a: TileDef[] = [];
    const b: TileDef[] = [];
    tiles.forEach((t, i) => (i % 2 === 0 ? a : b).push(t));
    return { colA: a, colB: b };
  }, [p]);

  const [atBottom, setAtBottom] = useState(false);
  const css = cardStyles(scope) + `<style>${componentCss(scope)}</style>`;
  const aud = profileType === "student" ? "iv-aud-stu" : "iv-aud-pro";

  const tile = (t: TileDef) => (
    <section key={t.key} className="iv-tg-tile">
      <h3 className="iv-tg-h">{t.label}</h3>
      {t.node}
    </section>
  );

  return (
    <div className={`${scope} iv-tile-grid ${aud}`} style={styleObject(resolved.rootStyle)}>
      <div dangerouslySetInnerHTML={{ __html: css }} />

      <div className="iv-tg-wrap">
        <div
          className="iv-tg-scroll"
          onScroll={(e) => setAtBottom(e.currentTarget.scrollTop + e.currentTarget.clientHeight >= e.currentTarget.scrollHeight - 4)}
        >
          {/* Identity — a tile among peers, spanning the top. */}
          <section className="iv-tg-tile iv-tg-idtile">
            <div className="iv-tg-id">
              <Avatar profile={p} cls="iv-tg-av" logoUrl={resolved.logo?.url} />
              <div className="iv-tg-idtxt">
                {nonEmpty(p.fullName) && <div className="iv-name">{p.fullName}</div>}
                {nonEmpty(p.designation) && <div className="iv-role">{joinParts([p.designation, p.currentCompany])}</div>}
              </div>
            </div>
            <SocialIcons links={p.socialLinks} big />
          </section>

          {/* Two vertically-scrolling columns of tiles. */}
          <div className="iv-tg-cols">
            <div className="iv-tg-col">{colA.map(tile)}</div>
            <div className="iv-tg-col">{colB.map(tile)}</div>
          </div>
        </div>
        <div className="iv-tg-fade" aria-hidden />
        {!atBottom && <div className="iv-tg-more" aria-hidden>⌄ scroll</div>}
        {atBottom && <div className="iv-tg-up" aria-hidden>⌃ scroll up</div>}
      </div>
    </div>
  );
}

function componentCss(scopeId: string): string {
  const s = `.${scopeId}`;
  return `
${s}.iv-tile-grid{position:relative;height:537px;background:var(--iv-bg);display:flex;flex-direction:column}

${s} .iv-tg-wrap{position:relative;flex:1 1 auto;min-height:0}
${s} .iv-tg-scroll{position:absolute;inset:0;overflow-y:auto;padding:.6em;scrollbar-width:thin}

/* Two flex columns that stack vertically and scroll DOWN (a real masonry). */
${s} .iv-tg-cols{display:flex;gap:.55em;align-items:flex-start;margin-top:.55em}
${s} .iv-tg-col{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:.55em}

${s} .iv-tg-tile{background:var(--iv-surface);border-radius:calc(var(--iv-radius) * .5);padding:.75em .8em;overflow:hidden}
${s} .iv-tg-h{font-family:var(--iv-font-h);font-weight:700;font-size:.62em;letter-spacing:.1em;text-transform:uppercase;color:var(--iv-primary);margin:0 0 .4em}

/* Identity tile — a peer, spanning the top row. */
${s} .iv-tg-id{display:flex;align-items:center;gap:.6em;min-width:0}
${s} .iv-tg-av{width:2.8em;height:2.8em;flex:0 0 auto}
${s} .iv-tg-idtxt{min-width:0}
${s} .iv-tg-idtile .iv-name{font-size:1.05em}
${s} .iv-tg-idtile .iv-role{font-size:.74em;color:var(--iv-muted);margin-top:.1em}
${s} .iv-tg-idtile .iv-socials{margin-top:.6em}

${s} .iv-tg-tile .iv-bio{margin:0;font-size:.78em}
${s} .iv-tg-tile .iv-item{padding:.15em 0}
${s} .iv-tg-tile .iv-item+.iv-item{border-top:none;margin-top:.35em}

${s} .iv-tg-fade{position:absolute;left:0;right:0;bottom:0;height:2.6em;background:linear-gradient(to top,var(--iv-bg),transparent);pointer-events:none}
${s} .iv-tg-more,${s} .iv-tg-up{position:absolute;left:50%;bottom:.4em;transform:translateX(-50%);font-size:.62em;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--iv-primary);pointer-events:none;white-space:nowrap}

@container (max-width:330px){
  ${s} .iv-tg-cols{flex-direction:column}
}
`;
}
