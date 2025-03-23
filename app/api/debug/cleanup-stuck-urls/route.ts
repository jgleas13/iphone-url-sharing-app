import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function createLog(supabase: any, urlId: string, type: string, message: string, data?: any) {
  try {
    const { error } = await supabase
      .from('processing_logs')
      .insert({
        url_id: urlId,
        type,
        message,
        data: data ? JSON.stringify(data) : null
      });
    
    if (error) {
      console.error(`Error creating log (${type}):`, error);
    }
  } catch (error) {
    console.error('Error in createLog:', error);
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { urlIds, action = 'mark_failed' } = await request.json();
    
    if (!urlIds || !Array.isArray(urlIds) || urlIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'URL IDs array is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to clean up URLs' },
        { status: 401 }
      );
    }
    
    // Log start of cleanup operation
    console.log(`Starting cleanup of ${urlIds.length} URLs with action: ${action}`);
    
    // For security, verify all URLs belong to the user
    const { data: userUrls, error: userUrlsError } = await supabase
      .from('urls')
      .select('id')
      .in('id', urlIds)
      .eq('user_id', session.user.id);
    
    if (userUrlsError) {
      console.error('Error verifying URL ownership:', userUrlsError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify URL ownership' },
        { status: 500 }
      );
    }
    
    // Only process URLs that belong to the user
    const validUrlIds = userUrls?.map(url => url.id) || [];
    
    if (validUrlIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid URLs found to process' },
        { status: 404 }
      );
    }
    
    // Process the URLs based on the action
    let result;
    
    if (action === 'mark_failed') {
      // Update URLs to 'failed' status
      const updateData = {
        status: 'failed',
        error_details: 'Marked as failed by diagnostic tool: URL processing was stuck in pending state'
      };
      
      for (const urlId of validUrlIds) {
        await createLog(
          supabase,
          urlId,
          'info',
          'URL marked as failed by diagnostic tool',
          { reason: 'Stuck in pending state' }
        );
      }
      
      const { error: updateError } = await supabase
        .from('urls')
        .update(updateData)
        .in('id', validUrlIds)
        .eq('status', 'pending');
      
      if (updateError) {
        console.error('Error updating URLs to failed status:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update URLs status' },
          { status: 500 }
        );
      }
      
      result = {
        success: true,
        message: 'Successfully cleaned up stuck URLs',
        fixed: validUrlIds.length,
        action: 'marked_as_failed'
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action specified' },
        { status: 400 }
      );
    }
    
    // Return the result
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Unexpected error in cleanup-stuck-urls API:', error);
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 