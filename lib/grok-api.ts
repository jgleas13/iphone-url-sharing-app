/**
 * Grok API client for integration with the xAI Grok model
 */

export type GrokMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type GrokCompletionRequest = {
  model: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
};

export type GrokCompletionResponse = {
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type GrokTextCompletionRequest = {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
};

export type GrokTextCompletionResponse = {
  choices: {
    text: string;
    finish_reason: string;
  }[];
  id: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export class GrokAPI {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://api.xai.com/v1';
  
  constructor(options: { apiKey: string; model?: string }) {
    this.apiKey = options.apiKey;
    this.model = options.model || process.env.GROK_MODEL || 'grok-1';
  }
  
  /**
   * Creates a chat completion using the Grok API
   */
  async createChatCompletion(request: GrokCompletionRequest): Promise<GrokCompletionResponse> {
    const model = request.model || this.model;
    
    // Debug log
    console.log(`[GROK-DEBUG] Making API request to ${this.baseUrl}/chat/completions`);
    console.log(`[GROK-DEBUG] Using model: ${model}`);
    console.log(`[GROK-DEBUG] API Key prefix: ${this.apiKey.substring(0, 8)}...`);
    
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 500
        })
      });
      
      console.log(`[GROK-DEBUG] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`[GROK-ERROR] API error response:`, error);
        throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`);
      }
      
      const jsonResponse = await response.json() as GrokCompletionResponse;
      console.log(`[GROK-DEBUG] Response received. Has 'choices' array: ${!!jsonResponse.choices}`);
      
      if (jsonResponse.choices && jsonResponse.choices.length > 0) {
        console.log(`[GROK-DEBUG] First choice has 'message': ${!!jsonResponse.choices[0].message}`);
        console.log(`[GROK-DEBUG] Message has 'content': ${!!jsonResponse.choices[0].message?.content}`);
      } else {
        console.log(`[GROK-DEBUG] Response has no choices or empty choices array:`, jsonResponse);
      }
      
      console.log(`[GROK-DEBUG] Successful response with ID: ${jsonResponse.id}`);
      return jsonResponse;
    } catch (error) {
      console.error(`[GROK-ERROR] Exception during API call:`, error);
      throw error;
    }
  }

  /**
   * Completions API similar to OpenAI's Legacy Completions API
   */
  completions = {
    create: async (request: GrokTextCompletionRequest): Promise<GrokTextCompletionResponse> => {
      // Debug log
      console.log(`[GROK-DEBUG] Making text completion request`);
      console.log(`[GROK-DEBUG] Using model: ${this.model}`);
      
      try {
        // For text completions, we'll use the chat endpoint but format accordingly
        const chatResponse = await this.createChatCompletion({
          model: this.model,
          messages: [{ role: 'user', content: request.prompt }],
          temperature: request.temperature,
          max_tokens: request.max_tokens,
        });
        
        // Convert chat response to text completion response format
        return {
          id: chatResponse.id,
          model: chatResponse.model,
          usage: chatResponse.usage,
          choices: chatResponse.choices.map(choice => ({
            text: choice.message.content,
            finish_reason: choice.finish_reason,
          })),
        };
      } catch (error) {
        console.error(`[GROK-ERROR] Exception during completions API call:`, error);
        throw error;
      }
    }
  };
}

// Helper function for easier initialization
export function createGrokClient() {
  const apiKey = process.env.GROK_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROK_API_KEY environment variable is required');
  }
  
  console.log(`[GROK-DEBUG] Creating client with key prefix: ${apiKey.substring(0, 8)}...`);
  console.log(`[GROK-DEBUG] Using model from env: ${process.env.GROK_MODEL}`);
  
  return new GrokAPI({ apiKey });
} 