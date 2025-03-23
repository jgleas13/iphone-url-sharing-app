import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Endpoint to fetch processing logs for a specific URL
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the URL ID from the query parameters
    const urlId = request.nextUrl.searchParams.get('urlId');
    
    if (!urlId) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the URL exists and belongs to the user
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('id')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !urlData) {
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
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
        { error: 'Failed to fetch processing logs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      logs: logs || []
    });
  } catch (error: any) {
    console.error('Error in debug logs endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug logs' },
      { status: 500 }
    );
  }
} 