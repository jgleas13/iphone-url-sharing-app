import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this endpoint' },
        { status: 401 }
      );
    }
    
    // Build environment information
    const envInfo = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      useGrok: process.env.USE_GROK === 'true',
      hasGrokApiKey: !!process.env.GROK_API_KEY,
      grokModel: process.env.GROK_MODEL || 'unknown',
      hasOpenAIApiKey: !!process.env.OPENAI_API_KEY,
      vercelEnv: process.env.VERCEL_ENV || 'unknown'
    };
    
    // Return the environment information
    return NextResponse.json(envInfo);
  } catch (error) {
    console.error('Unexpected error in environment API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 