import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const urlId = params.id;
    
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
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('id, status, title, created_at, updated_at')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !url) {
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get the most recent log entry for the URL
    const { data: latestLog, error: logError } = await supabase
      .from('url_processing_logs')
      .select('type, message, created_at')
      .eq('url_id', urlId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Return the URL status and latest log
    return NextResponse.json({
      id: url.id,
      status: url.status,
      title: url.title,
      updated_at: url.updated_at,
      latestActivity: latestLog ? {
        type: latestLog.type,
        message: latestLog.message,
        timestamp: latestLog.created_at
      } : null
    });
  } catch (error: any) {
    console.error('Error fetching URL status:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 