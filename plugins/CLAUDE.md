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
| 3 · Enhance | PxlBrain | **Live** | `/api/enhance`, `lib/enhance-engine.ts`, `lib/llm-chat.ts`, `lib/enhance-validate.ts` |
| 4 · Template | PxlBrain | **all 22 cards live** | `/api/template`, `templates/`, `components/cards/`, `lib/suggest-llm.ts`, `lib/profile-to-card.ts`, `lib/brand-to-theme.ts` |

> **In the UI, Modules 3 and 4 are now one step — "Enhancement + Card"** (merged
> 21 Aug 2026, commit `a173440`). Enhancement always runs before the card, so the
> homepage, nav and flow present them together; the standalone `/enhance` page is
> delinked from the UI (the file still exists). `/template` **redirects to
> `/playground`**, which is the live card viewer. Server-side the two modules are
> still separate endpoints.

**Module 4 state:** foundation built and verified (DEV-3040), plus the **full
20** (student DEV-3035…3039 + DEV-3041…3045, professional DEV-3046…3055): 10 student (Side Rail, Hero Split, Centre Portrait, Timeline, Tile Grid,
Ticket Stub, Corner Wedge, Monogram Block, Index Ledger, Column Flow) and 10
professional (Skill Meters, Split Halves, Overlap, Numbered, Folder Tab, Stat
Strip, Role Ladder, Letterhead, Edge Spine, Pull Quote). **Two more professional
cards were added 18 Aug 2026 (DEV-3069/3070): Badge (21) and Spotlight (22)** —
the set is now **22**. These two are the ONLY professional cards with an identity
circle; they exist so a professional who uploads a logo has a home for it (the
logo fills the circle), and each is structurally distinct from the other and from
every student avatar card.

> **Card 6 (student) is now Ticket Stub, not Footer Anchor** (replaced 20 Aug
> 2026, DEV-3072/3074). Footer Anchor — a colour band at the bottom — was cut and
> `student-06-ticket-stub.ts` took its slot: a coloured header with a dashed
> perforation and a notch bitten out of each edge, tearing off a stub. Don't
> rebuild Footer Anchor.

> **Cards render as React components only — there is no HTML render path.**
> (HTML string builders + pagination were removed 24 Aug 2026 as unnecessary once
> the React set landed.) The two halves now are:
> - `components/cards/*.tsx` — the 22 **self-contained React components** (the
>   "dynamic digital card"), mapped by `components/cards/registry.tsx`. This is the
>   whole render layer and the hand-off into Anur Cloud's React/TS app.
> - `templates/` — the **recommendation brain only**: catalogue metadata,
>   eligibility, ranking, minimums, theme resolution, and a few pure helpers the
>   React cards import (`styles.ts` `cardStyles`, `helpers.ts`, `icons.ts`,
>   `sections.ts` `socialKey`). It builds **no markup**.
> Adding or renaming a card means touching the React component + `registry.tsx`
> and the `PLANNED` list in `templates/index.ts`.

**The professional order is the owner's, set 11 Aug 2026 (DEV-3056)** — ids 11–20 run in
exactly the sequence above, and the filenames encode it. Two earlier cards
("Frame", a colour ring on all four edges, and "Mid Band", a colour band across
the middle) were built and **cut by the owner as not different enough**; Edge
Spine and Pull Quote replaced them. Don't rebuild either.

**Two pools, and they differ in content, not only in arrangement.** Three
professional layouts gate on fields the student schema does not have —
`total_years_experience` (Stat Strip) and `experience[].highlights` (Role Ladder,
Skill Meters) — so they are unreachable from a student profile even if the
audience filter were bypassed (the eligibility minimums in `templates/guards.ts`
are the barrier). No professional card puts the identity inside a full-width top
band, and only **Badge (21) and Spotlight (22)** use the initials/logo circle —
the two opt-in avatar cards. The other ten professional cards deliberately avoid
the circle; that is now a design property of each React component rather than a
verify assertion (the automated check was removed with the HTML path).

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

