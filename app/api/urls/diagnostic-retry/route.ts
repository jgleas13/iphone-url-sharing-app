import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createGrokClient, GrokMessage } from '../../../../lib/grok-api';

// Helper to log actions to the processing_logs table
async function logProcessingStep(
  supabase: any, 
  urlId: string, 
  type: string, 
  message: string, 
  data?: any
) {
  try {
    const { error } = await supabase
      .from('processing_logs')
      .insert({
        url_id: urlId,
        type,
        message,
        data: data ? JSON.stringify(data) : null
      });
      
    if (error) {
      console.error(`Error logging processing step: ${error.message}`);
    }
  } catch (err) {
    console.error('Failed to log processing step:', err);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const processingSteps: string[] = [];
  let urlId: string | null = null;
  let supabase: any;
  
  try {
    processingSteps.push(`Started diagnostic retry at ${new Date().toISOString()}`);
    
    // Parse request body
    const body = await request.json();
    urlId = body.urlId;
    
    if (!urlId) {
      return NextResponse.json(
        { error: 'URL ID is required' },
        { status: 400 }
      );
    }
    
    processingSteps.push(`Request received for URL ID: ${urlId}`);
    
    // Create a Supabase client
    supabase = createRouteHandlerClient({ cookies });
    
    // Authenticate user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      processingSteps.push(`Authentication failed: ${sessionError?.message || 'No session found'}`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    processingSteps.push(`User authenticated: ${session.user.id}`);
    
    // Check if URL exists and belongs to the user
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !url) {
      processingSteps.push(`URL not found or access denied: ${urlError?.message || 'Not found'}`);
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
      );
    }
    
    processingSteps.push(`URL found: ${url.url}`);
    await logProcessingStep(supabase, urlId, 'info', 'Diagnostic retry initiated', { url: url.url });
    
    // Update URL status to pending
    const { error: updateError } = await supabase
      .from('urls')
      .update({ 
        status: 'pending',
        error_details: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', urlId);
    
    if (updateError) {
      processingSteps.push(`Failed to update URL status: ${updateError.message}`);
      await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL status', { error: updateError.message });
      return NextResponse.json(
        { error: 'Failed to update URL status' },
        { status: 500 }
      );
    }
    
    processingSteps.push('URL status updated to pending');
    await logProcessingStep(supabase, urlId, 'info', 'URL status updated to pending');
    
    // Log environment details
    const useGrok = process.env.USE_GROK === 'true';
    const grokApiKey = process.env.GROK_API_KEY;
    const grokModel = process.env.GROK_MODEL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    const envDetails = {
      useGrok,
      hasGrokApiKey: !!grokApiKey,
      grokModel,
      hasOpenAIApiKey: !!openaiApiKey,
      nodeEnv: process.env.NODE_ENV
    };
    
    processingSteps.push(`Environment: ${JSON.stringify(envDetails)}`);
    await logProcessingStep(supabase, urlId, 'info', 'Environment details', envDetails);
    
    // Decide which API to use
    if (useGrok && grokApiKey) {
      processingSteps.push('Using Grok API for processing');
      await logProcessingStep(supabase, urlId, 'info', 'Using Grok API for processing');
      
      // Process with Grok API
      try {
        // Create Grok client
        const grokClient = createGrokClient();
        if (!grokClient) {
          processingSteps.push('Failed to create Grok client');
          await logProcessingStep(supabase, urlId, 'error', 'Failed to create Grok client');
          throw new Error('Failed to create Grok client');
        }
        
        processingSteps.push('Grok client created');
        await logProcessingStep(supabase, urlId, 'info', 'Grok client created');
        
        // Prepare the Grok request
        const messages: GrokMessage[] = [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes webpages and extracts key information.'
          },
          {
            role: 'user',
            content: `Please summarize this webpage: ${url.url}\n\nGive me the summary in JSON format with the following fields:\n- title: the title of the page\n- summary: a concise summary of the content (1-2 paragraphs)\n- tags: an array of relevant keywords or tags (3-5 tags)\n- key_points: an array of the most important points (3-5 bullet points)`
          }
        ];
        
        processingSteps.push('Prepared Grok request messages');
        await logProcessingStep(supabase, urlId, 'api_request', 'Grok API request', { messages });
        
        // Make the Grok API call
        processingSteps.push('Sending request to Grok API');
        const grokResponse = await grokClient.createChatCompletion({
          messages,
          model: grokModel || 'grok-1',
          temperature: 0.3,
          max_tokens: 1000,
        });
        
        processingSteps.push('Received response from Grok API');
        await logProcessingStep(supabase, urlId, 'api_response', 'Grok API response', grokResponse);
        
        // Log the raw response for debugging
        const rawResponseData = JSON.stringify(grokResponse);
        await logProcessingStep(supabase, urlId, 'raw_response', 'Raw Grok API response', rawResponseData);
        
        // Validate Grok response
        if (!grokResponse || !grokResponse.choices || grokResponse.choices.length === 0) {
          processingSteps.push('Invalid Grok API response: No choices returned');
          await logProcessingStep(supabase, urlId, 'error', 'Invalid Grok API response: No choices returned', grokResponse);
          
          // Create a fallback response
          const fallbackResponse = {
            title: url.title || 'Unknown Title',
            summary: 'Failed to generate summary. The API returned an invalid response.',
            tags: ['error', 'processing_failed', 'api_error'],
            key_points: ['Summary generation failed', 'Please try again later']
          };
          
          // Update URL with fallback response
          const { error: updateError } = await supabase
            .from('urls')
            .update({
              status: 'summarized',
              title: fallbackResponse.title,
              summary: fallbackResponse.summary,
              tags: fallbackResponse.tags,
              key_points: fallbackResponse.key_points,
              error_details: 'API returned invalid response: No choices array',
              debug_info: {
                api_request: messages,
                api_response: grokResponse || {},
                processing_steps: processingSteps,
                processing_time: Date.now() - startTime,
                raw_response: rawResponseData
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', urlId);
          
          if (updateError) {
            processingSteps.push(`Failed to update URL with fallback response: ${updateError.message}`);
            await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL with fallback response', { error: updateError.message });
          } else {
            processingSteps.push('URL updated with fallback response');
            await logProcessingStep(supabase, urlId, 'info', 'URL updated with fallback response', fallbackResponse);
          }
          
          return NextResponse.json({
            message: 'URL processed with fallback response due to invalid API response',
            url_id: urlId,
            status: 'summarized',
            processing_steps: processingSteps,
            processing_time: Date.now() - startTime
          });
        }
        
        // Extract and parse the response content
        const responseContent = grokResponse.choices[0]?.message?.content;
        
        if (!responseContent) {
          processingSteps.push('Empty content in Grok API response');
          await logProcessingStep(supabase, urlId, 'error', 'Empty content in Grok API response', grokResponse);
          throw new Error('Empty content in Grok API response');
        }
        
        processingSteps.push('Extracted content from Grok API response');
        
        // Try to parse JSON response
        let parsedResponse;
        try {
          // Match JSON in the response using regex
          const jsonMatch = responseContent.match(/```json\n([\s\S]*)\n```/) || 
                            responseContent.match(/```([\s\S]*)```/) ||
                            [null, responseContent];
            
          const jsonContent = jsonMatch[1] || responseContent;
          parsedResponse = JSON.parse(jsonContent.trim());
          
          processingSteps.push('Successfully parsed JSON response');
          await logProcessingStep(supabase, urlId, 'info', 'Successfully parsed JSON response', parsedResponse);
        } catch (parseError: any) {
          processingSteps.push(`Failed to parse JSON response: ${parseError.message}`);
          await logProcessingStep(supabase, urlId, 'error', 'Failed to parse JSON response', { 
            error: parseError.message, 
            content: responseContent 
          });
          
          // Create a structured response from unstructured text
          parsedResponse = {
            title: url.title || 'Unknown Title',
            summary: responseContent.substring(0, 500),
            tags: ['parsed_from_text'],
            key_points: [responseContent.substring(0, 200)]
          };
          
          processingSteps.push('Created structured response from unstructured text');
          await logProcessingStep(supabase, urlId, 'info', 'Created structured response from unstructured text', parsedResponse);
        }
        
        // Update URL with the parsed response
        const { error: updateError } = await supabase
          .from('urls')
          .update({
            status: 'summarized',
            title: parsedResponse.title || url.title || 'Unknown Title',
            summary: parsedResponse.summary || 'No summary provided',
            tags: parsedResponse.tags || [],
            key_points: parsedResponse.key_points || [],
            debug_info: {
              api_request: messages,
              api_response: grokResponse,
              processing_steps: processingSteps,
              processing_time: Date.now() - startTime,
              raw_response: rawResponseData
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', urlId);
        
        if (updateError) {
          processingSteps.push(`Failed to update URL with parsed response: ${updateError.message}`);
          await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL with parsed response', { error: updateError.message });
          throw new Error(`Failed to update URL with parsed response: ${updateError.message}`);
        }
        
        processingSteps.push('URL updated with parsed response');
        await logProcessingStep(supabase, urlId, 'info', 'URL updated with parsed response');
        
        return NextResponse.json({
          message: 'URL processed successfully',
          url_id: urlId,
          status: 'summarized',
          processing_steps: processingSteps,
          processing_time: Date.now() - startTime
        });
      } catch (error: any) {
        processingSteps.push(`Error processing URL with Grok API: ${error.message}`);
        await logProcessingStep(supabase, urlId, 'error', 'Error processing URL with Grok API', { error: error.message });
        
        // Update URL status to failed
        const { error: updateError } = await supabase
          .from('urls')
          .update({
            status: 'failed',
            error_details: error.message,
            debug_info: {
              processing_steps: processingSteps,
              processing_time: Date.now() - startTime,
              error: error.message
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', urlId);
        
        if (updateError) {
          processingSteps.push(`Failed to update URL status to failed: ${updateError.message}`);
          await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL status to failed', { error: updateError.message });
        } else {
          processingSteps.push('URL status updated to failed');
          await logProcessingStep(supabase, urlId, 'info', 'URL status updated to failed');
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to process URL with Grok API',
            message: error.message,
            url_id: urlId,
            status: 'failed',
            processing_steps: processingSteps,
            processing_time: Date.now() - startTime
          },
          { status: 500 }
        );
      }
    } else if (openaiApiKey) {
      processingSteps.push('Using OpenAI API for processing');
      await logProcessingStep(supabase, urlId, 'info', 'Using OpenAI API for processing');
      
      // Process with OpenAI API
      try {
        // Create OpenAI client - not implemented yet, stub for future use
        processingSteps.push('OpenAI API not implemented in this version');
        await logProcessingStep(supabase, urlId, 'error', 'OpenAI API not implemented');
        throw new Error('OpenAI API not implemented in this version');
        
        // The rest of the OpenAI implementation would go here
      } catch (error: any) {
        processingSteps.push(`Error processing URL with OpenAI API: ${error.message}`);
        await logProcessingStep(supabase, urlId, 'error', 'Error processing URL with OpenAI API', { error: error.message });
        
        // Update URL status to failed
        const { error: updateError } = await supabase
          .from('urls')
          .update({
            status: 'failed',
            error_details: error.message,
            debug_info: {
              processing_steps: processingSteps,
              processing_time: Date.now() - startTime,
              error: error.message
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', urlId);
        
        if (updateError) {
          processingSteps.push(`Failed to update URL status to failed: ${updateError.message}`);
          await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL status to failed', { error: updateError.message });
        } else {
          processingSteps.push('URL status updated to failed');
          await logProcessingStep(supabase, urlId, 'info', 'URL status updated to failed');
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to process URL with OpenAI API',
            message: error.message,
            url_id: urlId,
            status: 'failed',
            processing_steps: processingSteps,
            processing_time: Date.now() - startTime
          },
          { status: 500 }
        );
      }
    } else {
      processingSteps.push('No API configured for processing');
      await logProcessingStep(supabase, urlId, 'error', 'No API configured for processing');
      
      // Update URL status to failed due to missing API configuration
      const { error: updateError } = await supabase
        .from('urls')
        .update({
          status: 'failed',
          error_details: 'No API configured for processing',
          debug_info: {
            processing_steps: processingSteps,
            processing_time: Date.now() - startTime,
            error: 'No API configured for processing'
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', urlId);
      
      if (updateError) {
        processingSteps.push(`Failed to update URL status to failed: ${updateError.message}`);
        await logProcessingStep(supabase, urlId, 'error', 'Failed to update URL status to failed', { error: updateError.message });
      } else {
        processingSteps.push('URL status updated to failed');
        await logProcessingStep(supabase, urlId, 'info', 'URL status updated to failed');
      }
      
      return NextResponse.json(
        { 
          error: 'No API configured for processing',
          url_id: urlId,
          status: 'failed',
          processing_steps: processingSteps,
          processing_time: Date.now() - startTime
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in diagnostic retry:', error);
    processingSteps.push(`Unexpected error: ${error.message}`);
    
    // Log error if possible
    if (supabase && urlId) {
      await logProcessingStep(supabase, urlId, 'error', 'Unexpected error in diagnostic retry', { error: error.message });
      
      // Update URL status to failed
      try {
        await supabase
          .from('urls')
          .update({
            status: 'failed',
            error_details: error.message,
            debug_info: {
              processing_steps: processingSteps,
              processing_time: Date.now() - startTime,
              error: error.message
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', urlId);
      } catch (updateError) {
        console.error('Failed to update URL status after error:', updateError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process URL',
        message: error.message,
        url_id: urlId,
        processing_steps: processingSteps,
        processing_time: Date.now() - startTime
      },
      { status: 500 }
    );
  }
} 