import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Grok API configuration
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    // Extract the API key from headers
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }
    
    // Verify the API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key', apiKey)
      .single();
    
    if (apiKeyError || !apiKeyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
    
    const userId = apiKeyData.user_id;
    
    // Parse the request body
    const body = await request.json();
    const { url, title } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Insert the URL into the database
    const { data: urlData, error: urlError } = await supabase
      .from('urls')
      .insert([
        {
          url,
          title: title || url,
          user_id: userId,
          status: 'pending'
        }
      ])
      .select()
      .single();
    
    if (urlError) {
      console.error('Error inserting URL:', urlError);
      return NextResponse.json(
        { error: 'Failed to save URL' },
        { status: 500 }
      );
    }
    
    // Start the summarization process in the background
    generateSummary(urlData.id, url, userId).catch(error => {
      console.error('Error generating summary:', error);
    });
    
    return NextResponse.json({
      message: 'URL received successfully',
      id: urlData.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error processing URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to generate a summary using Grok
async function generateSummary(urlId: string, url: string, userId: string) {
  try {
    if (!GROK_API_KEY) {
      throw new Error('Grok API key not configured');
    }
    
    // Send the URL to Grok for summarization
    const response = await axios.post(
      GROK_API_URL,
      {
        model: 'grok-1',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes web content. Provide a concise summary in 2-3 sentences and suggest 3-5 relevant tags.'
          },
          {
            role: 'user',
            content: `Please summarize the content at this URL: ${url}. Provide a clear, concise summary and generate 3-5 relevant tags. Format your response as: "SUMMARY: [your summary here] TAGS: [comma-separated tags]"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const assistantMessage = response.data.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No summary generated');
    }
    
    // Extract summary and tags using regular expressions
    const summaryMatch = assistantMessage.match(/SUMMARY:\s*([\s\S]*?)(?=\s*TAGS:|$)/);
    const tagsMatch = assistantMessage.match(/TAGS:\s*([\s\S]*?)$/);
    
    let summary = summaryMatch ? summaryMatch[1].trim() : null;
    let tags = tagsMatch ? tagsMatch[1].trim().split(',').map((tag: string) => tag.trim()) : [];
    
    // Update the URL in the database with the summary and tags
    const { error } = await supabase
      .from('urls')
      .update({
        summary,
        tags,
        status: 'summarized'
      })
      .eq('id', urlId)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Mark the URL as failed in the database
    await supabase
      .from('urls')
      .update({
        status: 'failed'
      })
      .eq('id', urlId)
      .eq('user_id', userId);
    
    return { success: false, error };
  }
} 