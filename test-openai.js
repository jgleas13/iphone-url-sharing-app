// Simple script to test the OpenAI API key
require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('Testing OpenAI API key...');
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Log the API key (first few characters only)
    const apiKeyFirstChars = process.env.OPENAI_API_KEY 
      ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}`
      : 'not set';
    
    console.log(`API Key: ${apiKeyFirstChars}`);
    console.log(`Model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo'}`);
    
    // Make a simple API call
    console.log('Making a simple API call to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ],
      max_tokens: 10
    });
    
    console.log(`API call successful!`);
    console.log(`Response: ${completion.choices[0]?.message?.content}`);
    
    return {
      success: true,
      apiKey: apiKeyFirstChars,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      response: completion.choices[0]?.message?.content
    };
  } catch (error) {
    console.error('Error testing OpenAI API key:', error);
    
    return {
      success: false,
      error: error.message,
      apiKey: process.env.OPENAI_API_KEY ? 'set but may be invalid' : 'not set',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo'
    };
  }
}

// Run the test
testOpenAI()
  .then(result => {
    console.log('\nTest result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 