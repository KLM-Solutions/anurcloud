#!/usr/bin/env bash
# Deploy the Qwen 3.5 4B (vLLM) image to Cloud Run with an L4 GPU, scale-to-zero.
#
# Prereqs: image already built + pushed (see cloudbuild.yaml), and you are
# logged in (`gcloud auth login`) with the project set.
#
# ⚠️ COST: this is the step that starts GPU billing. The service scales to zero
# when idle (min-instances=0), so you pay only while an instance is awake
# (~$1.05/instance-hour; ~$20–50/mo for our load). First call after idle waits
# ~15–25s (cold start).
set -euo pipefail

PROJECT="${PROJECT:-digital-cards-ai}"
REGION="${REGION:-asia-southeast1}"   # Singapore — GCP Cloud Run L4 is NOT available in any India region
REPO="${REPO:-instaviz-llm}"
TAG="${TAG:-qwen3.5-4b-v1}"
SERVICE="${SERVICE:-instaviz-llm}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/instaviz-llm:${TAG}"

echo "Deploying ${IMAGE} → Cloud Run service '${SERVICE}' in ${REGION} (project ${PROJECT})"

gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --gpu 1 \
  --gpu-type nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --cpu 4 \
  --memory 16Gi \
  --port 8080 \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 8 \
  --timeout 600 \
  --startup-probe "tcpSocket.port=8080,periodSeconds=30,timeoutSeconds=30,failureThreshold=20" \
  --no-cpu-throttling \
  --no-allow-unauthenticated \
  --set-env-vars "HF_HUB_OFFLINE=1"

echo
echo "Deployed. Service URL:"
gcloud run services describe "${SERVICE}" --project "${PROJECT}" --region "${REGION}" \
  --format='value(status.url)'

cat <<'NOTE'

Next:
- The service is PRIVATE (--no-allow-unauthenticated). To let the Insta VIZ app
  call it, either bind the app's service account as run.invoker, or (if the app
  can't send a Google identity token) revisit auth. Binding the invoker needs
  run.admin — request from Anur Cloud IT if run.developer can't set it.
- Point the app at it:  LOCAL_LLM_BASE_URL = <service URL>/v1
                        LOCAL_LLM_MODEL    = Qwen/Qwen3.5-4B
- Smoke test (with an identity token):
    curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
         <service URL>/v1/models
NOTE
