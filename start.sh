#!/bin/bash
# Start backend and frontend dev servers concurrently

# Check .env
if [ ! -f backend/.env ]; then
  echo "⚠️  backend/.env not found — copying from .env.example"
  echo "   Set your ANTHROPIC_API_KEY in backend/.env"
  cp backend/.env.example backend/.env
fi

echo "Starting backend on :8000 ..."
cd backend && python3 -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on :5173 ..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

wait $BACKEND_PID $FRONTEND_PID
