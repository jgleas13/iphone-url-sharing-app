import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Add these imports for URL processing
import OpenAI from 'openai';
import { summaryPrompt, keytakeawaysPrompt, tagsPrompt } from '../../../../lib/prompts';
import { GrokAPI as GrokClient } from '../../../../lib/grok-api';

// Helper function to create a log entry
async function createLog(supabase: any, urlId: string, type: string, message: string, data?: any) {
  const { error } = await supabase
    .from('processing_logs')
    .insert({
      url_id: urlId,
      type,
      message,
      data: data ? JSON.stringify(data) : null
    });
  
  if (error) {
    console.error(`Error creating log (${type}):`, error);
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { urlId } = await request.json();
    
    if (!urlId) {
      return NextResponse.json(
        { success: false, error: 'URL ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to retry processing' },
        { status: 401 }
      );
    }
    
    // Fetch the URL from the database
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError) {
      console.error('Error fetching URL:', urlError);
      return NextResponse.json(
        { success: false, error: 'URL not found or you do not have permission to access it' },
        { status: 404 }
      );
    }
    
    // Log start of processing
    await createLog(supabase, urlId, 'info', 'Starting debug retry processing');
    
    // Update URL status to 'pending'
    const { error: updateError } = await supabase
      .from('urls')
      .update({ status: 'pending', error_details: null })
      .eq('id', urlId);
    
    if (updateError) {
      console.error('Error updating URL status:', updateError);
      await createLog(supabase, urlId, 'error', `Failed to update URL status: ${updateError.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to update URL status' },
        { status: 500 }
      );
    }
    
    // Check environment configuration
    const useGrok = process.env.USE_GROK === 'true';
    await createLog(supabase, urlId, 'info', `Using ${useGrok ? 'Grok' : 'OpenAI'} for summarization`);
    
    // Initialize the appropriate API client
    let apiClient: OpenAI | GrokClient;
    try {
      if (useGrok) {
        if (!process.env.GROK_API_KEY) {
          throw new Error('Missing Grok API key');
        }
        apiClient = new GrokClient({
          apiKey: process.env.GROK_API_KEY,
          model: process.env.GROK_MODEL || 'grok-1'
        });
        await createLog(supabase, urlId, 'info', `Initialized Grok client with model: ${process.env.GROK_MODEL || 'grok-1'}`);
      } else {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('Missing OpenAI API key');
        }
        apiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        await createLog(supabase, urlId, 'info', 'Initialized OpenAI client');
      }
    } catch (error: any) {
      console.error('Error initializing API client:', error);
      await createLog(supabase, urlId, 'error', `Failed to initialize API client: ${error.message}`);
      
      // Update URL with error details
      await supabase
        .from('urls')
        .update({
          status: 'failed',
          error_details: `API client initialization failed: ${error.message}`
        })
        .eq('id', urlId);
      
      return NextResponse.json(
        { success: false, error: `Failed to initialize API client: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Process URL content
    try {
      await createLog(supabase, urlId, 'info', `Fetching content for URL: ${url.url}`);
      
      // For diagnostic purposes, get metadata about the URL first
      let title = url.title || 'Unknown';
      
      if (!url.title) {
        await createLog(supabase, urlId, 'info', 'No title found, trying to fetch from URL');
        try {
          const response = await fetch(url.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; URLSummarizerBot/1.0; +https://urlsummarizer.com)'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
          }
          
          const html = await response.text();
          const titleMatch = html.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
            await createLog(supabase, urlId, 'info', `Extracted title: ${title}`);
          } else {
            await createLog(supabase, urlId, 'info', 'Could not extract title from HTML');
          }
        } catch (error: any) {
          await createLog(supabase, urlId, 'error', `Error fetching URL metadata: ${error.message}`);
        }
      }
      
      // Get the summary using the appropriate API
      await createLog(supabase, urlId, 'info', 'Generating summary, key takeaways, and tags');
      
      // Log the prompt
      const summaryPromptFilled = summaryPrompt.replace("{url}", url.url);
      await createLog(supabase, urlId, 'api_request', 'Sending summary prompt', { prompt: summaryPromptFilled });
      
      let summary: string = '';
      let keyPoints: string[] = [];
      let tags: string[] = [];
      let rawResponse = null;
      let apiResponse = null;
      
      // Process with Grok or OpenAI
      try {
        if (useGrok) {
          // Generate summary with Grok
          const grokClient = apiClient as GrokClient;
          const summaryResponse = await grokClient.completions.create({
            prompt: summaryPromptFilled,
            max_tokens: 1024,
            temperature: 0.7
          });
          
          // Log raw response for debugging
          rawResponse = summaryResponse;
          await createLog(supabase, urlId, 'api_response', 'Received summary response', summaryResponse);
          
          if (summaryResponse.choices && summaryResponse.choices.length > 0) {
            summary = summaryResponse.choices[0].text.trim();
          } else {
            throw new Error('No summary returned from Grok API');
          }
          
          // Generate key takeaways
          const keyPointsPromptFilled = keytakeawaysPrompt.replace("{url}", url.url);
          await createLog(supabase, urlId, 'api_request', 'Sending key takeaways prompt', { prompt: keyPointsPromptFilled });
          
          const keyPointsResponse = await grokClient.completions.create({
            prompt: keyPointsPromptFilled,
            max_tokens: 1024,
            temperature: 0.7
          });
          
          await createLog(supabase, urlId, 'api_response', 'Received key takeaways response', keyPointsResponse);
          
          if (keyPointsResponse.choices && keyPointsResponse.choices.length > 0) {
            const keyPointsText = keyPointsResponse.choices[0].text.trim();
            // Parse key points from response (one per line)
            keyPoints = keyPointsText
              .split('\n')
              .map((point: string) => point.trim())
              .filter((point: string) => point && !point.startsWith('Key Points:') && !point.startsWith('Key Takeaways:'));
          }
          
          // Generate tags
          const tagsPromptFilled = tagsPrompt.replace("{url}", url.url);
          await createLog(supabase, urlId, 'api_request', 'Sending tags prompt', { prompt: tagsPromptFilled });
          
          const tagsResponse = await grokClient.completions.create({
            prompt: tagsPromptFilled,
            max_tokens: 256,
            temperature: 0.7
          });
          
          await createLog(supabase, urlId, 'api_response', 'Received tags response', tagsResponse);
          
          if (tagsResponse.choices && tagsResponse.choices.length > 0) {
            const tagsText = tagsResponse.choices[0].text.trim();
            // Parse tags from response (comma-separated)
            tags = tagsText
              .replace(/tags:/i, '')
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag);
          }
          
          // Save combined API response for debugging
          apiResponse = {
            summary: summary,
            key_points: keyPoints,
            tags: tags
          };
        } else {
          // Process with OpenAI
          const openAiClient = apiClient as OpenAI;
          
          // Generate summary
          const summaryResponse = await openAiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that summarizes web content.' },
              { role: 'user', content: summaryPromptFilled }
            ],
            temperature: 0.7
          });
          
          // Log raw response for debugging
          rawResponse = summaryResponse;
          await createLog(supabase, urlId, 'api_response', 'Received summary response', summaryResponse);
          
          if (summaryResponse.choices && summaryResponse.choices.length > 0) {
            summary = summaryResponse.choices[0].message.content?.trim() || '';
          }
          
          // Generate key takeaways
          const keyPointsPromptFilled = keytakeawaysPrompt.replace("{url}", url.url);
          await createLog(supabase, urlId, 'api_request', 'Sending key takeaways prompt', { prompt: keyPointsPromptFilled });
          
          const keyPointsResponse = await openAiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that extracts key points from web content.' },
              { role: 'user', content: keyPointsPromptFilled }
            ],
            temperature: 0.7
          });
          
          await createLog(supabase, urlId, 'api_response', 'Received key takeaways response', keyPointsResponse);
          
          if (keyPointsResponse.choices && keyPointsResponse.choices.length > 0) {
            const keyPointsText = keyPointsResponse.choices[0].message.content?.trim() || '';
            // Parse key points from response (one per line)
            keyPoints = keyPointsText
              .split('\n')
              .map((point: string) => point.trim())
              .filter((point: string) => point && !point.startsWith('Key Points:') && !point.startsWith('Key Takeaways:'));
          }
          
          // Generate tags
          const tagsPromptFilled = tagsPrompt.replace("{url}", url.url);
          await createLog(supabase, urlId, 'api_request', 'Sending tags prompt', { prompt: tagsPromptFilled });
          
          const tagsResponse = await openAiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful assistant that generates relevant tags for web content.' },
              { role: 'user', content: tagsPromptFilled }
            ],
            temperature: 0.7
          });
          
          await createLog(supabase, urlId, 'api_response', 'Received tags response', tagsResponse);
          
          if (tagsResponse.choices && tagsResponse.choices.length > 0) {
            const tagsText = tagsResponse.choices[0].message.content?.trim() || '';
            // Parse tags from response (comma-separated)
            tags = tagsText
              .replace(/tags:/i, '')
              .split(',')
              .map((tag: string) => tag.trim())
              .filter((tag: string) => tag);
          }
          
          // Save combined API response for debugging
          apiResponse = {
            summary: summary,
            key_points: keyPoints,
            tags: tags
          };
        }
        
        // Log the results
        await createLog(supabase, urlId, 'info', 'Generated summary', { summary });
        await createLog(supabase, urlId, 'info', 'Generated key points', { keyPoints });
        await createLog(supabase, urlId, 'info', 'Generated tags', { tags });
        
        // Save debug info
        const debugInfo = {
          api_request: useGrok ? summaryPromptFilled : { summaryPrompt: summaryPromptFilled },
          api_response: apiResponse,
          raw_response: rawResponse,
          processing_steps: [
            'Initialized API client',
            `Generated summary (${summary.length} chars)`,
            `Generated ${keyPoints.length} key points`,
            `Generated ${tags.length} tags`
          ],
          processing_time: new Date().toISOString()
        };
        
        // Update the URL with the generated content
        const { error: updateError } = await supabase
          .from('urls')
          .update({
            title: title,
            summary: summary,
            key_points: keyPoints,
            tags: tags,
            status: 'summarized',
            debug_info: debugInfo
          })
          .eq('id', urlId);
        
        if (updateError) {
          console.error('Error updating URL with content:', updateError);
          await createLog(supabase, urlId, 'error', `Failed to update URL with content: ${updateError.message}`);
          throw new Error(`Failed to update URL with content: ${updateError.message}`);
        }
        
        await createLog(supabase, urlId, 'info', 'URL processing completed successfully');
        
        return NextResponse.json({
          success: true,
          message: 'URL processing completed successfully',
          details: {
            title,
            summary: summary.substring(0, 100) + '...',
            keyPointsCount: keyPoints.length,
            tagsCount: tags.length
          }
        });
      } catch (error: any) {
        console.error('Error processing URL:', error);
        await createLog(supabase, urlId, 'error', `Error processing URL: ${error.message}`);
        
        // Update URL with error details
        await supabase
          .from('urls')
          .update({
            status: 'failed',
            error_details: `Processing failed: ${error.message}`
          })
          .eq('id', urlId);
        
        return NextResponse.json(
          { success: false, error: `Error processing URL: ${error.message}` },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('Unexpected error during URL processing:', error);
      
      // Attempt to log the error and update the URL status
      try {
        await createLog(supabase, urlId, 'error', `Unexpected error during processing: ${error.message}`);
        
        await supabase
          .from('urls')
          .update({
            status: 'failed',
            error_details: `Unexpected error: ${error.message}`
          })
          .eq('id', urlId);
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
      
      return NextResponse.json(
        { success: false, error: `Unexpected error during processing: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Global error in retry-processing API:', error);
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
} 