#!/bin/bash

# Script to deploy with environment variables

echo "🚀 Starting deployment process..."

# Check environment variables
echo -e "\n📝 Checking environment variables..."
node check-env.js

# Build the project
echo -e "\n🏗️ Building the project..."
npm run build

# Deploy to Vercel
echo -e "\n🚀 Deploying to Vercel..."
vercel --prod

echo -e "\n✅ Deployment complete!"
echo "Your app should now be live with the correct environment variables."
echo "If you're still having issues, check the Vercel logs or run 'node sync-env-to-vercel.js' to ensure environment variables are set." 