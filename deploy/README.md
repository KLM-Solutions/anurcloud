# Insta VIZ — self-hosted LLM deployment (Qwen 3.5 4B on vLLM, GCP Cloud Run)

Deploys the model that powers **enhancement** (bio) and **card-picking** onto a
private GPU service in Anur Cloud's own GCP, so résumé PII stays in their account.

- **Model:** `Qwen/Qwen3.5-4B` (Apache-2.0, weights baked into the image), served
  **text-only** (`--language-model-only`) — the pipeline never sends images.
- **Serving:** vLLM (OpenAI-compatible `/v1`)
- **Where:** Cloud Run, 1× NVIDIA L4, scale-to-zero
- **Project:** `digital-cards-ai` · **Region:** `asia-southeast1` (Singapore) — no
  Cloud Run L4 in any India region

## Cost (what actually bills)
- **Enable APIs / create repo** — FREE.
- **Cloud Build** (build the image) — build-time, ~one-time; free tier covers it.
- **Image storage** — ~$1/mo (continuous, one image's worth).
- **GPU running** — the only real cost: ~$1.05/instance-hour, sleeps to $0 when
  idle → **~$20–50/mo** for our load. First call after idle waits on a cold start
  (model wake ~3–4 min from a full cold boot; being reduced — see the deployment log).

## One-time prerequisites (already done unless noted)
- APIs enabled: `run`, `artifactregistry`, `cloudbuild`, `compute`.
- Artifact Registry repo `instaviz-llm` created in `asia-southeast1`.
- Billing enabled on the project.
- IAM on the deploy account: `run.developer`, `iam.serviceAccountUser`,
  `artifactregistry.admin`, `cloudbuild.builds.editor`, `storage.admin`,
  `serviceusage.serviceUsageAdmin`, `logging.viewer`, `monitoring.viewer`.

## Steps

### 1. Log in (interactive, once)
```bash
gcloud auth login
gcloud config set project digital-cards-ai
```

### 2. Build + push the image  ⟵ first small cost (build minutes ~free, ~$1/mo storage)
```bash
cd deploy
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=asia-southeast1,_REPO=instaviz-llm,_TAG=qwen3.5-4b-v3 \
  --project digital-cards-ai
```

### 3. Deploy to Cloud Run  ⟵ starts GPU billing (scale-to-zero)
```bash
./deploy-cloudrun.sh
```
Prints the service URL when done.

### 4. Smoke test
```bash
URL=$(gcloud run services describe instaviz-llm --region asia-southeast1 \
      --project digital-cards-ai --format='value(status.url)')
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" "$URL/v1/models"
```

### 5. Point the app at it
Set in the plugins app env (`plugins/.env.local` / Vercel):
```
LOCAL_LLM_BASE_URL = <service URL>/v1
LOCAL_LLM_MODEL    = Qwen/Qwen3.5-4B
```
The app already routes both jobs through `lib/llm-chat.ts` when `LOCAL_LLM_BASE_URL`
is set, and disables Qwen thinking per request.

## Notes / possible follow-ups
- **Service is private** (`--no-allow-unauthenticated`). Letting the app call it may
  need `run.admin` to bind the invoker — request from Anur Cloud IT if needed.
- **Fallback model** if 4B quality falls short: `Qwen/Qwen3.5-9B` (change `MODEL_ID`
  in the Dockerfile, rebuild). Needs more VRAM — still fits one L4.
- **max-model-len 8192** is deliberate (small prompts) — raise only if inputs grow.
- Every action + cost is tracked in `docs/anur-cloud/gcp-deployment-log.md`.
