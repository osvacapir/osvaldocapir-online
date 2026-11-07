#!/usr/bin/env bash
# Deploy portfolio files to Hostinger via TUS (does not wipe sibling dirs).
set -euo pipefail

DOMAIN="${HOSTINGER_DOMAIN:-osvaldocapir.online}"
USERNAME="${HOSTINGER_USERNAME:-u578573205}"
API_BASE="https://developers.hostinger.com"

if [[ -z "${HOSTINGER_API_TOKEN:-}" ]]; then
  echo "HOSTINGER_API_TOKEN is required" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILES=(
  index.html
  .htaccess
  robots.txt
  sitemap.xml
  css/style.css
  js/i18n.js
  js/main.js
  js/translations.js
  project-crm.html
  project-crm-api.html
  project-gestao-universitaria.html
  project-tic-dash.html
  assets/osvaldo-capir.jpg
)

echo "Requesting upload credentials for ${DOMAIN}..."
CREDS="$(curl -sS -X POST "${API_BASE}/api/hosting/v1/files/upload-urls" \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"domain\":\"${DOMAIN}\"}")"

URL="$(printf '%s' "$CREDS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d); if(!j.url){console.error(d); process.exit(1)}; console.log(j.url)})")"
AUTH_KEY="$(printf '%s' "$CREDS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d); console.log(j.auth_key||j.authKey)})")"
REST_AUTH_KEY="$(printf '%s' "$CREDS" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d); console.log(j.rest_auth_key||j.restAuthKey)})")"

upload() {
  local FILE="$1" DEST="$2"
  local SIZE PATCH_URL OFFSET PCODE
  SIZE="$(wc -c < "$FILE" | tr -d ' ')"
  PATCH_URL="${URL}/${DEST}?override=true"

  curl -sS -D /tmp/tus_h.txt -o /tmp/tus_b.txt -X POST "$PATCH_URL" \
    -H "X-Auth: ${AUTH_KEY}" \
    -H "X-Auth-Rest: ${REST_AUTH_KEY}" \
    -H "Tus-Resumable: 1.0.0" \
    -H "Upload-Length: ${SIZE}" >/dev/null

  curl -sS -D /tmp/tus_ph.txt -o /tmp/tus_pb.txt -X PATCH "$PATCH_URL" \
    -H "X-Auth: ${AUTH_KEY}" \
    -H "X-Auth-Rest: ${REST_AUTH_KEY}" \
    -H "Tus-Resumable: 1.0.0" \
    -H "Content-Type: application/offset+octet-stream" \
    -H "Upload-Offset: 0" \
    --data-binary @"$FILE" >/dev/null

  PCODE="$(head -1 /tmp/tus_ph.txt | tr -d '\r')"
  OFFSET="$(tr -d '\r' </tmp/tus_ph.txt | awk -F': ' 'tolower($1)=="upload-offset"{print $2; exit}')"
  if [[ "$PCODE" != *"204"* ]] || [[ "$OFFSET" != "$SIZE" ]]; then
    echo "FAIL ${DEST}: ${PCODE} offset=${OFFSET} expect=${SIZE}" >&2
    cat /tmp/tus_pb.txt >&2 || true
    exit 1
  fi
  echo "OK ${DEST} (${SIZE} bytes)"
}

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing file: $f" >&2
    exit 1
  fi
  upload "$f" "$f"
done

echo "Clearing cache..."
curl -sS -X DELETE \
  "${API_BASE}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/cache/clear" \
  -H "Authorization: Bearer ${HOSTINGER_API_TOKEN}" \
  -H "Accept: application/json" >/dev/null || true

echo "Deploy complete → https://${DOMAIN}/"
