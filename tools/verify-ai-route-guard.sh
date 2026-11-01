#!/usr/bin/env bash
# Executes security_spec.md Payload 18 against the built route handler: a request that is not the
# verified owner must be refused before the provider is named, before the budget is touched, and
# before any diary content is processed. Run `npm run build` first.
#
# It deliberately runs WITHOUT GEMINI_API_KEY set. A 503 "GEMINI_API_KEY is not set" would therefore
# prove the request got past the session check, so the expected 401 is the whole point.
set -euo pipefail

PORT="${PORT:-3111}"
BASE="http://127.0.0.1:${PORT}"
BODY='{"task":"proofread","content":"a line that must never be processed","contextEntryIds":[]}'
PID=""

cleanup() {
  if [ -n "${PID}" ]; then
    # Negative pid = the whole process group: `npx` leaves the real next-server as its child, and
    # killing only the wrapper strands a server that the next run would then talk to by accident.
    kill -- -"${PID}" 2>/dev/null || kill "${PID}" 2>/dev/null || true
    wait "${PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

b64url() {
  base64 -w0 | tr '+/' '-_' | tr -d '='
}

# Refuse to measure somebody else's server: a passing check is only evidence if this script started
# the process that answered.
if curl -s -o /dev/null "${BASE}/"; then
  fail "something already answers on ${BASE} — free the port (PORT=…) so the result belongs to this run"
fi

LOG=/tmp/versevault-route-guard-${PORT}.log
unset GEMINI_API_KEY || true
setsid npx next start -p "${PORT}" > "${LOG}" 2>&1 &
PID=$!

ready=0
for _ in $(seq 1 120); do
  if curl -s -o /dev/null "${BASE}/"; then
    ready=1
    break
  fi
  sleep 0.5
done
[ "${ready}" = "1" ] || fail "next start did not answer on ${BASE}; see ${LOG}"
grep -qi 'ready' "${LOG}" || fail "the server on ${BASE} did not report ready in ${LOG}"

check() {
  label="$1"
  shift
  code=$(curl -s -o /tmp/versevault-guard-body.json -w '%{http_code}' -X POST "${BASE}/api/ai-assist" \
    -H 'content-type: application/json' "$@" -d "${BODY}")
  if [ "${code}" != "401" ]; then
    fail "${label}: expected HTTP 401, got ${code} — body was $(cat /tmp/versevault-guard-body.json)"
  fi
  if ! grep -q '"errorCode":"UNAUTHENTICATED"' /tmp/versevault-guard-body.json; then
    fail "${label}: refused, but not as UNAUTHENTICATED — $(cat /tmp/versevault-guard-body.json)"
  fi
  if grep -qiE 'GEMINI_API_KEY|apiKey|at [A-Za-z0-9_./$-]+:[0-9]+:[0-9]+' /tmp/versevault-guard-body.json; then
    fail "${label}: the refusal response leaked configuration or a stack trace"
  fi
  echo "ok: ${label}"
}

check 'anonymous request'
check 'bearer token that is not a JWT' -H 'authorization: Bearer not.a.real.token'

# An unsigned alg-none JWT carrying the owner's own email and a uid: exactly the shape the rules
# emulator accepts, and exactly what a real ID token verifier must reject.
claims_header='{"alg":"none","typ":"JWT"}'
claims_payload="{\"sub\":\"fake-uid\",\"email\":\"aalmamunsikder@gmail.com\",\"email_verified\":true}"
none_token="$(printf '%s' "${claims_header}" | b64url).$(printf '%s' "${claims_payload}" | b64url)."
check 'unsigned alg-none JWT' -H "authorization: Bearer ${none_token}"

echo 'Payload 18 holds: every unauthenticated shape is refused with 401 before the provider is reached.'
