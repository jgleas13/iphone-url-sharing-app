// A simple script to check environment variables
const fs = require('fs');
const path = require('path');

console.log('Checking environment variables...');

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

// Check if GROK_API_KEY is set
if (envContent.includes('GROK_API_KEY=')) {
  console.log('✅ GROK_API_KEY is set');
  
  // Extract the API key
  const match = envContent.match(/GROK_API_KEY=([^\s\n]+)/);
  if (match && match[1]) {
    const apiKey = match[1];
    console.log(`   API Key prefix: ${apiKey.substring(0, 6)}...`);
    console.log(`   API Key length: ${apiKey.length}`);
    
    if (apiKey.startsWith('xai-')) {
      console.log('✅ API Key has correct xAI prefix format');
    } else {
      console.log('⚠️ API Key does not have expected xAI prefix (should start with xai-)');
    }
  }
} else {
  console.log('❌ GROK_API_KEY is not set');
}

// Check if GROK_MODEL is set
if (envContent.includes('GROK_MODEL=')) {
  console.log('✅ GROK_MODEL is set');
  
  // Extract the model name
  const match = envContent.match(/GROK_MODEL=([^\s\n]+)/);
  if (match && match[1]) {
    const model = match[1];
    console.log(`   Model: ${model}`);
  }
} else {
  console.log('❌ GROK_MODEL is not set');
}

// Check if USE_GROK is set
if (envContent.includes('USE_GROK=')) {
  console.log('✅ USE_GROK is set');
  
  // Extract the USE_GROK value
  const match = envContent.match(/USE_GROK=([^\s\n]+)/);
  if (match && match[1]) {
    const useGrok = match[1];
    console.log(`   Value: ${useGrok}`);
    
    if (useGrok === 'true') {
      console.log('✅ USE_GROK is set to true');
    } else {
      console.log('⚠️ USE_GROK is not set to true');
    }
  }
} else {
  console.log('❌ USE_GROK is not set');
}

console.log('\nChecking lib/grok-api.ts file...');

// Read grok-api.ts
const grokApiPath = path.join(process.cwd(), 'lib', 'grok-api.ts');
let grokApiContent = '';

try {
  grokApiContent = fs.readFileSync(grokApiPath, 'utf8');
  console.log('Successfully read grok-api.ts file');
} catch (error) {
  console.error('Error reading grok-api.ts file:', error.message);
  process.exit(1);
}

// Check baseUrl
const baseUrlMatch = grokApiContent.match(/baseUrl: string = '([^']+)'/);
if (baseUrlMatch && baseUrlMatch[1]) {
  const baseUrl = baseUrlMatch[1];
  console.log(`✅ Base URL is set to: ${baseUrl}`);
  
  if (baseUrl === 'https://api.xai.com/v1') {
    console.log('✅ Base URL is correct for xAI Grok API');
  } else {
    console.log('⚠️ Base URL might not be correct for xAI Grok API (should be https://api.xai.com/v1)');
  }
} else {
  console.log('❌ Could not find base URL in grok-api.ts');
}

// Check model default
const modelDefaultMatch = grokApiContent.match(/const model = request\.model \|\| process\.env\.GROK_MODEL \|\| '([^']+)'/);
if (modelDefaultMatch && modelDefaultMatch[1]) {
  const modelDefault = modelDefaultMatch[1];
  console.log(`✅ Default model is set to: ${modelDefault}`);
} else {
  console.log('❌ Could not find default model in grok-api.ts');
}

console.log('\nEnvironment check complete! 🚀'); 