import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(request: NextRequest) {
  console.log('[DEBUG] Testing OpenAI API key');
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Log the API key (first few characters only)
    const apiKeyFirstChars = process.env.OPENAI_API_KEY 
      ? `${process.env.OPENAI_API_KEY.substring(0, 5)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}`
      : 'not set';
    
    console.log(`[DEBUG] API Key: ${apiKeyFirstChars}`);
    console.log(`[DEBUG] Model: ${process.env.OPENAI_MODEL || 'gpt-4-turbo'}`);
    
    // Make a simple API call
    console.log('[DEBUG] Making a simple API call to OpenAI');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello!' }
      ],
      max_tokens: 10
    });
    
    console.log(`[DEBUG] API call successful: ${completion.choices[0]?.message?.content}`);
    
    return NextResponse.json({
      success: true,
      apiKey: apiKeyFirstChars,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      response: completion.choices[0]?.message?.content
    });
  } catch (error: any) {
    console.error('[DEBUG] Error testing OpenAI API key:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      apiKey: process.env.OPENAI_API_KEY ? 'set but may be invalid' : 'not set',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo'
    }, { status: 500 });
  }
} 