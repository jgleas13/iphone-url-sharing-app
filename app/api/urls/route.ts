import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // Build the query
    let query = supabase
      .from('urls')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (status && ['pending', 'summarized', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%,summary.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching URLs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch URLs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in URLs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    // Parse the request body
    const body = await request.json();
    const { url, title } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Insert the URL into the database
    const { data, error } = await supabase
      .from('urls')
      .insert([
        {
          url,
          title: title || url,
          user_id: session.user.id,
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting URL:', error);
      return NextResponse.json(
        { error: 'Failed to save URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'URL added successfully',
      id: data.id
    });
  } catch (error) {
    console.error('Error adding URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 