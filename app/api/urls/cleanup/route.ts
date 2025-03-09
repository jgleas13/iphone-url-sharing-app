import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Maximum time a URL should be in pending status (in minutes)
const MAX_PENDING_TIME_MINUTES = 10;

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
    
    // Calculate the cutoff time (10 minutes ago)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - MAX_PENDING_TIME_MINUTES);
    const cutoffTimeIso = cutoffTime.toISOString();
    
    // Find URLs that have been in pending status for too long
    const { data: stuckUrls, error: fetchError } = await supabase
      .from('urls')
      .select('id, url, created_at')
      .eq('status', 'pending')
      .lt('created_at', cutoffTimeIso);
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch stuck URLs', details: fetchError },
        { status: 500 }
      );
    }
    
    if (!stuckUrls || stuckUrls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stuck URLs found',
        count: 0
      });
    }
    
    // Update the status of stuck URLs to 'failed'
    const updatePromises = stuckUrls.map(async (url) => {
      // Create a log entry
      await supabase
        .from('url_processing_logs')
        .insert([
          {
            url_id: url.id,
            type: 'error',
            message: `URL processing timed out after ${MAX_PENDING_TIME_MINUTES} minutes`,
            created_at: new Date().toISOString(),
          },
        ]);
      
      // Update the URL status
      return supabase
        .from('urls')
        .update({ 
          status: 'failed',
          error_details: `Processing timed out after ${MAX_PENDING_TIME_MINUTES} minutes`
        })
        .eq('id', url.id);
    });
    
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${stuckUrls.length} stuck URLs to failed status`,
      count: stuckUrls.length,
      urls: stuckUrls
    });
  } catch (error) {
    console.error('Error cleaning up stuck URLs:', error);
    return NextResponse.json(
      { error: 'Failed to clean up stuck URLs' },
      { status: 500 }
    );
  }
} 