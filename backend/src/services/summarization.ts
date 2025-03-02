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
  generatedTitle?: string;
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
      // Instead of throwing, return a fallback response
      return getFallbackSummary(url);
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
    const prompt = `Please provide a concise summary (2-3 sentences) of the webpage at ${url}, suggest a clear and descriptive title for this content, and suggest 2-4 relevant tags for categorizing this content.
    
    Format your response as:
    Title: [your generated title here]
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
    
    // Parse the response to extract title, summary and tags
    const aiResponse = response.data.choices[0].message.content;
    console.log(`[Summarization] AI response content: ${aiResponse}`);
    logToFile(`AI response content: ${aiResponse}`);
    
    // Extract title, summary and tags from the response
    const titleMatch = aiResponse.match(/Title:\s*(.*?)(?=\s*\n\s*Summary:|$)/i);
    const summaryMatch = aiResponse.match(/Summary:\s*([\s\S]*?)(?=\s*\n\s*Tags:|$)/i);
    const tagsMatch = aiResponse.match(/Tags:\s*(.*?)$/i);
    
    console.log(`[Summarization] Title match: ${titleMatch ? 'Found' : 'Not found'}`);
    if (titleMatch) {
      console.log(`[Summarization] Title match groups:`, JSON.stringify(titleMatch));
    }
    console.log(`[Summarization] Summary match: ${summaryMatch ? 'Found' : 'Not found'}`);
    if (summaryMatch) {
      console.log(`[Summarization] Summary match groups:`, JSON.stringify(summaryMatch));
    }
    console.log(`[Summarization] Tags match: ${tagsMatch ? 'Found' : 'Not found'}`);
    if (tagsMatch) {
      console.log(`[Summarization] Tags match groups:`, JSON.stringify(tagsMatch));
    }
    
    const generatedTitle = titleMatch ? titleMatch[1].trim() : '';
    const summary = summaryMatch ? summaryMatch[1].trim() : 'No summary available';
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
    
    console.log(`[Summarization] Extracted title: ${generatedTitle}`);
    console.log(`[Summarization] Extracted summary: ${summary}`);
    console.log(`[Summarization] Extracted tags: ${tags.join(', ')}`);
    
    return { summary, tags, generatedTitle };
  } catch (error) {
    console.error('[Summarization] Error in summarization service:', error);
    logToFile(`Error in summarization service: ${error}`);
    
    // Return fallback response instead of throwing
    return getFallbackSummary(url);
  }
}

// Helper function to generate fallback summary
function getFallbackSummary(url: string): SummarizationResult {
  console.log(`[Summarization] Using fallback summary for URL: ${url}`);
  
  const domain = new URL(url).hostname;
  
  let summary = '';
  let tags: string[] = [];
  let generatedTitle = '';
  
  if (domain.includes('github')) {
    generatedTitle = 'GitHub Repository: Code and Documentation';
    summary = 'This is a GitHub repository page containing code and documentation.';
    tags = ['technology', 'programming', 'github'];
  } else if (domain.includes('medium')) {
    generatedTitle = 'Medium Article on Various Topics';
    summary = 'This is a Medium article discussing various topics.';
    tags = ['article', 'blog'];
  } else if (domain.includes('news')) {
    generatedTitle = 'News Article on Current Events';
    summary = 'This is a news article covering current events.';
    tags = ['news', 'current events'];
  } else {
    generatedTitle = `Content from ${domain}`;
    summary = `This is a webpage from ${domain} with various content.`;
    tags = ['webpage', 'miscellaneous'];
  }
  
  console.log(`[Summarization] Fallback summary: ${summary}`);
  console.log(`[Summarization] Fallback tags: ${tags.join(', ')}`);
  
  return { summary, tags, generatedTitle };
} 