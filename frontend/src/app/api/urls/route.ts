import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract data from the request
    const { url, pageTitle, tags, dateAccessed } = body;
    
    // Prepare data for insertion
    const urlData = {
      url,
      page_title: pageTitle || '',
      tags: tags || [],
      date_accessed: dateAccessed || new Date().toISOString(),
      // In a real app, you would get the user_id from the authenticated session
      user_id: 'default-user-id',
      summary: '', // This would be populated by a background job
    };

    // Insert the URL into the database
    const { data, error } = await supabase
      .from('urls')
      .insert([urlData])
      .select();

    if (error) {
      console.error('Error inserting URL:', error);
      return NextResponse.json(
        { error: 'Failed to save URL' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      message: 'URL saved successfully',
      data: data[0],
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // In a real app, you would get the user_id from the authenticated session
    const userId = 'default-user-id';
    
    // Fetch URLs for the user
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', userId)
      .order('date_accessed', { ascending: false });

    if (error) {
      console.error('Error fetching URLs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch URLs' },
        { status: 500 }
      );
    }

    // Return the URLs
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 