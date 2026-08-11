# CLAUDE.md — AnurCloud `plugins/` (PxlBrain modules)

Code-level context for this app. Product/status context lives in
`../../knowledge/anur-cloud.md`; integration coordinates (Linear / Notion / GitHub)
live in `../../account/anur-cloud.md` — **not here, and no secrets in this repo.**

## ⚠️ This is NOT the Next.js you know

This is **Next.js 16** — it has breaking changes vs. most training data (APIs,
conventions, file structure). **Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code**, and heed deprecation notices.

## Scope

**Insta VIZ is AnurCloud's product.** PxlBrain builds only the **plugin logic** in this
`plugins/` app — the AI engines behind the pipeline. The static HTML at the repo root
(`login.html`, `index.html`, `templates.html`, `flow.html`) is AnurCloud's Insta VIZ
mockup layer and is **out of PxlBrain's scope** — don't treat it as source of truth.

The product pipeline is **Extract → Review → Enhance → Template**. PxlBrain owns the
server-side engines; AnurCloud owns the UI and the human **Review** step.

| Module | Owner | Status | Where |
|--------|-------|--------|-------|
| 1 · Extract | PxlBrain | **Live** | `/api/extract`, `/api/extract-url`, `lib/llama.ts`, `lib/schema.ts` |
| 2 · Review | AnurCloud | n/a | user corrects fields in AnurCloud's UI |
| 3 · Enhance | PxlBrain | **Live** | `/api/enhance`, `lib/enhance-engine.ts` |
| 4 · Template | PxlBrain | **all 20 cards live** | `/api/template`, `templates/`, `lib/profile-to-card.ts`, `lib/brand-to-theme.ts` |

**Module 4 state:** foundation built and verified (DEV-3040), plus the **full
20** (student DEV-3035…3039 + DEV-3041…3045, professional DEV-3046…3055): 10 student (Side Rail, Hero Split, Centre Portrait, Timeline, Tile Grid,
Footer Anchor, Corner Wedge, Monogram Block, Index Ledger, Column Flow) and 10
professional (Skill Meters, Split Halves, Overlap, Numbered, Folder Tab, Stat
Strip, Role Ladder, Letterhead, Edge Spine, Pull Quote).

**The professional order is the owner's, set 11 Aug 2026 (DEV-3056)** — ids 11–20 run in
exactly the sequence above, and the filenames encode it. Two earlier cards
("Frame", a colour ring on all four edges, and "Mid Band", a colour band across
the middle) were built and **cut by the owner as not different enough**; Edge
Spine and Pull Quote replaced them. Don't rebuild either.

**Two pools, and they differ in content, not only in arrangement.** Three
professional layouts gate on fields the student schema does not have —
`total_years_experience` (Stat Strip) and `experience[].highlights` (Role Ladder,
Skill Meters) — so they are unreachable from a student profile even if the
audience filter were bypassed. `verify-foundation.mts` asserts both barriers
independently. Not one professional card uses the initials circle or puts the
identity inside a full-width top band; that is two of the client's four
look-alike points failed at pool level, and there is a per-card assertion so no
future card can quietly reintroduce the avatar.

**Skill Meters (14) must never become a proficiency chart.** Nothing in the
extraction schema records proficiency — no levels, no years per skill, no
self-rating. The bars count how often each skill appears in the person's own
highlight bullets (`measuredSkills()` in guards.ts), the caption under the chart
says exactly that, and a skill with no mention is listed rather than drawn at a
low value. An invented percentage would look authoritative and be fabricated, on
a card carrying a real person's name. The caption and the boundary-matched
counting are both asserted in verify.

