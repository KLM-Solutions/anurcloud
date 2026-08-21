import { redirect } from "next/navigation";

/**
 * Module 4 — Template.
 *
 * The card set now ships as React (TSX) components, and the live viewer for them is
 * the playground. So this route no longer renders the old template gallery — it
 * redirects to the playground, which is the Module 4 experience. Every existing
 * link to `/template` (landing page nav, module pills) lands there automatically.
 */
export default function TemplatePage() {
  redirect("/playground");
}
