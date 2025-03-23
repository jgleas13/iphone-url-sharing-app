import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const urlId = params.id;
    
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
    
    // Fetch the URL to verify ownership
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !url) {
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(url);
  } catch (error) {
    console.error('Error fetching URL:', error);
    return NextResponse.json(
      { error: 'Failed to fetch URL' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Check if the URL exists and belongs to the user
    const { data: existingUrl, error: fetchError } = await supabase
      .from('urls')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !existingUrl) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }
    
    // Update the URL
    const { error: updateError } = await supabase
      .from('urls')
      .update({
        title: body.title,
        tags: body.tags
      })
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (updateError) {
      console.error('Error updating URL:', updateError);
      return NextResponse.json(
        { error: 'Failed to update URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'URL updated successfully'
    });
  } catch (error) {
    console.error('Error updating URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Check if the URL exists and belongs to the user
    const { data: existingUrl, error: fetchError } = await supabase
      .from('urls')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !existingUrl) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }
    
    // Delete the URL
    const { error: deleteError } = await supabase
      .from('urls')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (deleteError) {
      console.error('Error deleting URL:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'URL deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 