#!/bin/bash

# Function to kill processes on specific ports
kill_process_on_port() {
  local port=$1
  local process_id=$(lsof -i :$port -t)
  
  if [ -n "$process_id" ]; then
    echo "Killing process on port $port: $process_id"
    kill $process_id
    sleep 1
  else
    echo "No process running on port $port"
  fi
}

# Clear terminal
clear
echo "=== Starting iPhone URL Sharing Development Environment ==="
echo

# Kill any existing processes on ports 3000 and 3001
echo "Cleaning up existing processes..."
kill_process_on_port 3000
kill_process_on_port 3001
echo

# Start backend server
echo "Starting backend server on port 3001..."
cd backend
npm run dev &
backend_pid=$!
cd ..
echo "Backend started with PID: $backend_pid"
echo

# Wait for backend to initialize
echo "Waiting for backend to initialize..."
sleep 3
echo

# Start frontend server
echo "Starting frontend server on port 3000..."
cd frontend
PORT=3000 npm run dev &
frontend_pid=$!
cd ..
echo "Frontend started with PID: $frontend_pid"
echo

echo "=== Development environment is now running ==="
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo
echo "Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo 'Shutting down services...'; kill $backend_pid $frontend_pid; echo 'Services stopped.'; exit 0" INT
wait 