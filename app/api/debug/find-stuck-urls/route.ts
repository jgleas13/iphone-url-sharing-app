import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Get threshold from query parameters (in minutes)
    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '30', 10);
    
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
    
    // Calculate the cutoff time
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - threshold);
    const cutoffTimeString = cutoffTime.toISOString();
    
    // Find URLs that have been in pending state for longer than the threshold
    const { data: urls, error: urlsError } = await supabase
      .from('urls')
      .select('id, url, status, title, created_at, updated_at')
      .eq('status', 'pending')
      .eq('user_id', session.user.id)
      .lt('updated_at', cutoffTimeString)
      .order('updated_at', { ascending: false });
    
    if (urlsError) {
      console.error('Error finding stuck URLs:', urlsError);
      return NextResponse.json(
        { error: 'Database Error', message: urlsError.message },
        { status: 500 }
      );
    }
    
    // Return the stuck URLs
    return NextResponse.json({
      urls: urls || [],
      count: urls?.length || 0,
      threshold,
      cutoff_time: cutoffTimeString
    });
  } catch (error: any) {
    console.error('Unexpected error in find-stuck-urls API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 