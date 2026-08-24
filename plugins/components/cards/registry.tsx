/**
 * The single card→component registry.
 *
 * The smart cards ship as React (TSX) components — this maps each template key to
 * the component that renders it. It is the one place that knows every card, so the
 * playground, any future viewer, and the availability check in `templates/index.ts`
 * all draw from the same list. Add a card in one place here.
 *
 * There is no HTML render path: cards render as React, client-side. `/api/template`
 * only decides *which* cards to offer (eligibility + ranking); it does not return
 * markup.
 */

import type { ReactNode } from "react";
import type { CardProfile, TemplateKey, ThemeOptions } from "@/templates/types";
import { SideRail } from "@/components/cards/SideRail";
import { HeroSplit } from "@/components/cards/HeroSplit";
import { CentrePortrait } from "@/components/cards/CentrePortrait";
import { Timeline } from "@/components/cards/Timeline";
import { TileGrid } from "@/components/cards/TileGrid";
import { TicketStub } from "@/components/cards/TicketStub";
import { CornerWedge } from "@/components/cards/CornerWedge";
import { MonogramBlock } from "@/components/cards/MonogramBlock";
import { IndexLedger } from "@/components/cards/IndexLedger";
import { ColumnFlow } from "@/components/cards/ColumnFlow";
import { SkillMeters } from "@/components/cards/SkillMeters";
import { SplitHalves } from "@/components/cards/SplitHalves";
import { Overlap } from "@/components/cards/Overlap";
import { Numbered } from "@/components/cards/Numbered";
import { FolderTab } from "@/components/cards/FolderTab";
import { StatStrip } from "@/components/cards/StatStrip";
import { RoleLadder } from "@/components/cards/RoleLadder";
import { Letterhead } from "@/components/cards/Letterhead";
import { EdgeSpine } from "@/components/cards/EdgeSpine";
import { PullQuote } from "@/components/cards/PullQuote";
import { Badge } from "@/components/cards/Badge";
import { Spotlight } from "@/components/cards/Spotlight";

/** Render function for one card: profile (+ optional theme) → JSX. */
export type CardRenderer = (p: CardProfile, theme?: ThemeOptions) => ReactNode;

/** Every built card, keyed by template key. This is the set that actually exists. */
export const REACT_CARDS: Partial<Record<TemplateKey, CardRenderer>> = {
  "side-rail": (p, theme) => <SideRail profile={p} theme={theme} />,
  "hero-split": (p, theme) => <HeroSplit profile={p} theme={theme} />,
  "centre-portrait": (p, theme) => <CentrePortrait profile={p} theme={theme} />,
  timeline: (p, theme) => <Timeline profile={p} theme={theme} />,
  "tile-grid": (p, theme) => <TileGrid profile={p} theme={theme} />,
  "ticket-stub": (p, theme) => <TicketStub profile={p} theme={theme} />,
  "corner-wedge": (p, theme) => <CornerWedge profile={p} theme={theme} />,
  "monogram-block": (p, theme) => <MonogramBlock profile={p} theme={theme} />,
  "index-ledger": (p, theme) => <IndexLedger profile={p} theme={theme} />,
  "column-flow": (p, theme) => <ColumnFlow profile={p} theme={theme} />,
  "skill-meters": (p, theme) => <SkillMeters profile={p} theme={theme} />,
  "split-halves": (p, theme) => <SplitHalves profile={p} theme={theme} />,
  overlap: (p, theme) => <Overlap profile={p} theme={theme} />,
  numbered: (p, theme) => <Numbered profile={p} theme={theme} />,
  "folder-tab": (p, theme) => <FolderTab profile={p} theme={theme} />,
  "stat-strip": (p, theme) => <StatStrip profile={p} theme={theme} />,
  "role-ladder": (p, theme) => <RoleLadder profile={p} theme={theme} />,
  letterhead: (p, theme) => <Letterhead profile={p} theme={theme} />,
  "edge-spine": (p, theme) => <EdgeSpine profile={p} theme={theme} />,
  "pull-quote": (p, theme) => <PullQuote profile={p} theme={theme} />,
  badge: (p, theme) => <Badge profile={p} theme={theme} />,
  spotlight: (p, theme) => <Spotlight profile={p} theme={theme} />,
};

/** Keys of the cards that actually exist — the availability source of truth. */
export const BUILT_CARD_KEYS = Object.keys(REACT_CARDS) as TemplateKey[];

/** True when a template key has a built React component. */
export function isCardBuilt(key: TemplateKey): boolean {
  return typeof REACT_CARDS[key] === "function";
}
