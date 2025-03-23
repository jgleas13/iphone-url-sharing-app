import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createGrokClient, GrokMessage } from '../../../../lib/grok-api';

/**
 * Debug endpoint for retrying URL processing with verbose logging
 */
export async function POST(request: NextRequest) {
  console.log(`[DEBUG-RETRY] Starting debug retry process`);
  
  try {
    // Parse the request body
    const body = await request.json();
    const { urlId } = body;
    
    if (!urlId) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if the URL exists and belongs to the user
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !urlData) {
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
      );
    }
    
    // Update the URL status to pending
    await supabase
      .from('urls')
      .update({ status: 'pending' })
      .eq('id', urlId);
    
    // Log environment variables (without sensitive values)
    const envDetails = {
      USE_GROK: process.env.USE_GROK,
      GROK_MODEL: process.env.GROK_MODEL,
      GROK_API_KEY_EXISTS: !!process.env.GROK_API_KEY,
      API_URL: process.env.GROK_API_KEY ? 'https://api.xai.com/v1' : null
    };
    
    console.log(`[DEBUG-RETRY] Environment details:`, envDetails);
    
    // Log that we're creating the Grok client
    console.log(`[DEBUG-RETRY] Creating Grok client`);
    
    try {
      // Initialize Grok client
      const grokClient = createGrokClient();
      
      // Prepare messages
      const messages: GrokMessage[] = [
        {
          role: "system",
          content: "You are a helpful assistant that provides concise summaries of web content. Please format your response as: Title: [title]\n\nSummary: [summary]\n\nTags: [tag1], [tag2], [tag3]"
        },
        {
          role: "user",
          content: `Please visit this URL and provide a title, a concise summary, and 3-5 relevant tags for the content: ${urlData.url}`
        }
      ];
      
      // Log that we're making the API request
      console.log(`[DEBUG-RETRY] Preparing API request with URL: ${urlData.url.substring(0, 30)}...`);
      
      // Make the request
      const grokRequest = {
        model: process.env.GROK_MODEL || 'grok-3',
        messages,
        temperature: 0.7,
        max_tokens: 500
      };
      
      // Send request to Grok API
      console.log(`[DEBUG-RETRY] Sending request to Grok API`);
      const completion = await grokClient.createChatCompletion(grokRequest);
      
      // Log the complete response for debugging
      console.log(`[DEBUG-RETRY] Received full response from Grok API:`, JSON.stringify(completion));
      
      // Handle API response - check if we need to fall back to a mock response
      let responseContent = '';
      let completionToReturn = completion;
      
      // Check if the API response has a valid structure
      if (!completion || !completion.choices || completion.choices.length === 0 || 
          !completion.choices[0] || !completion.choices[0].message || !completion.choices[0].message.content) {
        console.log(`[DEBUG-RETRY] Invalid API response structure, using fallback content`);
        
        // Create a fallback/mock response
        responseContent = `Title: ${urlData.title || 'Untitled Page'}\n\nSummary: This is a fallback summary created because the API didn't return a valid response. The URL might be inaccessible or require authentication.\n\nTags: retry, error, fallback`;
        
        // Create a mock completion object to return
        completionToReturn = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: responseContent
              },
              finish_reason: 'fallback'
            }
          ],
          id: 'fallback-response',
          model: grokRequest.model,
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0
          }
        };
      } else {
        // We have a valid response, extract the content
        responseContent = completion.choices[0].message.content || '';
      }
      
      // Update URL with response (simplified for debugging)
      await supabase
        .from('urls')
        .update({
          title: 'Debug Response Received',
          summary: responseContent.substring(0, 200),
          status: 'summarized',
          // Add debug information with the complete response
          debug_info: {
            api_request: JSON.stringify(grokRequest, null, 2),
            api_response: JSON.stringify(completionToReturn, null, 2),
            processing_steps: [
              `Started debug retry at ${new Date().toISOString()}`,
              `Created Grok client with model ${grokRequest.model}`,
              `Sent request to Grok API`,
              `Received ${completionToReturn.id === 'fallback-response' ? 'fallback' : 'valid'} response`
            ],
            processing_time: Date.now(), // Just store the timestamp
            raw_response: JSON.stringify(completion) // Include the raw response for debugging
          }
        })
        .eq('id', urlId);
      
      // Return success
      return NextResponse.json({
        success: true,
        message: 'Debug retry completed successfully',
        response: completionToReturn
      });
    } catch (error: any) {
      console.error(`[DEBUG-RETRY] Error during Grok API call:`, error);
      
      // Update URL to failed state
      await supabase
        .from('urls')
        .update({
          status: 'failed',
          error_details: `Debug Retry Error: ${error.message || 'Unknown error'}`
        })
        .eq('id', urlId);
      
      // Return detailed error
      return NextResponse.json({
        success: false,
        error: error.message,
        stack: error.stack,
        url_id: urlId
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[DEBUG-RETRY] General error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute debug retry',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 