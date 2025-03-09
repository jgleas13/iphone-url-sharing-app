import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    await supabase.auth.exchangeCodeForSession(code);
    
    // Check if the user has an API key, if not, create one
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      // Check if the user has an API key
      const { data: apiKeyData } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // If no API key exists, create one
      if (!apiKeyData) {
        // Generate a random API key
        const key = Array.from(
          { length: 32 },
          () => Math.floor(Math.random() * 36).toString(36)
        ).join('');
        
        // Store the API key in the database
        await supabase
          .from('api_keys')
          .insert([
            { user_id: user.id, key }
          ]);
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}${returnUrl}`);
} 