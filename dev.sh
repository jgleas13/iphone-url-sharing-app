#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting iPhone URL Sharing App development server...${NC}"
echo -e "${YELLOW}Make sure you have set up your .env.local file with the required environment variables.${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}Warning: .env.local file not found. Creating from example...${NC}"
  if [ -f .env.local.example ]; then
    cp .env.local.example .env.local
    echo -e "${GREEN}Created .env.local from example. Please update with your actual values.${NC}"
  else
    echo -e "${YELLOW}No .env.local.example found. You'll need to create .env.local manually.${NC}"
  fi
fi

# Start the development server
echo -e "${GREEN}Starting Next.js development server...${NC}"
npm run dev 