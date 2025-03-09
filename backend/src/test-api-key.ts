import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import after environment variables are loaded
import { generateApiKey } from './models/apiKey';

// Set a test user ID
const userId = 'test_user_123';

async function generateTestApiKey(): Promise<void> {
  try {
    // Verify environment variables
    console.log('Checking environment variables:');
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? 'Set' : 'Not set'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Required environment variables are missing. Please check your .env file.');
      return;
    }
    
    console.log(`\nGenerating API key for user: ${userId}`);
    const apiKey = await generateApiKey(userId);
    console.log(`API Key generated: ${apiKey}`);
    console.log('\nTo use this key with the iOS shortcut, add the following header:');
    console.log(`Authorization: Bearer ${apiKey}`);
    
    console.log('\nTo test this key with curl:');
    console.log(`curl -X POST http://localhost:3001/api/v1/urls \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -d '{"url":"https://example.com","pageTitle":"Example","dateAccessed":"2023-08-08T00:00:00Z"}'`);
  } catch (error) {
    console.error('Error generating API key:', error);
  }
}

generateTestApiKey(); 