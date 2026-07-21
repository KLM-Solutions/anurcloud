/**
 * @pxlbrain/insta-viz-templates
 *
 * Insta VIZ smart-card templates. Framework-agnostic: call a template by number,
 * pass a profile + theme, get back a self-contained HTML string you can drop into
 * any page.
 *
 *   import { renderCard } from "@pxlbrain/insta-viz-templates";
 *
 *   el.innerHTML = renderCard(1, profile, {
 *     colors: { primary: "#6d28d9", accent: "#22c55e" },
 *     font: "Poppins",
 *     size: "md",
 *     logo: { url: "https://.../logo.png", position: "top-left" },
 *   });
 */

import type { CardProfile, ProfileType, TemplateInfo, ThemeOptions } from "./types.js";
import { resolveTheme, type ResolvedTheme } from "./theme.js";
import { profileTypeOf } from "./helpers.js";
import { cardStyles } from "./styles.js";
import { buildWave } from "./templates/wave.js";
import { buildSplit } from "./templates/split.js";
import { buildAcademic } from "./templates/academic.js";
import { buildEditorial } from "./templates/editorial.js";

export * from "./types.js";
export { resolveTheme } from "./theme.js";

interface TemplateDef extends TemplateInfo {
  /** Extra class on the card root (enables layout-specific CSS). */
  rootClass: string;
  build: (profile: CardProfile, theme: ResolvedTheme) => string;
}

const TEMPLATE_DEFS: TemplateDef[] = [
  {
    id: 1,
    key: "wave",
    name: "Wave",
    description:
      "Coloured header banner with a wave divider into the body. Bold, friendly, energetic.",
    audience: "student",
    rootClass: "iv-wave-tpl",
    build: buildWave,
  },
  {
    id: 2,
    key: "split",
    name: "Split",
    description:
      "Left coloured avatar panel, right-side details. Clean, directory-style, reads well at a glance.",
    audience: "professional",
    rootClass: "iv-split",
    build: buildSplit,
  },
  {
    id: 3,
    key: "academic",
    name: "Academic",
    description:
      "Scholarly header with a round avatar and institution line. Education-forward — suits students.",
    audience: "student",
    rootClass: "iv-acad",
    build: buildAcademic,
  },
  {
    id: 4,
    key: "editorial",
    name: "Editorial",
    description:
      "No colour blocks — big typographic name, thin rules, generous whitespace. Premium, executive.",
    audience: "professional",
    rootClass: "iv-ed",
    build: buildEditorial,
  },
];

/** Catalogue of available templates (id, key, name, description, audience). */
export const templates: TemplateInfo[] = TEMPLATE_DEFS.map(
  ({ id, key, name, description, audience }) => ({ id, key, name, description, audience }),
);

/** Number of templates currently shipped. */
export const templateCount = TEMPLATE_DEFS.length;

/** Templates offered for a given profile type (the recommender picks from this pool). */
export function templatesFor(profileType: ProfileType): TemplateInfo[] {
  return templates.filter((t) => t.audience === profileType);
}

function resolveDef(selector: number | string): TemplateDef {
  const def =
    typeof selector === "number"
      ? TEMPLATE_DEFS.find((t) => t.id === selector)
      : TEMPLATE_DEFS.find((t) => t.key === selector.toLowerCase());
  if (!def) {
    const avail = TEMPLATE_DEFS.map((t) => `${t.id} (${t.key})`).join(", ");
    throw new Error(
      `[insta-viz-templates] Unknown template "${selector}". Available: ${avail}.`,
    );
  }
  return def;
}

/**
 * Render a smart card to a self-contained HTML string.
 *
 * @param template  Template number (1, 2, …) or key ("wave", "split").
 * @param profile   The person's details (Insta VIZ pipeline profile).
 * @param options   Theme overrides — colours, font, size, logo. All optional.
 */
export function renderCard(
  template: number | string,
  profile: CardProfile,
  options: ThemeOptions = {},
): string {
  const def = resolveDef(template);
  const type = profileTypeOf(profile);
  const theme = resolveTheme(options, type);
  const aud = type === "student" ? "iv-aud-stu" : "iv-aud-pro";
  const inner = def.build(profile, theme);
  return `<div class="${theme.scopeId} ${def.rootClass} ${aud}" style="${theme.rootStyle}" data-iv-template="${def.key}">${cardStyles(theme.scopeId)}${inner}</div>`;
}
