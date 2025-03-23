// Script to sync environment variables to Vercel
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Syncing environment variables to Vercel...');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Successfully read .env.local file');
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() === '' || line.startsWith('#')) return;
  
  const match = line.match(/([^=]+)=(.+)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

console.log(`Found ${Object.keys(envVars).length} environment variables in .env.local`);

// Sync Grok-related environment variables to Vercel
const grokVars = ['GROK_API_KEY', 'GROK_MODEL', 'USE_GROK'];

grokVars.forEach(key => {
  if (envVars[key]) {
    try {
      console.log(`Setting ${key} in Vercel...`);
      
      // Execute vercel env add command
      const value = envVars[key];
      
      // Create a temporary file to hold the value to avoid shell escaping issues
      const tempFilePath = path.join(process.cwd(), 'temp-env-value.txt');
      fs.writeFileSync(tempFilePath, value);
      
      // Add the environment variable to Vercel
      execSync(`vercel env add ${key} < temp-env-value.txt --yes`, { stdio: 'inherit' });
      
      // Remove the temporary file
      fs.unlinkSync(tempFilePath);
      
      console.log(`✅ Successfully set ${key} in Vercel`);
    } catch (error) {
      console.error(`Error setting ${key} in Vercel:`, error.message);
    }
  } else {
    console.log(`⚠️ ${key} not found in .env.local`);
  }
});

console.log('\nEnvironment variables synced to Vercel! 🚀');
console.log('Remember to redeploy your project for the changes to take effect.'); 