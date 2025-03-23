import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { createGrokClient, GrokMessage } from '../../../../lib/grok-api';

// Initialize OpenAI client for fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if we should use Grok
const useGrok = process.env.USE_GROK === 'true';

export async function POST(request: NextRequest) {
  console.log(`[DEBUG] Received POST request to /api/urls/retry-processing`);
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
    
    // Check if the URL is in a state that can be retried
    if (urlData.status !== 'pending' && urlData.status !== 'failed') {
      return NextResponse.json(
        { error: 'URL is not in a state that can be retried' },
        { status: 400 }
      );
    }
    
    // Update the URL status to pending
    await supabase
      .from('urls')
      .update({ status: 'pending' })
      .eq('id', urlId);
    
    // Create a processing log
    await createProcessingLog(
      supabase,
      urlId,
      'info',
      'Manual retry of URL processing initiated'
    );
    
    // Start processing in the background
    processUrl(urlId, urlData.url, session.user.id).catch(error => {
      console.error(`Background processing error for URL ${urlId}:`, error);
    });
    
    return NextResponse.json({
      success: true,
      message: 'URL processing restarted',
      url_id: urlId,
    });
  } catch (error: any) {
    console.error('Error retrying URL processing:', error);
    return NextResponse.json(
      { error: 'Failed to retry URL processing' },
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
    await createProcessingLog(supabase, urlId, 'info', 'URL validated successfully');
    
    // Prepare prompt with just the URL
    const prompt = `Please visit this URL and provide a title, a concise summary, and 3-5 relevant tags for the content: ${url}`;
    
    if (useGrok) {
      // Use Grok API
      return await processWithGrok(supabase, urlId, url, prompt);
    } else {
      // Use OpenAI API as fallback
      return await processWithOpenAI(supabase, urlId, url, prompt);
    }
  } catch (error: any) {
    // Ensure the URL is marked as failed even if we haven't already done so
    try {
      await supabase
        .from('urls')
        .update({ 
          status: 'failed',
          title: 'Untitled Page',
          error_details: `Error: ${error.message || 'Unknown error'}` 
        })
        .eq('id', urlId);
      
      await createProcessingLog(
        supabase,
        urlId,
        'error',
        `Processing failed: ${error.message || 'Unknown error'}`,
        JSON.stringify({
          message: error.message,
          stack: error.stack
        }, null, 2)
      );
    } catch (logError) {
      console.error(`[ERROR] Failed to log error for URL ${urlId}:`, logError);
    }
    
    throw error;
  }
}

// Process with Grok API
async function processWithGrok(supabase: any, urlId: string, url: string, prompt: string) {
  try {
    // Create properly typed messages for Grok
    const messages: GrokMessage[] = [
      {
        role: "system" as const,
        content: "You are a helpful assistant that can visit URLs, extract information, and provide concise summaries and relevant tags. Format your response as: Title: [title]\n\nSummary: [summary]\n\nTags: [tag1], [tag2], [tag3]"
      },
      {
        role: "user" as const,
        content: prompt
      }
    ];
    
    const grokRequest = {
      model: process.env.GROK_MODEL || 'grok-1',
      messages,
      temperature: 0.7,
      max_tokens: 500
    };
    
    // Log the Grok request
    await createProcessingLog(
      supabase, 
      urlId, 
      'api_request', 
      'Sending request to Grok for summarization',
      JSON.stringify(grokRequest, null, 2)
    );
    
    // Call Grok API 
    const startTime = Date.now();
    
    // Create a controller for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
      // Initialize Grok client
      const grokClient = createGrokClient();
      
      // Make the API call
      console.log(`[DEBUG] Making Grok API request`);
      const completion = await grokClient.createChatCompletion(grokRequest);
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      
      // Log the Grok response
      await createProcessingLog(
        supabase, 
        urlId, 
        'api_response', 
        `Received response from Grok (${endTime - startTime}ms)`,
        JSON.stringify(completion, null, 2)
      );
      
      // Extract content from the response
      const responseContent = completion.choices[0]?.message?.content || '';
      
      // Parse the response to extract title, summary and tags
      const extractedData = parseResponse(responseContent);
      
      await createProcessingLog(supabase, urlId, 'info', 'Extracted summary and tags from Grok response');
      
      // Update the URL with the title, summary, tags, and status
      await supabase
        .from('urls')
        .update({
          title: extractedData.title || 'Untitled Page',
          summary: extractedData.summary,
          tags: extractedData.tags,
          status: 'summarized',
        })
        .eq('id', urlId);
      
      await createProcessingLog(supabase, urlId, 'end', 'URL processing completed successfully');
      return true;
    } catch (error: any) {
      // Clear the timeout if it's still active
      clearTimeout(timeoutId);
      
      // Handle the error
      const errorMessage = error.message || 'Unknown error';
      
      // Log detailed error information
      await createProcessingLog(
        supabase, 
        urlId, 
        'error', 
        `Grok API error: ${errorMessage}`,
        JSON.stringify({
          message: errorMessage,
          stack: error.stack
        }, null, 2)
      );
      
      // Update the URL status to failed
      await supabase
        .from('urls')
        .update({ 
          status: 'failed',
          title: 'Untitled Page', // Add a default title even when processing fails
          error_details: `API Error: ${errorMessage}`
        })
        .eq('id', urlId);
      
      throw error;
    }
  } catch (error) {
    console.error(`[ERROR] Processing URL ${urlId} with Grok failed:`, error);
    throw error;
  }
}

