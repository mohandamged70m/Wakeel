#!/usr/bin/env bash
# Run the WhatsApp Agent locally without Docker.
set -e
cd "$(dirname "$0")/.."

echo "Starting backend..."
(cd backend && npm run start:dev) &
BACKEND_PID=$!

sleep 5

echo "Starting frontend..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop."
wait $BACKEND_PID $FRONTEND_PID