#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

cleanup() {
  echo ""
  echo "Stopping services..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "${BACKEND_PID}" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "${FRONTEND_PID}" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH."
  exit 1
fi

echo "Starting backend (npm run dev) ..."
(cd "${BACKEND_DIR}" && npm run dev | sed 's/^/[backend] /') &
BACKEND_PID=$!

echo "Starting frontend (npm run dev) ..."
(cd "${FRONTEND_DIR}" && npm run dev | sed 's/^/[frontend] /') &
FRONTEND_PID=$!

echo "Both services are running. Press Ctrl+C to stop."

set +e
wait -n
EXIT_CODE=$?
echo "One of the services exited with status ${EXIT_CODE}."
wait || true
exit "${EXIT_CODE}"

