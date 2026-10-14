# Insta VIZ — Plugins App

The AI engine behind **Insta VIZ** (Anur Cloud's product). Built by PxlBrain.

It turns a résumé (file or URL) into a structured profile, polishes it into a bio, and
suggests the best smart-card designs for it.

**Pipeline:** Extract → Review → Enhance → Template

| Step | Who | What |
|---|---|---|
| 1. Extract | PxlBrain | Reads a CV file or a URL and pulls out the profile fields |
| 2. Review | Anur Cloud | User checks and corrects the fields in Anur Cloud's UI |
| 3. Enhance | PxlBrain | Rewrites the profile into a polished first-person bio (never invents facts) |
| 4. Template | PxlBrain | Picks the top 3 cards (out of 22) and the brand colours / logo |

---

## What's in this app

**Pages (open in the browser)**

| Page | What it does |
|---|---|
| `/` | Home — flow overview |
| `/extraction` | Upload a CV or paste a URL, review the result, continue to the card |
| `/playground` | Card viewer — switch cards, try sample profiles, see the suggested card |

**API endpoints**

All endpoints need the header `Authorization: Bearer <access token>`.

| Endpoint | Input | Output |
|---|---|---|
| `POST /api/extract` | CV file (PDF / DOCX / JPG / PNG) + `profile_type` + optional `logo` | Profile fields, confidence scores, flagged fields, brand colours |
| `POST /api/extract-url` | `{ url, profile_type }` | Same as above, from a website |
| `POST /api/enhance` | `{ profile, profile_type }` | Bio + polished project / experience descriptions |
| `POST /api/template` | `{ profile, profile_type, enhanced?, brand? }` | Top 3 suggested cards + which cards fit + theme (data only, no HTML) |
| `POST /api/logo` | Logo image | Hosted logo for the card |
| `POST /api/warmup` | — | Wakes the AI model early so the first real request is fast |

`profile_type` is `student` or `professional`.

**The 22 cards** are React components in `components/cards/`. The API returns only
data — the website that uses this API renders the chosen card itself.

**Outside services**

| Service | Used for |
|---|---|
| LlamaCloud | Reading CV files |
| Firecrawl | Reading websites |
| Self-hosted Qwen model (Anur Cloud GCP, Singapore) | Bio writing + card picking |

---

## Run locally

Needs Node.js 20+.

```bash
cd plugins
npm install
npm run dev          # http://localhost:3000
```

Create `plugins/.env.local` with the settings below (never commit this file).

### Settings (environment variables)

| Name | What it is | Needed |
|---|---|---|
| `LLAMA_CLOUD_API_KEY` | LlamaCloud key (CV reading) | Yes |
| `FIRECRAWL_API_KEY` | Firecrawl key (website reading) | Yes, for URLs |
| `EXTRACT_AUTH_TOKEN` | Access token the API checks on every request | Yes |
| `NEXT_PUBLIC_EXTRACT_TOKEN` | Same token, used by the browser pages | Yes, for the pages |
| `LOCAL_LLM_BASE_URL` | Address of the AI model | Yes |
| `LOCAL_LLM_MODEL` | Model name (e.g. `Qwen/Qwen3.5-4B`) | Yes |
| `LLM_BACKEND` | `vllm` (default) or `ollama` | Optional |
| `GCP_SA_KEY_B64` | Model sign-in key file (base64). **Only outside GCP** (local / Vercel). On Cloud Run it is not set — the service signs in with its own identity | Outside GCP only |
| `LLM_TEMPERATURE` | AI creativity level (default `0.2`) | Optional |
| `EXTRACT_FLAG_THRESHOLD` | Confidence below which a field is flagged for review (default `0.7`) | Optional |

### Checks before any commit

```bash
npm run verify       # template check → lint → build
```

---

## Deploy to Google Cloud

The whole `plugins/` app (pages + API) runs as **one Cloud Run service**.

| Item | Value |
|---|---|
| Project | `digital-cards-ai` |
| Region | Mumbai — `asia-south1` |
| Service name | `instaviz-api` |
| Runs as | `instaviz-llm-invoker@digital-cards-ai.iam.gserviceaccount.com` (already allowed to call the model) |
| Access | Public, protected by the access token. Google sign-in check is off for this service only |
| Scaling | Sleeps when idle (min 0), capped max instances |
| Keys | Stored in Secret Manager — never in the image |

**What goes into the image:** everything inside `plugins/`, except `.env.local`
(keys), `node_modules` and `.next` (rebuilt during the build).
Nothing outside `plugins/` is included.

### Steps

1. **Store the keys in Secret Manager** (once)
   - `llama-cloud-api-key`
   - `firecrawl-api-key`
   - `extract-auth-token`

2. **Build the image** (from inside `plugins/`)
   - Note: `NEXT_PUBLIC_EXTRACT_TOKEN` is baked into the browser pages **at build
     time**, so it must be passed to the build, not only to the running service.

3. **Deploy to Cloud Run**
   - Region `asia-south1`, run as `instaviz-llm-invoker`
   - Keys from Secret Manager, other settings as plain values
   - Do **not** set `GCP_SA_KEY_B64` on Cloud Run
   - Turn off the sign-in check for this service only

4. **Test**
   - Open `/extraction` and `/playground` on the new address
   - Run a CV through extract → enhance → cards
   - Check the model service is still private

---

## Notes

- **The access token is visible in the browser pages.** For production use, replace it
  with the website's own user login check.
- **First request after idle is slow** (~2–2.5 min) because the AI model starts from
  sleep. The app wakes it as soon as `/extraction` opens.
- The 4 cards in the repo-root `insta-viz-templates/` folder are old prototypes, not
  part of this app.
