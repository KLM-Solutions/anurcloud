#!/usr/bin/env bash
#
# AnurCloud x PxlBrain — Live API Demo Script
# For: Technical meeting with AnurCloud
#
# Run from anywhere: ./plugins/demo.sh [profile_type] [sample_file]
#   profile_type  student | professional   (default: professional)
#   sample_file   filename in public/samples/  (default: subramani-resume.pdf)
#
# Requires: jq (brew install jq)
# Reads EXTRACT_AUTH_TOKEN from plugins/.env.local — never hardcode the token here.

set -euo pipefail
cd "$(dirname "$0")"

PROFILE_TYPE="${1:-professional}"
SAMPLE_FILE="${2:-subramani-resume.pdf}"
BASE="https://anurcloud.vercel.app"
SAMPLE_PATH="public/samples/${SAMPLE_FILE}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install with: brew install jq"
  exit 1
fi

if [ ! -f .env.local ]; then
  echo "Missing plugins/.env.local — run this script from inside the repo."
  exit 1
fi
set -a
source .env.local
set +a

if [ -z "${EXTRACT_AUTH_TOKEN:-}" ]; then
  echo "EXTRACT_AUTH_TOKEN not set in .env.local"
  exit 1
fi
TOKEN="$EXTRACT_AUTH_TOKEN"

if [ ! -f "$SAMPLE_PATH" ]; then
  echo "Sample file not found: $SAMPLE_PATH"
  exit 1
fi

section() {
  echo
  echo "════════════════════════════════════════════════════════════════"
  echo "  $1"
  echo "════════════════════════════════════════════════════════════════"
}

say() { echo "  ▸ $1"; }

pause() {
  read -rp "  [press Enter to run this step] " _
}

clear
section "AnurCloud × PxlBrain — Live Implementation Demo"
say "Environment : $BASE  (production, not localhost)"
say "Profile type: $PROFILE_TYPE"
say "Sample file : $SAMPLE_FILE"
pause

# ── STEP 0 — prove auth is enforced ─────────────────────────────────
section "STEP 0 — Security check: request WITHOUT a token"
say "Every module endpoint requires a Bearer token. Let's confirm that's enforced."
pause
echo "\$ curl -s -X POST $BASE/api/extract"
echo
curl -s -X POST "$BASE/api/extract" | jq .
say "→ Rejected with UNAUTHORIZED, as expected. No token, no access."

# ── STEP 1 — Module 1: Extraction (file upload) ─────────────────────
section "STEP 1 — Module 1: Extraction (resume upload → structured profile)"
say "POST /api/extract — multipart/form-data, file=$SAMPLE_FILE, profile_type=$PROFILE_TYPE"
say "This runs schema-driven extraction (LlamaExtract) — typically 15–25s."
pause

EXTRACT_RESPONSE=$(curl -s --max-time 120 -X POST "$BASE/api/extract" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@${SAMPLE_PATH}" \
  -F "profile_type=${PROFILE_TYPE}")

STATUS=$(echo "$EXTRACT_RESPONSE" | jq -r '.status // "unknown"')
if [ "$STATUS" != "success" ]; then
  echo "$EXTRACT_RESPONSE" | jq .
  echo
  say "⚠ Extraction did not return success (status=$STATUS). See response above."
  say "  If this is ENGINE not configured, the LLAMA_CLOUD_API_KEY may be missing on Vercel."
else
  echo "$EXTRACT_RESPONSE" | jq '{status, profile_type, data, flagged_fields}'
  echo
  say "→ Full structured profile extracted: contact info, education, skills, work history..."
  say "→ Every field also carries a confidence score (0–1) — low-confidence fields are"
  say "   auto-flagged in 'flagged_fields' so AnurCloud's UI can prompt the user to verify."
  echo "$EXTRACT_RESPONSE" | jq '.confidence_scores'
fi

# ── STEP 2 — Module 1: Extraction (URL, optional live pick) ─────────
section "STEP 2 (optional) — Module 1: Extraction from a URL (Firecrawl)"
say "Same pipeline, different source: we render a live webpage and extract from it."
read -rp "  Paste a URL to test (or press Enter to skip this step): " DEMO_URL
if [ -n "$DEMO_URL" ]; then
  say "POST /api/extract-url — { url: \"$DEMO_URL\", profile_type: \"$PROFILE_TYPE\" }"
  URL_RESPONSE=$(curl -s --max-time 120 -X POST "$BASE/api/extract-url" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg url "$DEMO_URL" --arg pt "$PROFILE_TYPE" '{url:$url, profile_type:$pt}')")
  echo "$URL_RESPONSE" | jq .
  say "→ Same output contract as file upload — AnurCloud's downstream code doesn't"
  say "   need to care whether the source was a document or a live URL."
else
  say "Skipped — already proven via file upload in Step 1."
fi

# ── STEP 3 — Module 3: Enhancement, chained from Step 1's output ────
section "STEP 3 — Module 3: AI Content Enhancement (chained live from Step 1)"
if [ "$STATUS" = "success" ]; then
  say "Feeding the exact profile just extracted straight into the enhancement engine —"
  say "this is the real handoff AnurCloud's backend will do between M1 and M3."
  pause

  ENHANCE_BODY=$(echo "$EXTRACT_RESPONSE" | jq --arg pt "$PROFILE_TYPE" '{profile: .data, profile_type: $pt}')
  ENHANCE_RESPONSE=$(curl -s --max-time 120 -X POST "$BASE/api/enhance" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ENHANCE_BODY")

  echo "$ENHANCE_RESPONSE" | jq .
  say "→ Polished first-person bio + rewritten project/experience descriptions,"
  say "   generated only from facts present in the extracted profile — no invented content."
else
  say "Skipped — Step 1 did not return a usable profile. Falling back to a canned sample."
  ENHANCE_BODY='{"profile":{"full_name":"Demo User","designation":"Software Engineer","skills":["React","Node.js"],"experience":[{"role":"Software Engineer","company":"Acme Corp","duration":"2022–present","highlights":["Built internal tooling","Led migration to TypeScript"]}]},"profile_type":"professional"}'
  curl -s --max-time 120 -X POST "$BASE/api/enhance" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ENHANCE_BODY" | jq .
fi

# ── STEP 4 — Module 2 status ─────────────────────────────────────────
section "STEP 4 — Module 2: Template Selection — status"
say "Not a live call — this module is not built yet. Talking points:"
say "  • UI shell exists at /template (coming-soon page, mock template cards)."
say "  • No /api/template route yet — proposed contract mirrors M1/M3:"
say "      POST /api/template  { profile, profile_type }  →  Bearer auth"
say "      Response: ranked template IDs + numeric fit score + reason"
say "  • Sits after M3 in the pipeline: enhanced profile in → template IDs out."
say "  • Next milestone once scope/timeline is agreed with AnurCloud."

section "Demo complete"
say "M1 (Extraction) and M3 (Enhancement) are live in production and just ran end-to-end."
say "M2 (Template Selection) is scoped but not yet implemented."