**Suggest three, not all (`templates/rank.ts`, DEV-3057).** Eligibility answers "could this
profile fill this card?" and for a rich profile that is nearly all ten — a
catalogue, not a recommendation. `suggestTemplates(profile)` returns the **top 3**,
ranked, each with plain-language reasons. The count is one constant
(`SUGGESTION_COUNT`, owner's call 11 Aug 2026) and deliberately **not** a request
parameter — a caller that could ask for twelve turns it back into the catalogue.

> **⚠️ Never add a fit percentage.** The page once showed invented scores
> (`TMP-101 · 94%`) and they were removed as a lie with a decimal point in it:
> there is no ground truth for how well a layout suits a person, so any percentage
> is made-up precision — the same trap as proficiency bars on Skill Meters. What
> ships instead is a rank (a real claim), a coarse three-value tier, and reasons
> that are each a checkable fact about the profile. Verify asserts no `%` appears
> anywhere in a suggestion.

The biggest signal is **appetite vs. data level**: a whitespace-driven layout looks
composed on a thin profile and empty on a rich one, and a dense layout is the
reverse. That is the client's 3 Aug complaint in another form, so it is weighted
first. Appetite is separate from the hard minimum in `guards.ts` — a minimum says
"will not break", an appetite says "is at its best".

**Pagination — asked for 11 Aug 2026, NOT built (DEV-3063).** A card is one growing box
today. Measured heights at 380px wide: 74px for a name-only profile, 1310–2154px
for a senior CV with every field filled. A4 at 96dpi is 1122px, so a full career
wants about two pages.

What it needs, so whoever picks it up is not starting from a blank page:
1. **Each card must declare its content blocks** so they can be distributed across
   pages. Today the block list is inline in each `build()`. The shape wanted is an
   optional `blocks(profile)` export per card that `build()` also consumes, so the
   single-page and paginated paths cannot drift apart.
2. **A height estimate per block**, because there is no DOM server-side. Character
   and item counts are enough for a page budget — `contentVolume()` in guards.ts is
   the first cut of this — and the Chrome rig (`npm run check:overflow`) is what
   calibrates and then guards the estimate.
3. **A continuation design.** Page 1 keeps the card's full chrome; pages 2+ need a
   slim repeated header, not a second copy of the identity block.
4. **An output-shape decision, which is AnurCloud's integration contract.**
   Recommended: `renderCard()` keeps returning ONE string, containing N stacked
   `.iv-page` elements, and `/api/template` adds a `pages` count. Returning an
   array would break every existing caller for no gain.
Open question for the owner: the page height. A4 proportion at the card's width
(380 × 537) gives a heavy CV four pages; a flat 1120px gives it two.

**Logo placement is built but switched off.** Every card calls `logoSlot()` at a
place designed for a logo, `.iv-logo-*` styling is in `styles.ts`, and
`lib/brand.ts` inlines an uploaded logo as a data URI — but no logo is passed
anywhere, so nothing renders. Owner's call, 11 Aug 2026: finish the templates
first, then decide how a user-supplied logo (any aspect ratio, any colour,
possibly with its own background) should sit on a card. Do not delete the code
path — logo position/height is a commitment answered 22 Jul and accepted 3 Aug.

The four cards in the repo-root `insta-viz-templates/` folder are **throwaway
prototypes** — they do not count toward the committed 20, and nothing here
imports from them.

**Structure-first is the rule for every card.** Mithra Murugesan
(Anur Cloud), 3 Aug 2026, on our first prototypes:

> "the overall layout, **vertical stack, banner on top, circular initials avatar,
> white body below**, stays the same … we'd end up with a smaller set of real
> layout options than the count suggests."

Treat those four as a **checklist to fail**. A card that ticks all four is the
same card again no matter what else changed — proportion, tint and ornament are
detail changes, not structural ones. Two cards in the second batch ("Stacked
Bands", "Portrait Panel") were built, caught against this list and replaced
before review; don't rebuild them.

Test every new card in grayscale — if it isn't obviously a different card with
the colour removed, it isn't a new template. `npm run preview` renders the whole
set with a grayscale toggle for exactly this.

Two **profile types** — `student` and `professional` — drive both the extraction schema
and the enhancement prompts throughout.

## Stack

- **Next.js 16.2.7** (App Router) · **React 19.2.4** · **TypeScript 5** (`strict: true`)
- **Turbopack** — `next.config.ts` pins `turbopack.root` to this dir (a lockfile in a
  parent dir otherwise makes Next infer the wrong workspace root for file tracing)
- **Tailwind 4** (via `@tailwindcss/postcss`) · Geist fonts · **light-only** UI
- **Zod 4** · ESLint 9 (`eslint-config-next`)
- Package name: `plugins` (private). Path alias: `@/*` → `./*`.

External services (each wrapped server-only, key read from env, never client-side):
- **LlamaCloud / LlamaExtract** (`@llamaindex/llama-cloud`) — schema-driven file extraction
- **Firecrawl** (`@mendable/firecrawl-js`) — renders + crawls a URL (up to 25 pages) to markdown
- **OpenAI** (`openai`) — enhancement, model **`gpt-4.1`**

## Layout

```
plugins/
├── app/
│   ├── page.tsx            landing — AnurCloud × PxlBrain flow overview
│   ├── extraction/page.tsx interactive extraction demo (client): file + URL modes
│   ├── enhance/page.tsx    enhancement demo (client)
│   ├── template/page.tsx   template module — renders the REAL cards at build time
│   ├── template/your-card.tsx  live panel (client): handoff profile → shortlist → card
│   ├── layout.tsx          Geist fonts, light-only, metadata
│   └── api/
│       ├── extract/route.ts       file  → structured profile
│       ├── extract-url/route.ts   URL   → Firecrawl → structured profile
│       ├── enhance/route.ts       profile → polished bio + descriptions
│       └── template/route.ts      profile → eligible cards (+ rendered HTML)
├── templates/           ⚠️ SELF-CONTAINED — see the rule below
│   ├── index.ts         registry: PLANNED metadata + BUILDERS + renderCard()
│   ├── types.ts         CardProfile / ThemeOptions / TemplateInfo
│   ├── theme.ts         theme resolution + hex maths + contrast helpers
│   ├── guards.ts        empty-content rules, per-template minimums, dataLevel(), volume
│   ├── limits.ts        SHOW / NARROW — how much of each field a card displays
│   ├── rank.ts          suggestion: top 3 ranked + reasons (NO fit percentages)
│   ├── helpers.ts       esc / attr / safeUrl / initials / avatar
│   ├── sections.ts      reusable blocks — each returns "" when empty
│   ├── styles.ts        shared scoped CSS (primitives only, not layouts)
│   └── cards/           one card per file — markup AND its own layout CSS
│       ├── student-01-side-rail.ts        two columns, no top banner
│       ├── student-02-hero-split.ts       hero band + two-column body
│       ├── student-03-centre-portrait.ts  centred, no colour block
│       ├── student-04-timeline.ts         dated spine, organised by time
│       ├── student-05-tile-grid.ts        modular tiles, no reading order
│       ├── student-06-footer-anchor.ts    colour band at the BOTTOM
│       ├── student-07-corner-wedge.ts     diagonal colour, non-rectangular
│       ├── student-08-monogram-block.ts   square part-width block, no circle
│       ├── student-09-index-ledger.ts     label gutter, spec-sheet rows
│       ├── student-10-column-flow.ts      masthead + 2-column text FLOW
│       ├── professional-11-skill-meters.ts the only chart — evidence, NOT skill level
│       ├── professional-12-split-halves.ts 50/50, colour on the RIGHT
│       ├── professional-13-overlap.ts      plate straddling a filled zone
│       ├── professional-14-numbered.ts     oversized numerals number each section
│       ├── professional-15-folder-tab.ts   part-width tab + full-width rule
│       ├── professional-16-stat-strip.ts   opens on a divided strip of figures
│       ├── professional-17-role-ladder.ts  stepped rungs, indent per role
│       ├── professional-18-letterhead.ts   stationery: rules, no fill at all
│       ├── professional-19-edge-spine.ts   name set VERTICALLY on the right edge
│       └── professional-20-pull-quote.ts   bio as display type, name demoted to caption
├── scripts/
│   ├── check-template-isolation.mjs   enforces the self-contained rule
│   ├── ts-resolver.mjs                dev-only loader hook for the line below
│   ├── verify-foundation.mts          772 checks over cleaning/guards/fields/brand/safety/suggestion/every card
│   ├── build-stress.mts               public/stress.html — hostile content × 4 widths
│   └── check-overflow.mjs             measures it in Chrome: escapes / clips / overlaps
├── lib/
│   ├── schema.ts        SINGLE SOURCE OF TRUTH for extraction fields (+ JSON-schema gen)
│   ├── types.ts         extraction contract types + API response shapes
│   ├── validation.ts    file/profile-type validation (client + server safe)
│   ├── llama.ts         extraction engine wrapper (Module 1)
│   ├── color.ts         colour maths — HSL, brand filter, ranking (pure, either side)
│   ├── brand.ts         brand theme engine — site via Firecrawl, logo via sharp (SERVER ONLY)
│   ├── enhance-engine.ts   OpenAI wrapper (Module 3)
│   ├── enhance-types.ts    Module 3 request/response types
│   ├── profile-to-card.ts  GLUE: extraction → CardProfile (cleaning + timeline dates)
│   ├── brand-to-theme.ts   GLUE: BrandTheme → ThemeOptions (the colour join)
│   ├── template-types.ts   Module 4 request/response types
│   ├── handoff.ts          one-shot page→page prefill via sessionStorage (browser only)
│   └── route-helpers.ts    fail() responder + timing-safe tokenMatches()
├── public/samples/      sample resumes used by demo.sh
└── demo.sh              live API demo against https://anurcloud.vercel.app
```

## API endpoints

All routes: `runtime = "nodejs"`, `maxDuration = 800`, and require
`Authorization: Bearer <token>`. Responses use a discriminated `status` union
(`success` | `error` | `received`).

| Endpoint | Body | Does |
|----------|------|------|
| `POST /api/extract` | multipart: `file` (PDF/DOCX/JPG/PNG) + `profile_type` + **`logo`** (optional image) | LlamaExtract against the per-type schema → `{ data, confidence_scores, flagged_fields, brand }`. `brand` is non-null only when a `logo` was supplied |
| `POST /api/extract-url` | JSON: `{ url, profile_type }` | Firecrawl crawl (≤25 pages, markdown + links) → same LlamaExtract pipeline; forces the submitted URL into `portfolio_links` (professional) / `social_links` (student). Also returns `brand` for the site |
| `POST /api/enhance` | JSON: `{ profile, profile_type }` | single GPT-4.1 call → `{ bio, projects, internships, experience }` |
| `POST /api/template` | JSON: `{ profile, profile_type, enhanced?, brand?, photo_url?, template?, theme? }` | cleans the profile, derives the theme from `brand`, returns **`suggested`** (the top 3, ranked + explained) plus `eligibility` + `offered` (+ `html` when `template` is given). No AI call — pure rendering |

**`/api/template` specifics:**
- **No engine, no key.** It never calls a third-party service, so it has no
  stub path — it degrades only on *content*, not on configuration.
- Returns `status: "received"` while an audience has zero cards built. But if
  the caller explicitly asked for a `template`, it returns **404** instead — a
  quiet 200 would read as "rendered fine, no HTML".
- **422 `TEMPLATE_NOT_ELIGIBLE`** when a built card's data minimum isn't met.
  Minimums live in `templates/guards.ts`; gating is what stops us offering a
  card that would render badly.

**Graceful degradation (by design):**
- Missing engine key (`LLAMA_CLOUD_API_KEY` / `FIRECRAWL_API_KEY` / `OPENAI_API_KEY`)
  → route returns a `status: "received"` validation-only stub instead of failing.
- Missing `EXTRACT_AUTH_TOKEN` → `503 AUTH_NOT_CONFIGURED`. The API **never runs open**
  (protects paid credits on a public URL).
- Engine errors are logged server-side; the client gets a generic message (no vendor/stack leakage).

## Auth

Shared **Bearer token** compared with `timingSafeEqual` (`lib/route-helpers.ts`).
`EXTRACT_AUTH_TOKEN` is the server secret; `NEXT_PUBLIC_EXTRACT_TOKEN` is the *same value*
exposed to the browser to pre-fill the demo UI (a shared access token, intentionally
public — not a user secret). **TODO in code:** swap the shared secret for AnurCloud
JWT/introspection once their scheme is confirmed.

## Environment variables

Set in `plugins/.env.local` (gitignored via `.env*`) and mirrored in Vercel. **Names only:**

| Var | Purpose | Required |
|-----|---------|----------|
| `LLAMA_CLOUD_API_KEY` | LlamaCloud extraction (Module 1) | yes (else stub) |
| `FIRECRAWL_API_KEY` | Firecrawl URL crawl | yes for `/extract-url` |
| `OPENAI_API_KEY` | OpenAI GPT-4.1 enhancement (Module 3) | yes (else stub) |
| `EXTRACT_AUTH_TOKEN` | server-side Bearer token check | yes (else 503) |
| `NEXT_PUBLIC_EXTRACT_TOKEN` | same token, pre-fills the demo UI | optional |
| `EXTRACT_FLAG_THRESHOLD` | confidence cutoff for flagging fields (0–1) | optional, default `0.7` |

## Commands

```bash
npm run dev      # next dev (Turbopack)
npm run build    # next build — this is the type-check gate (no separate type-check script)
npm run start    # next start
npm run lint     # eslint
npm run check:templates     # enforces the templates/ self-contained rule
npm run verify:foundation   # 772 checks: cleaning, guards, field coverage, minimums, brand, suggestion, every card
npm run stress              # public/stress.html — every card × hostile content × 4 widths
npm run check:overflow      # measures that page in headless Chrome (skips cleanly if absent)
npm run verify              # all six gates in sequence
npm run preview             # public/preview.html — every card × 3 data levels, grayscale toggle
./demo.sh [student|professional] [sampleFile]   # live API demo (reads EXTRACT_AUTH_TOKEN from .env.local)
```

Before committing: run `npm run verify`. It is green — keep it that way.

> The `react-hooks/set-state-in-effect` errors in `app/enhance/page.tsx` and
> `app/template/your-card.tsx` are suppressed with scoped disables and a written
> justification: each effect reads a one-shot sessionStorage handoff, and moving
> it to a lazy `useState` would read during hydration while the prerendered HTML
> was built with the default sample — a real bug traded for a cosmetic one.
> Don't "fix" it by removing the comment without solving the hydration side.

## Conventions & gotchas

- **`templates/` must import nothing from `lib/` or `app/`** — no relative
  escapes, no `@/` alias, no npm packages. This is what keeps the card set
  liftable: deliverable on its own, or publishable as a package later, without
  touching a line. One convenient helper import breaks it silently, so
  `npm run check:templates` enforces it. `lib/` importing `templates/` is fine —
  the rule is one-directional. Anything that knows about both sides belongs in
  `profile-to-card.ts` or `brand-to-theme.ts`.
  *(Delivery route decided 10 Aug 2026: codebase handover, cards as files, no
  npm package. The rule stands anyway — it costs nothing and keeps the option.)*
- **`app/template/page.tsx` is driven by the registry, not hand-maintained.** It
  renders real cards via `renderCard()` at build time and reads names, minimums
  and counts from `templates` / `plannedTemplates`. Add a card and the page picks
  it up with no edit here. It previously showed invented cards with fake fit
  scores (`TMP-101 · 94%`) for templates that did not exist — never reintroduce
  mock output on a page the client can open.
- **The demo pages are a chain, wired by `lib/handoff.ts`.** Extraction → Enhance
  → Template, each step writing a one-shot sessionStorage prefill (never a query
  string: a profile is too big for a URL and must not land in history or a log).
  `brand` rides along the whole way — drop it at any hop and the card silently
  falls back to the default crimson right after the user uploaded a logo, which
  reads as the colour feature being broken.
- **Enhancement IS a gate, enforced in `app/template/your-card.tsx`** (owner's
  call, 11 Aug 2026, DEV-3058). The panel runs `/api/enhance` before `/api/template` unless
  the handoff already carries a bio, and threads the result into the profile it
  sends. It is enforced there rather than on the extraction page because the panel
  is the single choke point — every route into the card step passes through it, so
  the chain cannot be bypassed by arriving from somewhere else.
  *Why it matters concretely:* Pull Quote's minimum is a bio, so a profile that
  skipped Module 3 could never be suggested the layout built around one, and every
  card's bio block rendered empty. On the test professional profile, running
  enhancement first takes eligibility from 9/10 to 10/10 and puts Pull Quote
  second on the shortlist.
  *It runs, but it does not block:* a missing `OPENAI_API_KEY` returns the
  engine's `status: "received"` stub, and the panel then continues to the cards
  and says enhancement did not run. Refusing to show anyone their card because
  OpenAI is unreachable would be the worse failure.
- **Theme options are untrusted, and escaping cannot save them.** Profile fields
  go through `esc()`/`attr()`, but theme values land inside the `style`
  attribute and inside a `<style>` block, where a quote breaks out and turns an
  embedded card into an XSS vector for whoever renders it. `resolveTheme()`
  therefore **re-emits rather than passes through**: colours are parsed and
  rebuilt from their own channels, fonts must match a strict character class,
  `scopeId` is pattern-checked, and every number is range-checked. Anything
  unparseable falls back to a default. Adding a new `ThemeOption` means adding
  its validator — the values arrive from `/api/template`'s request body and from
  colours derived off third-party logos and websites.
- **A card owns its layout CSS.** Each file exports `{ build, styles }`; the
  registry injects the shared primitives from `styles.ts` plus that card's own
  block. Shared CSS holds typography, avatar, chips, contact rows, list items —
  never a layout. This is why one card can't quietly restyle another.
- **Every field in `lib/schema.ts` must reach a card (DEV-3061).** From the start,
  `achievements`, `publications`, `extracurriculars` and `registrations` were
  extracted, typed in `lib/types.ts`, and **never mapped into `CardProfile`** — so
  a CV listing awards or papers lost all of it silently, and the profile read as
  thinner than it was. `portfolio_links` kept only the first URL. Closed 11 Aug
  2026. `verify-foundation.mts` now walks `schemaFieldKeys()` and fails until every
  schema key has a recorded destination, so adding a field forces the decision.
  Adding one means touching **three** files: `lib/schema.ts`, `templates/types.ts`
  (`CardProfile`), `lib/profile-to-card.ts` (a mapper) — and then a section
  renderer plus the cards, or it is carried and never shown, which looks identical
  to the user.
- **Display ceilings live in `templates/limits.ts`, not in the cards (DEV-3062).** Every card
  used to carry its own: two roles, one education line, eight skills, a bio cut at
  160 characters. On a senior CV that was destructive — an eighteen-year career
  rendered as two jobs and a degree, and the person looked less accomplished on
  their card than on the document (client report, 11 Aug 2026). `SHOW` is the
  full-width dial; `NARROW` is for a column at ~half the card width (a tile, a
  half, the aside beside a wedge), where eighteen chips is a wall rather than a
  list. Cleaning keeps far more than either, so raising a number shows more with no
  re-extraction. A few cards cap lower still for structural reasons — Role Ladder's
  four rungs, Stat Strip's three cells — and say why in place.
- **A heavy profile now produces a TALL card, not a truncated one** — measured
  74px for a bare profile up to **2154px** for a senior CV at 380px wide (A4 at
  96dpi is 1122px, so a full career is about two pages). That is the honest failure
  of the two, but it is still a failure: splitting a tall card across pages is not
  built. See "Pagination" below.
- **Layout breakage is measured, not eyeballed (DEV-3060)** — `npm run stress` renders every
  card against content chosen to break it (a 45-char unbreakable string, a
  60-char institution, twenty skills, Tamil script, an email at a long domain, the
  bare minimum) at four widths including **responsive in a 260px host**, which is
  what fires the container queries. `npm run check:overflow` then measures that
  page in headless Chrome for four failures: painted outside the card, content
  wider than its own box, two pieces of text overlapping, and the card wider than
  its host column. It skips cleanly when no Chrome is installed.
  The first run found **120 problems**. Root causes, all fixed:
  - `.iv-chip` had `white-space:nowrap`, so an unbreakable skill made the chip as
    wide as the text — up to **230px outside the card**, on nine cards.
  - nothing gave long words a break opportunity, so names and institutions escaped
    their column. The card root now sets `overflow-wrap:anywhere` — **`anywhere`,
    not `break-word`**: only `anywhere` reduces min-content size, and a flex or
    grid child will not narrow past min-content whatever `max-width` says.
  - Overlap's banner collided with its plate at 320px. A fixed-height zone plus a
    negative margin is a collision waiting for a longer string; the zone now has a
    bottom padding larger than the plate's lift, reserving the strip it lands on.
- **A social label is one or two code points — never more (DEV-3059).** `www` in a
  1.7em circle is **25.6px of text in a 16.9px circle**, so the glyphs sat on the
  card; the generic-website entry is now `↗`. Card-level overflow checks miss this
  entirely, because nothing escapes the *card* — it escapes the *circle*. `.iv-si`
  carries `overflow:hidden` as a guarantee, verify asserts the 2-code-point limit
  so a newly added platform cannot reintroduce it, and `iv-si` is on
  `check-overflow.mjs`'s `INTENTIONAL_CLIP` list so that safety net is not itself
  reported as a failure.
- **Assert on markup, not on the rendered string.** Class names appear in both
  the `<style>` block and the markup, so `html.includes("iv-hs-body-single")`
  matches the stylesheet and reports a layout rule as working when it never
  fired. Strip `<style>` blocks first — `verify-foundation.mts` has `markupOf()`.
- **Cards assume patchy data.** Cleaning happens once in `profile-to-card.ts`
  (blanks, `"N/A"`, placeholder text, malformed URLs, truncated fragments);
  empty-section hiding happens once in `templates/guards.ts`. A card must never
  re-implement either — with 20 cards, one will forget and the client finds it.
  Every card is designed at three data levels: rich, typical, **thin**
  (name + one education line). Thin is common, not an edge case.
- **Dates are free text, not dates.** `schema.ts` yields `"2021–2025"`,
  `"Summer 2024"`, `"3 months"`. `deriveSortYear()` in `profile-to-card.ts`
  takes the *latest* 4-digit year, treats present/current/ongoing as newest, and
  returns null when nothing is recoverable. **The original text is always what
  gets displayed** — the parsed year only orders the list.
- **`lib/schema.ts` is the single source of truth.** Extraction fields, the UI "fields
  we'll extract" preview, and the engine's JSON schema all derive from it. Change a field
  there and keep `lib/types.ts` in lockstep. All fields are marked `required` in the
  generated JSON schema so the engine always returns every key (`null`/`[]` when absent) —
  this prevents silent field omission on low-confidence fields.
- **Server-only keys.** Engine clients read keys from `process.env` and are singletons;
  never import them into client components. Client/server-shared code (e.g.
  `lib/validation.ts`) must stay free of server-only deps.
- **File uploads:** PDF / DOCX / JPG / PNG (images are OCR'd by the engine). There is **no
  app-level size limit**, but upstream caps apply — Vercel serverless request bodies are
  ~4.5 MB, plus engine limits. (Ignore any older "10 MB" note — it's not enforced here.)
- **Confidence scores are uncalibrated** — use comparatively, not as absolute accuracy.
  Fields below `EXTRACT_FLAG_THRESHOLD` land in `flagged_fields` for the human Review step.
- **Brand theme (`lib/brand.ts`) — hard-won details, don't "simplify" these away:**
  - The logo is at **`branding.images.logo`**. The top-level `branding.logo` the SDK
    type advertises is `null` on every site tested.
  - **Request `branding` and `html` as two separate scrapes.** Firecrawl runs a script
    inside the page to analyse branding and it can throw (it does on anurcloud.com).
    Bundled in one call, that failure takes the HTML and favicon fallback down with it.
  - **Never trust `colors.primary`** — it returned a near-black text colour on
    stripe.com and a grey on pxlbrain.com. Every candidate goes through
    `isBrandColor()`; `components.buttonPrimary.background` is the best signal.
  - Brand lookups are **fire-and-forget alongside** the crawl/extraction, and every
    failure path returns `null`. A brand lookup must never fail an extraction.
  - Results are **cached per URL** (24h) because the analysis is AI-assisted and
    non-deterministic — zoho.com returned a different primary across runs.
  - `sharp` handles PNG/JPG/WebP/**SVG** (via librsvg, needs `density: 200`) but
    **not `.ico`** — those fall through to the next candidate.
- **Enhancement is strictly grounded:** the prompt forbids inventing anything not present
  in the profile; the model returns unchanged title/role/company keys for matching.
- The `enhance/page.tsx` demo calls the deployed endpoint (`https://anurcloud.vercel.app/api/enhance`) directly.

## Links

- Product / status: `../../knowledge/anur-cloud.md`
- Integrations (Linear / Notion / GitHub `KLM-Solutions/anurcloud`): `../../account/anur-cloud.md`
- Deployed: https://anurcloud.vercel.app (Vercel)
