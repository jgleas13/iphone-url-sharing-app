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
    
    // Fetch pending and failed URLs for the authenticated user
    const { data: urls, error: urlsError } = await supabase
      .from('urls')
      .select('id, url, status, title, error_details, created_at, updated_at')
      .in('status', ['pending', 'failed'])
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (urlsError) {
      console.error('Error fetching pending URLs:', urlsError);
      return NextResponse.json(
        { error: 'Database Error', message: urlsError.message },
        { status: 500 }
      );
    }
    
    // Return the URLs
    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Unexpected error in pending-urls API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 