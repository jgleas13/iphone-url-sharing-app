const { generateApiKey } = require('./models/apiKey');

// Set a test user ID
const userId = 'test_user_123';

async function generateTestApiKey() {
  try {
    console.log(`Generating API key for user: ${userId}`);
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