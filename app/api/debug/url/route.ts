import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Get the URL ID from the query parameters
    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('urlId');
    
    if (!urlId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'URL ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Fetch the URL record
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError) {
      console.error('Error fetching URL:', urlError);
      return NextResponse.json(
        { error: 'Not Found', message: 'URL not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Return the URL data
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Unexpected error in url API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 