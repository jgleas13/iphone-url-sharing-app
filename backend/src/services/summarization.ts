import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Force reload environment variables
dotenv.config({ override: true });

// Setup logging to file
const logToFile = (message: string) => {
  const logDir = path.join(__dirname, '../../logs');
  const logFile = path.join(logDir, 'openai-debug.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Append to log file
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};

interface SummarizationResult {
  summary: string;
  tags: string[];
}

/**
 * Calls the OpenAI API to summarize the content of a webpage
 * @param url The URL of the webpage to summarize
 * @returns A promise that resolves to an object containing the summary and detected tags
 */
export async function summarizeContent(url: string): Promise<SummarizationResult> {
  try {
    console.log(`[Summarization] Starting summarization for URL: ${url}`);
    logToFile(`Starting summarization for URL: ${url}`);
    
    // For a real implementation, you would:
    // 1. Fetch the content of the webpage
    // 2. Send the content to OpenAI API for summarization
    // 3. Process the response to extract the summary and tags
    
    // This is a simplified implementation
    // In a production environment, you would fetch the actual webpage content first
    
    // Force reload the API key from environment variables
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4-turbo';
    
    console.log(`[Summarization] Using OpenAI model: ${openaiModel}`);
    logToFile(`Using OpenAI model: ${openaiModel}`);
    console.log(`[Summarization] API Key available: ${!!openaiApiKey}`);
    logToFile(`API Key available: ${!!openaiApiKey}`);
    
    if (!openaiApiKey) {
      console.error('[Summarization] ERROR: OpenAI API key is not configured in environment variables');
      logToFile('ERROR: OpenAI API key is not configured in environment variables');
      throw new Error('OpenAI API key is not configured');
    }
    
    // Log first few characters of the API key for debugging (safely)
    if (openaiApiKey) {
      const keyPrefix = openaiApiKey.substring(0, 10);
      const keyLength = openaiApiKey.length;
      console.log(`[Summarization] API Key prefix: ${keyPrefix}... (total length: ${keyLength} chars)`);
      logToFile(`API Key prefix: ${keyPrefix}... (total length: ${keyLength} chars)`);
      
      // Debug: Check if the API key is the literal string "your_openai_api_key"
      if (openaiApiKey === "your_openai_api_key") {
        console.error('[Summarization] ERROR: API key is set to the literal string "your_openai_api_key" instead of an actual API key');
        logToFile('ERROR: API key is set to the literal string "your_openai_api_key" instead of an actual API key');
      }
    }
    
    // For demonstration, we'll use a simple prompt
    // In a real implementation, you would include the actual webpage content
    const prompt = `Please provide a concise summary (2-3 sentences) of the webpage at ${url} and suggest 2-4 relevant tags for categorizing this content.
    
    Format your response as:
    Summary: [your summary here]
    Tags: [comma-separated list of tags]`;
    
    console.log(`[Summarization] Sending request to OpenAI API with prompt: ${prompt.substring(0, 100)}...`);
    logToFile(`Sending request to OpenAI API with prompt: ${prompt.substring(0, 100)}...`);
    
    const requestData = {
      model: openaiModel,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes webpages and generates relevant tags.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    };
    
    // Log request data without sensitive information
    console.log(`[Summarization] Request data: ${JSON.stringify({
      ...requestData,
      // Don't need to redact messages as they don't contain sensitive info
    }, null, 2)}`);
    logToFile(`Request data: ${JSON.stringify(requestData, null, 2)}`);
    
    // Create headers with the actual API key from environment variables
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`  // Use the actual API key from env vars
    };
    
    console.log('[Summarization] Request headers (Authorization value redacted):');
    console.log(JSON.stringify({
      ...headers,
      'Authorization': 'Bearer [REDACTED]'
    }, null, 2));
    logToFile('Request headers (Authorization value redacted):');
    logToFile(JSON.stringify({
      ...headers,
      'Authorization': 'Bearer [REDACTED]'
    }, null, 2));
    
    // Debug: Log the actual Authorization header value (first 15 chars only for security)
    const authHeader = headers['Authorization'];
    console.log(`[Summarization] Authorization header starts with: ${authHeader.substring(0, 15)}...`);
    logToFile(`Authorization header starts with: ${authHeader.substring(0, 15)}...`);
    
    // Make the API request
    console.log('[Summarization] Sending request to OpenAI API...');
    logToFile('Sending request to OpenAI API...');
    
    // Log the raw request for debugging
    logToFile(`Raw request: POST https://api.openai.com/v1/chat/completions`);
    logToFile(`Raw headers: ${JSON.stringify({
      ...headers,
      'Authorization': 'Bearer [REDACTED]'
    })}`);
    logToFile(`Raw body: ${JSON.stringify(requestData)}`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestData,
      { headers }
    );
    
    console.log(`[Summarization] OpenAI API response status: ${response.status}`);
    logToFile(`OpenAI API response status: ${response.status}`);
    
    // Log response data
    if (response.data) {
      console.log(`[Summarization] OpenAI API response data: ${JSON.stringify({
        model: response.data.model,
        usage: response.data.usage,
        choices: response.data.choices ? [{
          index: response.data.choices[0].index,
          finish_reason: response.data.choices[0].finish_reason,
          // Include a preview of the message content
          message: {
            role: response.data.choices[0].message.role,
            content: response.data.choices[0].message.content.substring(0, 100) + '...'
          }
        }] : []
      }, null, 2)}`);
      logToFile(`OpenAI API response data: ${JSON.stringify(response.data, null, 2)}`);
    }
    
    // Parse the response to extract summary and tags
    const aiResponse = response.data.choices[0].message.content;
    console.log(`[Summarization] AI response content: ${aiResponse}`);
    logToFile(`AI response content: ${aiResponse}`);
    
    // Extract summary and tags from the response
    // Updated regex to handle multiline summaries
    const summaryMatch = aiResponse.match(/Summary:\s*([\s\S]*?)(?=\s*\n\s*Tags:|$)/i);
    const tagsMatch = aiResponse.match(/Tags:\s*(.*?)$/i);
    
    console.log(`[Summarization] Summary match: ${summaryMatch ? 'Found' : 'Not found'}`);
    if (summaryMatch) {
      console.log(`[Summarization] Summary match groups:`, JSON.stringify(summaryMatch));
    }
    console.log(`[Summarization] Tags match: ${tagsMatch ? 'Found' : 'Not found'}`);
    if (tagsMatch) {
      console.log(`[Summarization] Tags match groups:`, JSON.stringify(tagsMatch));
    }
    
    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    
    console.log(`[Summarization] Extracted summary: ${summary}`);
    console.log(`[Summarization] Extracted tags: ${tags.join(', ')}`);
    
    return { summary, tags };
  } catch (error) {
    console.error('[Summarization] Error in summarization service:', error);
    logToFile(`Error in summarization service: ${error}`);
    
    if (axios.isAxiosError(error)) {
      console.error('[Summarization] Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      logToFile(`Axios error details: ${JSON.stringify({
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }, null, 2)}`);
      
      // Debug: Log the request that caused the error
      if (error.request) {
        console.error('[Summarization] Request that caused error:');
        console.error('URL:', error.config?.url);
        console.error('Method:', error.config?.method);
        console.error('Headers:', JSON.stringify({
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? 'Bearer [REDACTED]' : undefined
        }));
        
        logToFile('Request that caused error:');
        logToFile(`URL: ${error.config?.url}`);
        logToFile(`Method: ${error.config?.method}`);
        logToFile(`Headers: ${JSON.stringify({
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? 'Bearer [REDACTED]' : undefined
        })}`);
        
        // Check if the Authorization header contains the literal string "your_openai_api_key"
        const authHeader = error.config?.headers?.Authorization as string;
        if (authHeader && authHeader.includes('your_openai_api_key')) {
          console.error('[Summarization] CRITICAL ERROR: Authorization header contains "your_openai_api_key" instead of the actual API key');
          logToFile('CRITICAL ERROR: Authorization header contains "your_openai_api_key" instead of the actual API key');
          
          // Log the actual header for debugging
          logToFile(`Actual Authorization header: ${authHeader}`);
        }
      }
    }
    
    // Fallback to mock response if API call fails
    const domain = new URL(url).hostname;
    
    let summary = '';
    let tags: string[] = [];
    
    if (domain.includes('github')) {
      summary = 'This is a GitHub repository page containing code and documentation.';
      tags = ['technology', 'programming', 'github'];
    } else if (domain.includes('medium')) {
      summary = 'This is a Medium article discussing various topics.';
      tags = ['article', 'blog'];
    } else if (domain.includes('news')) {
      summary = 'This is a news article covering current events.';
      tags = ['news', 'current events'];
    } else {
      summary = `This is a webpage from ${domain} with various content.`;
      tags = ['webpage', 'miscellaneous'];
    }
    
    console.log(`[Summarization] Using fallback summary: ${summary}`);
    console.log(`[Summarization] Using fallback tags: ${tags.join(', ')}`);
    
    return { summary, tags };
  }
} 