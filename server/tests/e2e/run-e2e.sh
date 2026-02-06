#!/usr/bin/env bash
set -e

echo "Starting E2E tests..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.." || exit 1

echo "Working directory:"
pwd
ls package.json >/dev/null

# -------- WAIT FOR SERVER (NO wait-on) --------
echo "Waiting for server to be ready..."

for i in {1..30}; do
  if curl -s http://localhost:8080/health >/dev/null; then
    echo "Server is up!"
    break
  fi
  echo "Waiting... ($i)"
  sleep 1
done

# Final check
if ! curl -s http://localhost:8080/health >/dev/null; then
  echo "❌ Server did not start in time"
  exit 1
fi

# -------- RUN E2E --------
echo "Running Postman E2E tests..."
npx newman run tests/e2e/postman/LMS-CIT.e2e.collection.json \
  -e tests/e2e/postman/env.ci.json

echo "✅ E2E tests completed successfully"
