import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  console.log(`[DEBUG] Received POST request to /api/receive`);
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

    // Create a new URL entry with pending status
    console.log(`[DEBUG] Creating new URL entry with pending status`);
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .insert([
        {
          user_id: userId,
          url: url,
          status: 'pending',
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

    // Create initial processing log
    console.log(`[DEBUG] Creating initial processing log`);
    await createProcessingLog(supabase, urlData.id, 'start', 'URL received for processing');

    // Process the URL in the background
    console.log(`[DEBUG] Starting background processing for URL ID: ${urlData.id}`);
    processUrl(urlData.id, url, userId);
    console.log(`[DEBUG] Background processing initiated`);

    return NextResponse.json({
      success: true,
      message: 'URL received and queued for processing',
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

// Function to process the URL and generate a summary
async function processUrl(urlId: string, url: string, userId: string) {
  console.log(`[DEBUG] Starting to process URL: ${url} (ID: ${urlId})`);
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Log validation step
    console.log(`[DEBUG] URL validated, creating processing log`);
    await createProcessingLog(supabase, urlId, 'info', 'URL validated successfully');
    
    // Prepare OpenAI request with just the URL
    const prompt = `Please visit this URL and provide a title, a concise summary, and 3-5 relevant tags for the content: ${url}`;
    console.log(`[DEBUG] Prepared prompt for OpenAI: ${prompt.substring(0, 100)}...`);
    
    // Create properly typed messages for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful assistant that can visit URLs, extract information, and provide concise summaries and relevant tags. Format your response as: Title: [title]\n\nSummary: [summary]\n\nTags: [tag1], [tag2], [tag3]"
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    const openaiRequest = {
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Log the OpenAI request
    console.log(`[DEBUG] Logging OpenAI request to database`);
    await createProcessingLog(
      supabase, 
      urlId, 
      'api_request', 
      'Sending request to OpenAI for summarization',
      JSON.stringify(openaiRequest, null, 2)
    );
    
    // Call OpenAI API using fetch directly
    const startTime = Date.now();
    console.log(`[DEBUG] Starting OpenAI API call at ${new Date().toISOString()}`);
    console.log(`[DEBUG] Using OpenAI API key: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'not set'}`);
    console.log(`[DEBUG] Using OpenAI model: ${openaiRequest.model}`);
    
    // Create a controller for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      // Make the API call with a timeout
      console.log(`[DEBUG] Making OpenAI API request with timeout`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(openaiRequest),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const completion = await response.json();
      const endTime = Date.now();
      console.log(`[DEBUG] OpenAI API call completed in ${endTime - startTime}ms`);
      
      // Log the OpenAI response
      console.log(`[DEBUG] Logging OpenAI response to database`);
      await createProcessingLog(
        supabase, 
        urlId, 
        'api_response', 
        `Received response from OpenAI (${endTime - startTime}ms)`,
        JSON.stringify(completion, null, 2)
      );
      
      // Extract content from the response
      const responseContent = completion.choices[0]?.message?.content || '';
      console.log(`[DEBUG] Extracted content from OpenAI response: ${responseContent.substring(0, 100)}...`);
      
      // Parse the response to extract title, summary and tags
      let title = '';
      let summary = '';
      let tags: string[] = [];
      
      // Extract title
      const titleMatch = responseContent.match(/Title:([\s\S]*?)(?=\n\nSummary:)/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
        console.log(`[DEBUG] Extracted title: ${title}`);
      } else {
        console.log(`[DEBUG] Failed to extract title from response`);
      }
      
      // Extract summary
      const summaryMatch = responseContent.match(/Summary:([\s\S]*?)(?=\n\nTags:)/);
      if (summaryMatch && summaryMatch[1]) {
        summary = summaryMatch[1].trim();
        console.log(`[DEBUG] Extracted summary: ${summary.substring(0, 50)}...`);
      } else {
        console.log(`[DEBUG] Failed to extract summary from response`);
      }
      
      // Extract tags
      const tagsMatch = responseContent.match(/Tags:([\s\S]*?)$/);
      if (tagsMatch && tagsMatch[1]) {
        tags = tagsMatch[1]
          .trim()
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
        console.log(`[DEBUG] Extracted tags: ${tags.join(', ')}`);
      } else {
        console.log(`[DEBUG] Failed to extract tags from response`);
      }
      
      await createProcessingLog(supabase, urlId, 'info', 'Extracted summary and tags from OpenAI response');
      
      // Update the URL with the title, summary, tags, and status
      console.log(`[DEBUG] Updating URL with extracted content`);
      await supabase
        .from('urls')
        .update({
          title: title || 'Untitled Page',
          summary,
          tags,
          status: 'summarized',
        })
        .eq('id', urlId);
      
      console.log(`[DEBUG] URL processing completed successfully for ${url} (ID: ${urlId})`);
      await createProcessingLog(supabase, urlId, 'end', 'URL processing completed successfully');
    } catch (error: any) {
      // Clear the timeout if it's still active
      clearTimeout(timeoutId);
      
      // Handle the error
      const errorMessage = error.message || 'Unknown error';
      console.log(`[DEBUG] OpenAI API error: ${errorMessage}`);
      
      // Log detailed error information
      await createProcessingLog(
        supabase, 
        urlId, 
        'error', 
        `OpenAI API error: ${errorMessage}`,
        JSON.stringify({
          message: errorMessage,
          stack: error.stack
        }, null, 2)
      );
      
      // Update the URL status to failed
      console.log(`[DEBUG] Updating URL status to failed`);
      await supabase
        .from('urls')
        .update({ 
          status: 'failed',
          error_details: `API Error: ${errorMessage}`
        })
        .eq('id', urlId);
      
      // Re-throw the error to be caught by the outer try/catch
      throw error;
    }
  } catch (error: any) {
    console.error('Error processing URL:', error);
    console.log(`[DEBUG] Caught error in outer try/catch: ${error.message}`);
    
    // Log the error
    await createProcessingLog(
      supabase, 
      urlId, 
      'error', 
      'Failed to process URL',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    
    // Update the URL status to failed
    console.log(`[DEBUG] Updating URL status to failed in outer catch block`);
    await supabase
      .from('urls')
      .update({ 
        status: 'failed',
        error_details: `Processing error: ${error.message}`
      })
      .eq('id', urlId);
  }
}

// Helper function to create processing logs
async function createProcessingLog(
  supabase: any, 
  urlId: string, 
  type: 'start' | 'info' | 'api_request' | 'api_response' | 'error' | 'end', 
  message: string,
  data?: string
) {
  try {
    await supabase
      .from('url_processing_logs')
      .insert([
        {
          url_id: urlId,
          type,
          message,
          data,
          created_at: new Date().toISOString(),
        },
      ]);
  } catch (error) {
    console.error('Error creating processing log:', error);
  }
} 