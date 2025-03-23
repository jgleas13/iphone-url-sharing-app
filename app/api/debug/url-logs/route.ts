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
    
    // Verify user has access to the URL
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('user_id')
      .eq('id', urlId)
      .single();
    
    if (urlError) {
      console.error('Error fetching URL:', urlError);
      return NextResponse.json(
        { error: 'Not Found', message: 'URL not found' },
        { status: 404 }
      );
    }
    
    if (urlData.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to access this URL' },
        { status: 403 }
      );
    }
    
    // Fetch processing logs for the URL
    const { data: logs, error: logsError } = await supabase
      .from('processing_logs')
      .select('*')
      .eq('url_id', urlId)
      .order('created_at', { ascending: true });
    
    if (logsError) {
      console.error('Error fetching processing logs:', logsError);
      return NextResponse.json(
        { error: 'Database Error', message: logsError.message },
        { status: 500 }
      );
    }
    
    // Return the logs
    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Unexpected error in url-logs API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 