> **Ranking is now LLM-first, rules-fallback (`lib/suggest-llm.ts`).**
> `/api/template` calls `suggestTemplatesLLM()`: the **rules still decide
> eligibility** (the model only ever sees cards the profile can actually fill, so
> it can't suggest one that renders badly), then the LLM ranks those and writes a
> one-line reason each. Every honesty guard survives — no `%` ever (a reason
> carrying one is thrown out), and the coarse tier is **borrowed from the
> rule-based score**, not invented by the model. Any failure (no LLM configured,
> model error, bad JSON, unknown/duplicate ids, fewer than 3 valid picks) falls
> back to the deterministic `suggestTemplates`. `suggestTemplates` itself is
> unchanged and still the fallback + the source of the tier.

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

**No display caps — show every field in full (owner's call, 20 Aug 2026, DEV-3072/3074).**
The count caps that used to live in `templates/limits.ts` (skills 18, roles 6,
projects 5, bio at 160 chars, …) are **gone**. Every dial in `SHOW`/`NARROW` is
now `UNLIMITED` — cards still call `SHOW.skills`, `NARROW.roles`, etc., but each
means "render them all". Nothing the profile contains is dropped at render time.
`SHOW`/`NARROW` are kept as named dials only so a future cap is one edit, not a
hunt through every card.

**Length is handled by the card being dynamic, not by pagination.** The old
server-side pagination (`templates/pagination.ts`, fixed-height A4 pages) was
**removed 24 Aug 2026** together with the HTML render path. In the React cards a
long profile is not a "tall page" problem: the profile fills a **hero** first,
then each section is **navigable on demand** — a big section (>4 items) gets its
own screen, a small one shows inline — via the `Accordion`/section model in
`components/cards/card-kit.tsx`. So "show everything" and "don't overflow" are
reconciled by interaction, not by breaking content across printed pages.

**Logo goes in the identity circle, on the cards that have one (owner's call, 18
Aug 2026 — DEV-3068).** The old `logoSlot()` system — a dedicated corner slot on all 20
cards, with `.iv-logo-*` styling — was **removed**: the owner judged the corner
placement not good enough and superseded the 22 Jul / 3 Aug position commitment.
Instead, a user-uploaded logo now **replaces the initials inside the avatar
circle**, filled and cropped like a photo (`avatar()` in `helpers.ts` takes the
logo url as a 3rd arg; `student-08`'s square `monogram()` does the same). The
logo still arrives as `theme.logo` from `lib/brand.ts` / the `/api/logo` upload —
that plumbing is reused, not rebuilt.

Consequence, and it is deliberate: a logo shows only on the cards with a circle —
the **8 student cards** (`student-01`…`08`) and, since 18 Aug 2026, the **2
professional avatar cards Badge (21) and Spotlight (22)**. The other 10
professional cards and `student-09`/`10` have no circle, so they carry no logo.
Building Badge and Spotlight was the owner's answer to "professionals want a logo
too" — rather than reviving the corner slot, add two opt-in avatar layouts. The
"logo fills the circle when supplied, and no other professional card grows a
circle" behaviour now lives in the React components themselves (the verify
assertion that used to guard it was removed with the HTML path).

The four cards in the repo-root `insta-viz-templates/` folder are **throwaway
prototypes** — they do not count toward the committed 22, and nothing here
imports from them.

**React (TSX) card delivery — the dynamic digital card (DEV-3072/3074, 21 Aug 2026).**
All 22 cards are **self-contained React components** in `components/cards/*.tsx`,
mapped by `components/cards/registry.tsx` (`REACT_CARDS`, `BUILT_CARD_KEYS`,
`isCardBuilt`). This is the **only** render path and the hand-off into Anur
Cloud's React/TS app.
- **The React set renders a "dynamic digital card":** the profile fills a hero
  first, then sections are navigable on demand (accordion / per-section screens),
  not one long printed page. Shared pieces — `Items` / `Chips` / `Avatar` /
  `SocialIcons` / `Accordion`, the section model, per-template palette, `cardTheme`
  — live in `components/cards/card-kit.tsx`.
- **There is no HTML/server render.** `registry.tsx` returns JSX rendered
  client-side. `/api/template` does **not** return markup — it returns eligibility
  + the LLM-ranked shortlist + the resolved theme, and the client renders the
  chosen component with that theme. (The old `renderCard()`/`html`/`pages` path
  and `templates/pagination.ts` were deleted 24 Aug 2026.)
- **`templates/` is imported by the React cards, one-directional.** The components
  pull a few pure helpers from it — `cardStyles` (`styles.ts`), `safeUrl`/
  `initials` (`helpers.ts`), `socialKey` (`sections.ts`), `BRAND_ICONS`
  (`icons.ts`) — so `templates/` must stay dependency-free (the self-contained
  rule still holds and `npm run check:templates` still enforces it).
- **Social icons are real SVGs** — `templates/icons.ts` is a self-contained brand
  icon set with a globe fallback, used by `card-kit.tsx`.
- **The playground (`app/playground/page.tsx`) is the live React viewer.** It
  renders the dynamic React card (first eligible by default, or the real handoff
  profile with brand colours + logo) and calls `/api/template` **for eligibility
  only**. `lib/dev-dummy-profiles.ts` supplies rich dummy profiles for QA.

**LLM engines — local model first, OpenAI + rules as fallback.** Both Module 3
(enhancement) and Module 4 (card-picking) run through one shared helper,
`lib/llm-chat.ts`, which is env-configured:
- **`isLocalLLM()`** is true when `LOCAL_LLM_BASE_URL` is set. Local uses
  **Ollama's native `/api/chat`** with `think:false` + `format:"json"` — NOT the
  OpenAI-compatible `/v1` endpoint, which has a known bug where `think:false` is
  ignored and `content` comes back empty (reasoning lands in a `reasoning` field).
  OpenAI uses the SDK with `response_format: json_object`.
- **`MODEL = LOCAL_LLM_MODEL ?? "gpt-4.1"`**, temperature **0.2** by default
  (`LLM_TEMPERATURE`) — both jobs are grounded/fact-bound, and at the SDK default
  a small model embellishes (it expanded "CKA" into "Certified Kubernetes
  Administrator"). Low temp cuts that at no quality cost.
- **Small models need a validation layer.** `lib/enhance-validate.ts`
  (`validateEnhance`) coerces the model's output to the shape the renderer expects
  and enforces grounding in code: an enhanced project/internship/experience is
  kept ONLY if its identity key matches an entry that was in the request profile;
  hallucinated entries are dropped, and a matched-but-empty enhancement falls back
  to the profile's own text. A 4B model will occasionally break the "never invent"
  rule the prompt states, so it's enforced twice.
- **`lib/llm-chat.ts` note:** the local branch is a Mac/Ollama test workaround.
  **Production runs vLLM**, whose `/v1` is not buggy — swap the local branch for
  the vLLM branch (OpenAI API + `chat_template_kwargs: { enable_thinking: false }`)
  at deploy time.
- **`eval-results/`** holds a GPT-4.1 vs Qwen-4B quality comparison
  (`compare-gpt-4.1-vs-qwen-4b.md`, per-model JSON). Regenerate with `npm run eval`
  (`scripts/eval-quality.mts` + `scripts/eval/golden.ts` + `scripts/eval/score.ts`).

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
the colour removed, it isn't a new template. (The `npm run preview` grayscale
harness was removed with the HTML path; check it by eye in the playground for now.)

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
- **LLM (enhancement + card-picking)** via `lib/llm-chat.ts` — a **local model**
  (Ollama/Qwen in dev, vLLM in prod) when `LOCAL_LLM_BASE_URL` is set, otherwise
  **OpenAI** (`openai`, default model `gpt-4.1`). Rule-based fallbacks below both.

## Layout

```
plugins/
├── app/
│   ├── page.tsx            landing — flow overview (Modules 3+4 shown as one step)
│   ├── extraction/page.tsx interactive extraction demo (client): file + URL modes
│   ├── enhance/page.tsx    enhancement demo (client) — DELINKED from UI, file kept
│   ├── playground/page.tsx live React card viewer (client): dynamic card, dummy or real profile
│   ├── template/page.tsx   redirects → /playground (old gallery + your-card removed)
│   ├── layout.tsx          Geist fonts, light-only, metadata
│   └── api/
│       ├── extract/route.ts       file  → structured profile
│       ├── extract-url/route.ts   URL   → Firecrawl → structured profile
│       ├── logo/route.ts          logo upload proxy (SSRF-guarded)
│       ├── enhance/route.ts       profile → polished bio + descriptions (LLM, validated)
│       └── template/route.ts      profile → eligible + LLM-ranked cards + theme (NO html)
├── components/cards/    22 cards as React (TSX) — the ONLY render path
│   ├── registry.tsx     REACT_CARDS map, BUILT_CARD_KEYS, isCardBuilt
│   ├── card-kit.tsx     shared: Items/Chips/Avatar/SocialIcons/Accordion, section model, palette, cardTheme
│   └── <Card>.tsx       one component per card (SideRail, HeroSplit, …, Badge, Spotlight — 22 total)
├── templates/           ⚠️ SELF-CONTAINED — the recommendation brain (no markup)
│   ├── index.ts         catalogue (PLANNED) + templatesFor / eligibleTemplates / suggestTemplates
│   ├── types.ts         CardProfile / ThemeOptions / TemplateInfo / TemplateKey
│   ├── theme.ts         theme resolution + hex maths + contrast helpers
│   ├── guards.ts        empty-content rules, per-template minimums, dataLevel(), volume
│   ├── limits.ts        SHOW / NARROW — now ALL `UNLIMITED` (no display caps)
│   ├── rank.ts          suggestion: top 3 ranked + reasons (NO fit percentages)
│   ├── icons.ts         self-contained brand social-icon SVGs + globe fallback (used by React)
│   ├── helpers.ts       esc / attr / safeUrl / initials / avatar (safeUrl/initials used by React)
│   ├── sections.ts      socialKey() — platform name → icon key (used by card-kit)
│   └── styles.ts        cardStyles() — shared scoped CSS primitives (used by React cards)
├── scripts/
│   ├── check-template-isolation.mjs   enforces the templates/ self-contained rule
│   ├── ts-resolver.mjs                dev-only loader hook for the .mts scripts
│   ├── eval-quality.mts               LLM output-quality eval harness (npm run eval)
│   └── eval/                          golden.ts (fixtures) + score.ts (grounding/quality scoring)
├── lib/
│   ├── schema.ts        SINGLE SOURCE OF TRUTH for extraction fields (+ JSON-schema gen)
│   ├── types.ts         extraction contract types + API response shapes
│   ├── validation.ts    file/profile-type validation (client + server safe)
│   ├── llama.ts         extraction engine wrapper (Module 1)
│   ├── color.ts         colour maths — HSL, brand filter, ranking (pure, either side)
│   ├── brand.ts         brand theme engine — site via Firecrawl, logo via sharp (SERVER ONLY)
│   ├── llm-chat.ts         shared LLM chat helper — local (Ollama/vLLM) or OpenAI (SERVER ONLY)
│   ├── enhance-engine.ts   enhancement wrapper (Module 3) — calls llm-chat, then validates
│   ├── enhance-validate.ts grounding + shape guard for small-model enhancement output
│   ├── enhance-types.ts    Module 3 request/response types
│   ├── suggest-llm.ts      LLM card-picking (Module 4) — rules first, rule-based fallback
│   ├── profile-to-card.ts  GLUE: extraction → CardProfile (cleaning + timeline dates)
│   ├── brand-to-theme.ts   GLUE: BrandTheme → ThemeOptions (the colour join)
│   ├── template-types.ts   Module 4 request/response types
│   ├── dev-dummy-profiles.ts  rich sample profiles for the playground / QA
│   ├── handoff.ts          one-shot page→page prefill via sessionStorage (browser only)
│   └── route-helpers.ts    fail() responder + timing-safe tokenMatches()
├── eval-results/        GPT-4.1 vs Qwen-4B quality comparison (md + per-model JSON)
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
| `POST /api/enhance` | JSON: `{ profile, profile_type }` | single grounded LLM call (local model or GPT-4.1 via `llm-chat`), output run through `enhance-validate` → `{ bio, projects, internships, experience }` |
| `POST /api/template` | JSON: `{ profile, profile_type, enhanced?, brand?, theme? }` | cleans the profile, derives the theme from `brand`, returns **`suggested`** (top 3, **LLM-ranked** + explained; rule-based fallback) plus `eligibility` + `offered` + `theme`. **No markup** — the client renders the chosen React card with the returned theme. Only AI call is the suggestion ranking. (A `template`/`photo_url` field in the body is accepted but ignored.) |

**`/api/template` specifics:**
- **It does not render.** Cards are React components rendered client-side, so the
  route returns eligibility + ranking + theme only — never HTML. The `eligibility`
  array tells the client which cards it may render and why the rest can't.
- **Minimums still gate eligibility.** `templates/guards.ts` decides whether a
  profile can fill a card; a card that fails its minimum is marked ineligible in
  the `eligibility` array (it just isn't a render-time 422 any more).
- Returns `status: "received"` if an audience has zero cards built (it never does
  now — all 22 exist).

**Graceful degradation (by design):**
- Missing engine key (`LLAMA_CLOUD_API_KEY` / `FIRECRAWL_API_KEY`, or **no LLM at
  all** — neither `LOCAL_LLM_BASE_URL` nor `OPENAI_API_KEY`) → route returns a
  `status: "received"` validation-only stub instead of failing. Card-picking with
  no LLM falls back to the deterministic rule-based ranking.
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
| `OPENAI_API_KEY` | OpenAI enhancement + card-picking (Modules 3/4) | yes unless a local LLM is set (else stub / rule-based) |
| `LOCAL_LLM_BASE_URL` | local model endpoint (Ollama `/v1` in dev, vLLM in prod); when set, used instead of OpenAI | optional |
| `LOCAL_LLM_MODEL` | model id for the LLM (defaults to `gpt-4.1`) | optional |
| `LLM_TEMPERATURE` | sampling temperature for both LLM jobs | optional, default `0.2` |
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
npm run verify              # check:templates → lint → build (the whole gate)
npm run eval                # LLM output-quality eval (reads .env.local; writes eval-results/)
./demo.sh [student|professional] [sampleFile]   # live API demo (reads EXTRACT_AUTH_TOKEN from .env.local)
```

Before committing: run `npm run verify`. It is green — keep it that way.

> **Verification is thinner since the HTML path was removed (24 Aug 2026).** The
> old `npm run verify:foundation` (807 checks over rendered card HTML), `stress`,
> `check:overflow`, `preview`, `pdf`, and `check-field-coverage` all asserted on
> the deleted HTML builders and were removed. The React cards have no equivalent
> render-level gate yet — `verify` now covers only isolation + lint + type-check
> (build). Re-establishing card-level checks against the React components (field
> coverage, overflow, grayscale) is open work.

> The `react-hooks/set-state-in-effect` error in `app/enhance/page.tsx` is
> suppressed with a scoped disable and a written justification: the effect reads a
> one-shot sessionStorage handoff, and moving
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
- **The live card viewer is `app/playground/page.tsx`, registry-driven.** The old
  `app/template/page.tsx` gallery is gone — that route now `redirect()`s to
  `/playground`. The playground renders the **React** cards from
  `components/cards/registry.tsx` (first eligible by default, or the real handoff
  profile) and calls `/api/template` for eligibility only. Add a card in the
  registry and the viewer picks it up with no edit here. It once showed invented
  cards with fake fit scores (`TMP-101 · 94%`) for templates that did not exist —
  never reintroduce mock output on a page the client can open.
- **The pages are a chain, wired by `lib/handoff.ts`.** Extraction → card step
  (`/template` → `/playground`), each hop writing a one-shot sessionStorage prefill
  (never a query string: a profile is too big for a URL and must not land in
  history or a log). `brand` rides along the whole way — drop it at any hop and the
  card silently falls back to the default crimson right after the user uploaded a
  logo, which reads as the colour feature being broken.
- **Enhancement is expected before the card, and its bio rides the handoff.**
  (The old hard-gate component `app/template/your-card.tsx` was **removed** with
  the HTML path, 24 Aug 2026.) The card step reads `enhanced.bio` from the handoff
  and falls back to the raw `profile.summary` when it is absent.
  *Why it still matters:* Pull Quote's minimum is a bio, so a profile that skipped
  enhancement can't be suggested the layout built around one, and any bio-driven
  section comes out empty. Running enhancement first unlocks Pull Quote and puts it
  high on the shortlist.
  *It never blocks:* with **no LLM configured** (neither `LOCAL_LLM_BASE_URL` nor
  `OPENAI_API_KEY`) the engine returns its `status: "received"` stub and the flow
  continues to the cards, using the raw summary. Refusing to show anyone their card
  because the model is unreachable would be the worse failure. **Re-establishing a
  single enforced choke point for enhancement is open work** now that `your-card`
  is gone.
- **Theme options are untrusted.** Theme values (colours, fonts, `scopeId`) end up
  in inline styles and in the scoped CSS `cardStyles()` emits, where a quote could
  break out and turn an embedded card into an XSS vector. `resolveTheme()`
  (`templates/theme.ts`) therefore **re-emits rather than passes through**: colours
  are parsed and rebuilt from their own channels, fonts must match a strict
  character class, `scopeId` is pattern-checked, and every number is range-checked.
  Anything unparseable falls back to a default. Adding a new `ThemeOption` means
  adding its validator — the values arrive from `/api/template`'s request body and
  from colours derived off third-party logos and websites.
- **A React card owns its own layout.** Each `components/cards/*.tsx` component
  renders its own structure; the shared primitives (typography, avatar, chips,
  contact rows, list items) come from `card-kit.tsx` and the scoped CSS in
  `templates/styles.ts` (`cardStyles`). Shared CSS holds primitives only — never a
  layout — so one card can't quietly restyle another.
- **Every field in `lib/schema.ts` must reach a card (DEV-3061).** From the start,
  `achievements`, `publications`, `extracurriculars` and `registrations` were
  extracted, typed in `lib/types.ts`, and **never mapped into `CardProfile`** — so
  a CV listing awards or papers lost all of it silently, and the profile read as
  thinner than it was. `portfolio_links` kept only the first URL. Closed 11 Aug
  2026. (The automated check that walked `schemaFieldKeys()` lived in
  `verify-foundation.mts` / `check-field-coverage.mjs`, both **removed** with the
  HTML path — so this is now a **manual** discipline until an equivalent check is
  written against the React cards.) Adding a field means touching **three** files:
  `lib/schema.ts`, `templates/types.ts` (`CardProfile`), `lib/profile-to-card.ts`
  (a mapper) — and then surfacing it in the React cards / `card-kit.tsx` section
  model, or it is carried and never shown, which looks identical to the user.
- **`templates/limits.ts` no longer caps anything (DEV-3072/3074, superseded DEV-3062).**
  It used to hold display ceilings (two roles, one education line, eight skills, a
  bio cut at 160 chars) — destructive on a senior CV, which rendered an eighteen-
  year career as two jobs and a degree (client report, 11 Aug 2026). The owner's
  20 Aug 2026 call is **show everything**: every `SHOW`/`NARROW` dial is now
  `UNLIMITED`, cards still call them by name, and each means "render all". Nothing
  is dropped at render time. `SHOW`/`NARROW` are kept as named dials only so a
  future cap is one edit, not a hunt through every card.
- **A heavy profile is handled by the card being dynamic, not by trimming.** The
  React card fills a hero, then makes each section navigable (accordion /
  per-section screens) — see "Length is handled by the card being dynamic" above.
  No truncation, no one-giant-card.
- **Overflow safety is now the React cards' own concern.** The old measured-breakage
  gate (`npm run stress` + `npm run check:overflow` in headless Chrome) was
  **removed** with the HTML path. It had caught real bugs worth remembering when
  writing the React CSS: an unbreakable skill string can blow a chip past the card
  edge, and long names/institutions escape their column unless the container uses
  **`overflow-wrap:anywhere`** (`anywhere`, not `break-word` — only `anywhere`
  reduces min-content size, and a flex/grid child won't narrow past min-content
  whatever `max-width` says). Re-establishing an automated overflow check against
  the React cards is open work.
- **Cards assume patchy data.** Cleaning happens once in `profile-to-card.ts`
  (blanks, `"N/A"`, placeholder text, malformed URLs, truncated fragments);
  empty-section hiding is decided in `templates/guards.ts`. A card must never
  re-implement either — with 22 cards, one will forget and the client finds it.
  Every card must work at three data levels: rich, typical, **thin**
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
- **Enhancement is strictly grounded, and now enforced in code too.** The prompt
  forbids inventing anything not in the profile and the model returns unchanged
  title/role/company keys for matching — but a small local model (Qwen 4B) breaks
  that more often than GPT-4.1, so `lib/enhance-validate.ts` re-checks it: an
  enhanced project/internship/experience is kept ONLY if its identity key matches
  a request entry; hallucinated entries are dropped, and a matched-but-empty
  enhancement falls back to the profile's own text so nothing is lost.
- The `enhance/page.tsx` demo calls the deployed endpoint (`https://anurcloud.vercel.app/api/enhance`) directly.

## Links

- Product / status: `../../knowledge/anur-cloud.md`
- Integrations (Linear / Notion / GitHub `KLM-Solutions/anurcloud`): `../../account/anur-cloud.md`
- Deployed: https://anurcloud.vercel.app (Vercel)
