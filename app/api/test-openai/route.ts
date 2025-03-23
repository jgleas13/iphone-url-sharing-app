import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    // Log environment variables (redacted for security)
    const apiKeyFirstChars = process.env.OPENAI_API_KEY?.substring(0, 10) + '...' || 'not set';
    const modelName = process.env.OPENAI_MODEL || 'gpt-4-turbo';
    
    // Create properly typed messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that summarizes web content concisely and extracts relevant tags."
      },
      {
        role: "user",
        content: "Please summarize the following webpage content and extract 3-5 relevant tags. URL: https://example.com\n\nTitle: Example Domain\n\nContent: This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission."
      }
    ];
    
    const openaiRequest = {
      model: modelName,
      messages,
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Log start time
    const startTime = Date.now();
    
    // Call OpenAI API
    console.log('Making OpenAI API request...');
    const completion = await openai.chat.completions.create(openaiRequest);
    
    // Log end time
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Extract response content
    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Return detailed debug information
    return NextResponse.json({
      success: true,
      environment: {
        apiKey: apiKeyFirstChars,
        model: modelName,
        nodeEnv: process.env.NODE_ENV
      },
      request: {
        model: openaiRequest.model,
        temperature: openaiRequest.temperature,
        max_tokens: openaiRequest.max_tokens,
        messages: openaiRequest.messages
      },
      response: {
        id: completion.id,
        model: completion.model,
        created: completion.created,
        responseTime: `${duration}ms`,
        content: responseContent,
        finish_reason: completion.choices[0]?.finish_reason,
        usage: completion.usage
      }
    });
  } catch (error: any) {
    console.error('Error testing OpenAI:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      environment: {
        apiKey: process.env.OPENAI_API_KEY ? 'Set (redacted)' : 'Not set',
        model: process.env.OPENAI_MODEL || 'Not set',
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
} 