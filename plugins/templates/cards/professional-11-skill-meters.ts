/**
 * Professional template 11 — "Skill Meters" (DEV-3046)
 *
 *   ┌──────────────────────────┐
 *   │ Priya Menon      (logo)  │
 *   │ VP Engineering · Zoho    │
 *   │ ──────────────────────── │
 *   │ Kubernetes ██████████ 4  │
 *   │ Go         ███████    3  │
 *   │ Terraform  ████       2  │
 *   │ Mentioned in the roles   │
 *   │ below · Also: SQL, Linux │
 *   │ ──────────────────────── │
 *   │ Role · Company           │
 *   └──────────────────────────┘
 *
 * Structurally: the only chart in either pool. A left label column and a right
 * track column, one row per skill, read as a horizontal bar chart. Nothing else
 * in the 20 encodes anything as length.
 *
 * ── What the bars actually measure ────────────────────────────────────────
 * They count how many of the person's own highlight bullets mention that skill —
 * a fact about the document, stated on the card in words.
 *
 * They are NOT proficiency. Nothing in the extraction schema records proficiency:
 * no levels, no years per skill, no self-rating. Drawing an invented percentage
 * would look authoritative and be fabricated, which is the worst combination a
 * card can have — it is the candidate's own reputation on it. So a skill nobody
 * wrote about gets no bar at all, and lands in the "Also" line instead.
 *
 * The caption under the chart is load-bearing, not decoration. A bar chart with
 * no legend will be read as proficiency by everyone who sees it, so the sentence
 * that says otherwise ships with the chart or the chart does not ship.
 * See `measuredSkills()` in guards.ts for the matching rules.
 *
 * Thin data: gated out. Fewer than two measurable skills and the chart says
 * nothing, so the layout is not offered.
 * Minimum: 3 skills, 2 of them mentioned in the role highlights.
 */

import type { CardProfile } from "../types";
import type { ResolvedTheme } from "../theme";
import { SHOW } from "../limits";
import { esc, logoSlot } from "../helpers";
import { joinBlocks, measuredSkills, section } from "../guards";
import {
  achievementList,
  certificationList,
  contactInline,
  experienceHighlights,
  nameBlock,
  publicationList,
  registrationRows,
  socialIcons,
} from "../sections";

function meters(p: CardProfile): string {
  const rows = measuredSkills(p, 5);
  if (rows.length === 0) return "";

  // The strongest skill sets the full-width bar; the rest are read against it.
  // Percentages against a fixed scale would imply a ceiling nobody declared.
  const top = Math.max(...rows.map((r) => r.count));

  return rows
    .map((r) => {
      // Integer percent of the leader — derived from two counts we hold, so
      // there is no caller value anywhere near this style attribute.
      const pct = Math.max(8, Math.round((r.count / top) * 100));
      return `<div class="iv-sm-row">
        <div class="iv-sm-k">${esc(r.skill)}</div>
        <div class="iv-sm-track"><div class="iv-sm-fill" style="width:${pct}%"></div></div>
        <div class="iv-sm-n">${esc(String(r.count))}</div>
      </div>`;
    })
    .join("");
}

/** Skills with no mention behind them. Listed, never charted. */
function unmeasured(p: CardProfile): string {
  const charted = new Set(measuredSkills(p, 5).map((r) => r.skill.toLowerCase()));
  const rest = p.skills.filter((s) => !charted.has(s.toLowerCase())).slice(0, 6);
  if (rest.length === 0) return "";
  return `<div class="iv-sm-also"><span class="iv-sm-also-k">Also</span> ${esc(rest.join(" · "))}</div>`;
}

function build(p: CardProfile, theme: ResolvedTheme): string {
  const chart = meters(p);
  const contact = contactInline(p);
  const tail = joinBlocks([
    section("Experience", () => experienceHighlights(p, SHOW.roles, SHOW.highlightsPerRole)),
    section("Certifications", () => certificationList(p, SHOW.certifications)),
    section("Awards", () => achievementList(p, SHOW.achievements)),
    section("Publications", () => publicationList(p, SHOW.publications)),
    section("Registrations", () => registrationRows(p, SHOW.registrations)),
  ]);
  const socials = socialIcons(p.socialLinks, SHOW.socials);

  return `<div class="iv-sm-wrap">
    <header class="iv-sm-head">
      <div class="iv-sm-head-txt">${nameBlock(p)}${
        contact ? `<div class="iv-sm-contact">${contact}</div>` : ""
      }</div>
      ${logoSlot(theme.logo)}
    </header>
    ${
      chart
        ? `<div class="iv-sm-chart">${chart}<p class="iv-sm-cap">Bars show how many times each skill appears in the role highlights below — not a proficiency rating.</p>${unmeasured(
            p,
          )}</div>`
        : ""
    }
    ${tail ? `<div class="iv-sm-tail">${tail}</div>` : ""}
    ${socials ? `<div class="iv-sm-social">${socials}</div>` : ""}
  </div>`;
}

function styles(scopeId: string): string {
  const s = `.${scopeId}`;
  return `<style>
${s}.iv-skill-meters{background:var(--iv-surface)}
${s} .iv-sm-wrap{padding:1.15em 1.1em}

${s} .iv-sm-head{display:flex;align-items:flex-start;gap:.6em;padding-bottom:.7em;border-bottom:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
${s} .iv-sm-head-txt{min-width:0;flex:1 1 auto}
${s} .iv-sm-contact{margin-top:.3em}

${s} .iv-sm-chart{margin-top:.8em}
/* Three columns: a fixed label gutter, a track that takes the rest, and a count.
   The label column is fixed so the bars share one baseline — bars that start at
   different x-positions cannot be compared, which defeats the chart.
   (No backticks in this block — it is inside a template literal.) */
${s} .iv-sm-row{display:grid;grid-template-columns:6.2em 1fr 1.2em;align-items:center;gap:.5em}
${s} .iv-sm-row+.iv-sm-row{margin-top:.42em}
${s} .iv-sm-k{font-size:.72em;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${s} .iv-sm-track{height:.5em;border-radius:999px;background:color-mix(in srgb,var(--iv-muted) 16%,transparent);overflow:hidden}
${s} .iv-sm-fill{height:100%;border-radius:999px;background:var(--iv-grad)}
${s} .iv-sm-n{font-family:var(--iv-font-h);font-size:.64em;font-weight:700;color:var(--iv-muted);text-align:right}

/* The caption is part of the chart, not a footnote. Removing it turns an honest
   count into an implied rating. */
${s} .iv-sm-cap{margin-top:.6em;font-size:.6em;line-height:1.5;color:var(--iv-muted);opacity:.95}
${s} .iv-sm-also{margin-top:.45em;font-size:.66em;color:var(--iv-muted);overflow-wrap:anywhere}
${s} .iv-sm-also-k{font-family:var(--iv-font-h);font-size:.85em;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--iv-primary);margin-right:.35em}

${s} .iv-sm-tail{margin-top:.9em;border-top:1px solid color-mix(in srgb,var(--iv-muted) 22%,transparent)}
${s} .iv-sm-tail .iv-sec-h:first-child{margin-top:.7em}
${s} .iv-sm-social{margin-top:.8em}

@container (max-width:320px){
  ${s} .iv-sm-row{grid-template-columns:5em 1fr 1.1em}
}
</style>`;
}

export const skillMeters = { build, styles };
