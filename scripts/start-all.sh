#!/usr/bin/env bash
echo "Starting HistoryByPeople development servers..."
echo "Backend will run on http://localhost:4000"
echo "Frontend will run on http://localhost:5173 (or next available port)"

# Start backend server in background
npm --prefix backend run dev &
BACKEND_PID=$!

# Start frontend server in background  
npm --prefix frontend run dev &
FRONTEND_PID=$!

echo "Servers started. Press Ctrl+C to stop both servers."

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for both processes
wait
