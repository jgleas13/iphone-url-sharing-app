import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] POST /api/urls - Processing request');
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Parse the request body
    const body = await request.json();
    
    // Extract data from the request
    const { url, pageTitle, tags, dateAccessed } = body;
    
    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
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
    
    // Call the backend API for summarization
    console.log('[API] Calling backend for summarization:', url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    try {
      const response = await axios.post(`${backendUrl}/api/v1/urls`, {
        url,
        pageTitle: pageTitle || '',
        tags: tags || [],
        dateAccessed: dateAccessed || new Date().toISOString()
      });
      
      // Debug: Log the full response structure
      console.log('[API] Backend response structure:', JSON.stringify(response.data, null, 2));
      
      // Extract summary from response - handle different possible structures
      let summary = '';
      if (response.data && typeof response.data === 'object') {
        // Check if summary is directly in response.data
        if ('summary' in response.data && response.data.summary) {
          summary = response.data.summary;
          console.log('[API] Found summary directly in response.data:', summary);
        } 
        // Check if it's nested in a data property
        else if (response.data.data && 'summary' in response.data.data) {
          summary = response.data.data.summary;
          console.log('[API] Found summary in response.data.data:', summary);
        }
        // Check if it's in the first item of an array
        else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].summary) {
          summary = response.data[0].summary;
          console.log('[API] Found summary in first item of response array:', summary);
        }
      }
      
      // Ensure summary is a string and not empty
      summary = typeof summary === 'string' ? summary.trim() : '';
      if (!summary) {
        console.log('[API] No valid summary found in response, using default');
        summary = 'No summary available';
      }
      console.log('[API] Final summary to be saved:', summary);
      
      // Prepare data for insertion with the summary from backend
      const urlData = {
        url,
        page_title: pageTitle || '',
        tags: response.data.tags || tags || [],
        date_accessed: dateAccessed || new Date().toISOString(),
        user_id: session.user.id,
        summary: summary
      };
      
      console.log('[API] Inserting URL with summary for user:', session.user.id);
      console.log('[API] URL data being inserted:', JSON.stringify(urlData, null, 2));
      
      // Insert the URL into the database
      const { data, error } = await supabase
        .from('urls')
        .insert([urlData])
        .select();

      if (error) {
        console.error('[API] Error inserting URL:', error);
        return NextResponse.json(
          { error: 'Failed to save URL' },
          { status: 500 }
        );
      }

      // Verify the saved data
      console.log('[API] URL saved successfully with summary. Saved data:', JSON.stringify(data, null, 2));
      return NextResponse.json({
        message: 'URL saved successfully',
        data: data[0],
      });
    } catch (backendError) {
      console.error('[API] Backend summarization failed:', backendError);
      
      // If backend fails, still save the URL but without summary
      const urlData = {
        url,
        page_title: pageTitle || '',
        tags: tags || [],
        date_accessed: dateAccessed || new Date().toISOString(),
        user_id: session.user.id,
        summary: 'Summary unavailable'
      };

      console.log('[API] Inserting URL without summary for user:', session.user.id);
      
      // Insert the URL into the database
      const { data, error } = await supabase
        .from('urls')
        .insert([urlData])
        .select();

      if (error) {
        console.error('[API] Error inserting URL:', error);
        return NextResponse.json(
          { error: 'Failed to save URL' },
          { status: 500 }
        );
      }

      // Return success response but indicate summarization failed
      console.log('[API] URL saved successfully without summary');
      return NextResponse.json({
        message: 'URL saved but summarization failed',
        data: data[0],
      });
    }
  } catch (error) {
    console.error('[API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('[API] GET /api/urls - Processing request');
    
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
    
    console.log('[API] Fetching URLs for user:', session.user.id);
    
    // Fetch URLs for the authenticated user
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date_accessed', { ascending: false });

    if (error) {
      console.error('[API] Error fetching URLs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch URLs' },
        { status: 500 }
      );
    }

    // Return the URLs
    console.log('[API] Fetched', data?.length || 0, 'URLs');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 