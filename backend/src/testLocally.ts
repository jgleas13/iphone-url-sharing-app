import { randomBytes } from 'crypto';

// Mock function to generate an API key
function generateMockApiKey(userId: string): string {
  // Generate a random key with prefix
  return `ipus_${randomBytes(16).toString('hex')}`;
}

// Set a test user ID
const userId = 'test_user_123';

async function generateTestApiKey(): Promise<void> {
  try {
    console.log(`\nGenerating mock API key for user: ${userId}`);
    const apiKey = generateMockApiKey(userId);
    console.log(`API Key generated: ${apiKey}`);
    
    console.log('\nTo use this key with the iOS shortcut, add the following header:');
    console.log(`Authorization: Bearer ${apiKey}`);
    
    console.log('\nTo test this key with curl:');
    console.log(`curl -X POST http://localhost:3001/api/v1/urls \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -d '{"url":"https://example.com","pageTitle":"Example","dateAccessed":"2023-08-08T00:00:00Z"}'`);
    
    // Modify your test instructions here
    console.log('\nWhen testing locally:');
    console.log('1. Start the backend with: npm run dev');
    console.log('2. In the iOS shortcut, use this API key in the Authorization header');
    console.log('3. Test submitting a URL to make sure it works with your API key');
  } catch (error) {
    console.error('Error generating API key:', error);
  }
}

generateTestApiKey(); 