import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[API] DELETE /api/urls/${params.id} - Processing request`);
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('[API] Session check:', session ? 'Authenticated' : 'Not authenticated');
    
    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the URL ID from the route params
    const urlId = params.id;
    
    if (!urlId) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Deleting URL with ID: ${urlId} for user: ${session.user.id}`);
    
    // First, verify that the URL belongs to the authenticated user
    const { data: urlData, error: fetchError } = await supabase
      .from('urls')
      .select('id, user_id')
      .eq('id', urlId)
      .single();
    
    if (fetchError) {
      console.error('[API] Error fetching URL:', fetchError);
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }
    
    // Check if the URL belongs to the authenticated user
    if (urlData.user_id !== session.user.id) {
      console.error('[API] Unauthorized deletion attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the URL
    const { error: deleteError } = await supabase
      .from('urls')
      .delete()
      .eq('id', urlId);
    
    if (deleteError) {
      console.error('[API] Error deleting URL:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete URL' },
        { status: 500 }
      );
    }
    
    // Return success response
    console.log(`[API] URL with ID: ${urlId} deleted successfully`);
    return NextResponse.json({
      message: 'URL deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 