// Process with OpenAI API
async function processWithOpenAI(supabase: any, urlId: string, url: string, prompt: string) {
  try {
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
    await createProcessingLog(
      supabase, 
      urlId, 
      'api_request', 
      'Sending request to OpenAI for summarization',
      JSON.stringify(openaiRequest, null, 2)
    );
    
    // Call OpenAI API using fetch directly
    const startTime = Date.now();
    
    // Create a controller for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    try {
      // Make the API call with a timeout
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
      
      // Log the OpenAI response
      await createProcessingLog(
        supabase, 
        urlId, 
        'api_response', 
        `Received response from OpenAI (${endTime - startTime}ms)`,
        JSON.stringify(completion, null, 2)
      );
      
      // Extract content from the response
      const responseContent = completion.choices[0]?.message?.content || '';
      
      // Parse the response to extract title, summary and tags
      const extractedData = parseResponse(responseContent);
      
      await createProcessingLog(supabase, urlId, 'info', 'Extracted summary and tags from OpenAI response');
      
      // Update the URL with the title, summary, tags, and status
      await supabase
        .from('urls')
        .update({
          title: extractedData.title || 'Untitled Page',
          summary: extractedData.summary,
          tags: extractedData.tags,
          status: 'summarized',
        })
        .eq('id', urlId);
      
      await createProcessingLog(supabase, urlId, 'end', 'URL processing completed successfully');
      return true;
    } catch (error: any) {
      // Clear the timeout if it's still active
      clearTimeout(timeoutId);
      
      // Handle the error
      const errorMessage = error.message || 'Unknown error';
      
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
      await supabase
        .from('urls')
        .update({ 
          status: 'failed',
          title: 'Untitled Page', // Add a default title even when processing fails
          error_details: `API Error: ${errorMessage}`
        })
        .eq('id', urlId);
      
      throw error;
    }
  } catch (error) {
    console.error(`[ERROR] Processing URL ${urlId} with OpenAI failed:`, error);
    throw error;
  }
}

// Helper function to parse response
function parseResponse(responseContent: string) {
  let title = '';
  let summary = '';
  let tags: string[] = [];
  
  // Extract title
  const titleMatch = responseContent.match(/Title:([\s\S]*?)(?=\n\nSummary:)/);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }
  
  // Extract summary
  const summaryMatch = responseContent.match(/Summary:([\s\S]*?)(?=\n\nTags:)/);
  if (summaryMatch && summaryMatch[1]) {
    summary = summaryMatch[1].trim();
  }
  
  // Extract tags
  const tagsMatch = responseContent.match(/Tags:([\s\S]*?)$/);
  if (tagsMatch && tagsMatch[1]) {
    tags = tagsMatch[1]
      .trim()
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  }
  
  return { title, summary, tags };
}

// Helper function to create a processing log entry
async function createProcessingLog(
  supabase: any,
  urlId: string,
  type: string,
  message: string,
  data: string | null = null
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
        },
      ]);
  } catch (error) {
    console.error(`[ERROR] Failed to create processing log for URL ${urlId}:`, error);
  }
} 