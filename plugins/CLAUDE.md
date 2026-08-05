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
| 4 · Template | PxlBrain | **Planned** | `app/template/page.tsx` (marketing/spec only, no API yet) |

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
│   ├── template/page.tsx   template module — planned (spec/marketing)
│   ├── layout.tsx          Geist fonts, light-only, metadata
│   └── api/
│       ├── extract/route.ts       file  → structured profile
│       ├── extract-url/route.ts   URL   → Firecrawl → structured profile
│       └── enhance/route.ts       profile → polished bio + descriptions
├── lib/
│   ├── schema.ts        SINGLE SOURCE OF TRUTH for extraction fields (+ JSON-schema gen)
│   ├── types.ts         extraction contract types + API response shapes
│   ├── validation.ts    file/profile-type validation (client + server safe)
│   ├── llama.ts         extraction engine wrapper (Module 1)
│   ├── color.ts         colour maths — HSL, brand filter, ranking (pure, either side)
│   ├── brand.ts         brand theme engine — site via Firecrawl, logo via sharp (SERVER ONLY)
│   ├── enhance-engine.ts   OpenAI wrapper (Module 3)
│   ├── enhance-types.ts    Module 3 request/response types
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
./demo.sh [student|professional] [sampleFile]   # live API demo (reads EXTRACT_AUTH_TOKEN from .env.local)
```

Before committing: run `npm run build` and `npm run lint`.

## Conventions & gotchas

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
