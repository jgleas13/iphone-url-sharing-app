#!/bin/bash

echo "=== Starting iPhone URL Sharing Development Environment ==="

# Clean up existing processes
echo "Cleaning up existing processes..."
FRONTEND_PID=$(lsof -ti:3000)
if [ -n "$FRONTEND_PID" ]; then
  echo "Killing process on port 3000: $FRONTEND_PID"
  kill -9 $FRONTEND_PID
else
  echo "No process running on port 3000"
fi

BACKEND_PID=$(lsof -ti:3001)
if [ -n "$BACKEND_PID" ]; then
  echo "Killing process on port 3001: $BACKEND_PID"
  kill -9 $BACKEND_PID
else
  echo "No process running on port 3001"
fi

# Start backend
echo "Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to initialize
echo "Waiting for backend to initialize..."
sleep 3

# Start frontend
echo "Starting frontend server on port 3000..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo "=== Development environment is now running ==="
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 