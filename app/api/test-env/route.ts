import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get environment variables (redacted for security)
    const envVars = {
      // OpenAI
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 10)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 
        'not set',
      OPENAI_MODEL: process.env.OPENAI_MODEL || 'not set',
      
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 
        'not set',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 
        `${process.env.SUPABASE_SERVICE_KEY.substring(0, 10)}...` : 
        'not set',
      
      // Node environment
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      
      // Server info
      SERVER_TIMESTAMP: new Date().toISOString(),
      DEPLOYMENT_URL: process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'localhost'
    };
    
    return NextResponse.json({
      success: true,
      environment: envVars
    });
  } catch (error: any) {
    console.error('Error checking environment:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 