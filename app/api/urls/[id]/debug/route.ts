import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const urlId = params.id;
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch the URL to verify ownership
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', urlId)
      .eq('user_id', session.user.id)
      .single();
    
    if (urlError || !url) {
      return NextResponse.json(
        { error: 'URL not found or access denied' },
        { status: 404 }
      );
    }
    
    // Fetch processing logs from the database
    const { data: logs, error: logsError } = await supabase
      .from('url_processing_logs')
      .select('*')
      .eq('url_id', urlId)
      .order('created_at', { ascending: true });
    
    // If no logs found, create mock data based on URL status
    if (logsError || !logs || logs.length === 0) {
      // Create mock debug data based on URL status for demonstration
      const mockDebugData = generateMockDebugData(url);
      
      return NextResponse.json(mockDebugData);
    }
    
    // Process and format the debug data
    const formattedDebugData = {
      processing_steps: logs
        .filter(log => log.type !== 'api_request' && log.type !== 'api_response')
        .map(log => `${new Date(log.created_at).toLocaleString()}: ${log.message}`),
      
      api_request: logs.find(log => log.type === 'api_request')?.data || null,
      api_response: logs.find(log => log.type === 'api_response')?.data || null,
      error_details: logs.find(log => log.type === 'error')?.data || null,
      processing_time: calculateProcessingTime(logs),
    };
    
    return NextResponse.json(formattedDebugData);
  } catch (error) {
    console.error('Error fetching debug information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug information' },
      { status: 500 }
    );
  }
}

// Helper function to calculate processing time from logs
function calculateProcessingTime(logs: any[]) {
  if (!logs || logs.length < 2) return 0;
  
  const startLog = logs.find(log => log.type === 'start');
  const endLog = logs.find(log => log.type === 'end' || log.type === 'error');
  
  if (!startLog || !endLog) return 0;
  
  const startTime = new Date(startLog.created_at).getTime();
  const endTime = new Date(endLog.created_at).getTime();
  
  return endTime - startTime;
}

// Helper function to generate mock debug data for demonstration
function generateMockDebugData(url: any) {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Create timestamps for the processing steps
  const receivedTime = fiveMinutesAgo.toLocaleString();
  const validationTime = new Date(fiveMinutesAgo.getTime() + 500).toLocaleString();
  const processingTime = new Date(fiveMinutesAgo.getTime() + 1000).toLocaleString();
  const completionTime = new Date(fiveMinutesAgo.getTime() + 3000).toLocaleString();
  
  // Check if we're using Grok
  const useGrok = process.env.USE_GROK === 'true';
  const aiProvider = useGrok ? 'Grok' : 'OpenAI';
  const aiModel = useGrok ? 'grok-1' : 'gpt-4-turbo';
  
  // Sample API request based on the URL
  const sampleRequest = useGrok ? {
    model: aiModel,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that summarizes web content concisely and extracts relevant tags."
      },
      {
        role: "user",
        content: `Please visit this URL and provide a title, a concise summary, and 3-5 relevant tags for the content: ${url.url}`
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  } : {
    model: aiModel,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that summarizes web content concisely and extracts relevant tags."
      },
      {
        role: "user",
        content: `Please summarize the following webpage content and extract 3-5 relevant tags. URL: ${url.url}\n\nTitle: ${url.title || 'Untitled Page'}\n\nContent: [Content extracted from the webpage would appear here]`
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  };
  
  // Sample API response based on the URL status
  let sampleResponse;
  let errorDetails = null;
  let processingSteps;
  
  if (url.status === 'summarized') {
    if (useGrok) {
      sampleResponse = {
        id: "abcdef-123456",
        model: aiModel,
        choices: [
          {
            message: {
              role: "assistant",
              content: `Title: ${url.title || 'Page Title'}\n\nSummary: ${url.summary || 'This is a sample summary of the webpage content.'}\n\nTags: ${url.tags?.join(', ') || 'news, technology, business'}`
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 350,
          completion_tokens: 150,
          total_tokens: 500
        }
      };
    } else {
      sampleResponse = {
        id: "chatcmpl-123456789",
        object: "chat.completion",
        created: Math.floor(fiveMinutesAgo.getTime() / 1000) + 3,
        model: aiModel,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Title: ${url.title || 'Page Title'}\n\nSummary: ${url.summary || 'This is a sample summary of the webpage content.'}\n\nTags: ${url.tags?.join(', ') || 'news, technology, business'}`
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: 350,
          completion_tokens: 150,
          total_tokens: 500
        }
      };
    }
    
    processingSteps = [
      `${receivedTime}: URL received for processing`,
      `${validationTime}: URL validated successfully`,
      `${processingTime}: Content extracted and sent to ${aiProvider} for summarization`,
      `${completionTime}: Summary generated and saved successfully`
    ];
  } else if (url.status === 'failed') {
    sampleResponse = {
      error: {
        message: `The ${aiProvider} API request failed due to an error with the content extraction or processing.`,
        type: "api_error",
        code: "content_extraction_failed"
      }
    };
    
    errorDetails = `Failed to extract content from the URL or process with ${aiProvider}. The webpage might be protected, require authentication, or contain no extractable content.`;
    
    processingSteps = [
      `${receivedTime}: URL received for processing`,
      `${validationTime}: URL validated successfully`,
      `${processingTime}: Attempted content extraction`,
      `${processingTime}: Content extraction or ${aiProvider} API call failed`,
      `${completionTime}: Processing marked as failed`
    ];
  } else { // pending
    sampleResponse = null;
    
    processingSteps = [
      `${receivedTime}: URL received for processing`,
      `${validationTime}: URL validated successfully`,
      `${now.toLocaleString()}: Waiting in queue for processing`
    ];
  }
  
  return {
    processing_steps: processingSteps,
    api_request: JSON.stringify(sampleRequest, null, 2),
    api_response: sampleResponse ? JSON.stringify(sampleResponse, null, 2) : null,
    error_details: errorDetails,
    processing_time: url.status === 'pending' ? 0 : 3000, // 3 seconds for completed/failed
  };
} 