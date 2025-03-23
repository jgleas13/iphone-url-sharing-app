import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Log environment variable info
    const apiKeyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
    const apiKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 3) + '...' : 'not set';
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo';

    console.log(`[DEBUG-OPENAI] Using API key: ${apiKeyPrefix} (length: ${apiKeyLength})`);
    console.log(`[DEBUG-OPENAI] Using model: ${model}`);

    // Make a simple test call to OpenAI
    const startTime = Date.now();

    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: "Hello, please respond with just the word 'Working' to test the API connection."
      }
    ];

    // Make the API call with a timeout
    console.log(`[DEBUG-OPENAI] Starting API call at ${new Date().toISOString()}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 50
        }),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`[DEBUG-OPENAI] API call completed in ${endTime - startTime}ms`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[DEBUG-OPENAI] API error: ${response.status} ${response.statusText}`, errorData);
        return NextResponse.json(
          { 
            success: false, 
            error: `API error: ${response.status} ${response.statusText}`,
            details: errorData
          },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        time_taken_ms: endTime - startTime,
        response: data,
        environment: {
          model: model,
          apiKeyLength: apiKeyLength,
          node_version: process.version,
          url: request.url
        }
      });
    } catch (error: any) {
      // Clear the timeout if it's still active
      clearTimeout(timeoutId);
      
      console.error(`[DEBUG-OPENAI] Error during API call:`, error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Unknown error',
          details: {
            name: error.name,
            stack: error.stack
          }
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error',
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 