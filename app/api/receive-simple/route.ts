import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log(`[DEBUG] Received POST request to /api/receive-simple`);
  try {
    // Parse the request body
    const body = await request.json();
    const { url, apiKey } = body;
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

    // Create a new URL entry with summarized status (skipping OpenAI processing)
    console.log(`[DEBUG] Creating new URL entry with summarized status`);
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .insert([
        {
          user_id: userId,
          url: url,
          title: 'URL from iOS Shortcut',
          summary: 'This URL was saved without AI processing.',
          tags: ['unprocessed'],
          status: 'summarized',
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

    console.log(`[DEBUG] URL saved successfully: ${urlData.id}`);
    return NextResponse.json({
      success: true,
      message: 'URL saved successfully (without AI processing)',
      url_id: urlData.id,
    });
  } catch (error: any) {
    console.error('Error saving URL:', error);
    console.log(`[DEBUG] Caught error in POST handler: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to save URL' },
      { status: 500 }
    );
  }
} 