import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log(`[DEBUG] Received POST request to /api/receive-simple`);
  try {
    // Parse the request body
    const body = await request.json();
    const { url, apiKey, title, tags } = body;
    console.log(`[DEBUG] Request body: URL=${url}, API Key=${apiKey ? apiKey.substring(0, 5) + '...' : 'not provided'}`);

    if (!url || !apiKey) {
      console.log(`[DEBUG] Missing URL or API key`);
      return NextResponse.json(
        { error: 'URL and API key are required' },
        { status: 400 }
      );
    }

    // Create a Supabase client
    console.log(`[DEBUG] Creating Supabase client`);
    const supabase = createRouteHandlerClient({ cookies });

    // Find the user associated with the API key
    console.log(`[DEBUG] Looking up API key in database`);
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.log(`[DEBUG] Invalid API key: ${apiKeyError?.message || 'No data found'}`);
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const userId = apiKeyData.user_id;
    console.log(`[DEBUG] Found user ID: ${userId}`);

    // Process tags if provided
    let parsedTags = null;
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }
    }

    // Create a new URL entry with manual status
    console.log(`[DEBUG] Creating new URL entry with manual status`);
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .insert([
        {
          user_id: userId,
          url: url,
          title: title || 'Untitled Page',
          tags: parsedTags,
          status: 'manual', // This URL was added manually
        },
      ])
      .select()
      .single();

    if (urlError) {
      console.log(`[DEBUG] Failed to save URL: ${urlError.message}`);
      return NextResponse.json(
        { error: 'Failed to save URL' },
        { status: 500 }
      );
    }

    // Create a log entry
    try {
      await supabase
        .from('url_processing_logs')
        .insert([
          {
            url_id: urlData.id,
            type: 'info',
            message: 'URL added manually via simple API',
          },
        ]);
    } catch (logError) {
      console.error(`[ERROR] Failed to create log entry:`, logError);
      // Continue execution even if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'URL saved successfully',
      url_id: urlData.id,
    });
  } catch (error: any) {
    console.error('Error processing URL:', error);
    console.log(`[DEBUG] Caught error in POST handler: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to process URL' },
      { status: 500 }
    );
  }
} 