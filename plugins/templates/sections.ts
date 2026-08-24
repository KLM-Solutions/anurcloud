/**
 * Shared, render-agnostic helpers for the card set.
 *
 * The cards render as React components (`components/cards/`), so the HTML section
 * builders that used to live here are gone. What remains is pure logic the React
 * cards still share.
 */

/**
 * Normalise a social platform name to a known icon key.
 *
 * Platform names are extracted from CVs and crawled pages, so they arrive as
 * whatever the document said — "LinkedIn", "linked-in", "Behance portfolio". The
 * design ones matter in practice: designers and photographers are a real slice of
 * the audience, and before this they all collapsed into the generic mark. Falls
 * back to "website" so there is always a valid icon key.
 */
export function socialKey(platform?: string | null): string {
  const p = (platform ?? "").toLowerCase();
  if (p.includes("linked")) return "linkedin";
  if (p.includes("insta")) return "instagram";
  if (p.includes("face")) return "facebook";
  if (p === "x" || p.includes("twitter")) return "x";
  if (p.includes("git")) return "github";
  if (p.includes("you")) return "youtube";
  if (p.includes("behance")) return "behance";
  if (p.includes("dribbb")) return "dribbble";
  if (p.includes("medium")) return "medium";
  if (p.includes("stack")) return "stackoverflow";
  if (p.includes("telegram")) return "telegram";
  if (p.includes("whatsapp")) return "whatsapp";
  return "website";
}
