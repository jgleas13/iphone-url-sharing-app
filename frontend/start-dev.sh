#!/bin/bash

# Find and kill any process using port 3000
PORT_PROCESS=$(lsof -i :3000 -t)
if [ -n "$PORT_PROCESS" ]; then
  echo "Killing process using port 3000: $PORT_PROCESS"
  kill $PORT_PROCESS
  # Give it a moment to release the port
  sleep 1
fi

# Start Next.js on port 3000
PORT=3000 npm run dev 