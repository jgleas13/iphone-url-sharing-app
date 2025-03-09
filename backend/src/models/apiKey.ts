import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generates a new API key for a user
 * @param userId The Supabase user ID
 * @returns The generated API key
 */
export async function generateApiKey(userId: string): Promise<string> {
  // Generate a random key
  const apiKey = `ipus_${randomBytes(16).toString('hex')}`;
  
  // Store the API key in the database
  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      api_key: apiKey,
      created_at: new Date().toISOString(),
      is_active: true
    });
    
  if (error) {
    console.error('Error generating API key:', error);
    throw new Error('Failed to generate API key');
  }
  
  return apiKey;
}

/**
 * Validates an API key and returns the associated user ID
 * @param apiKey The API key to validate
 * @returns The user ID if valid, null otherwise
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();
    
  if (error || !data) {
    console.error('Invalid API key or error validating:', error);
    return null;
  }
  
  return data.user_id;
}

/**
 * Deactivates an API key
 * @param apiKey The API key to deactivate
 */
export async function deactivateApiKey(apiKey: string): Promise<boolean> {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('api_key', apiKey);
    
  if (error) {
    console.error('Error deactivating API key:', error);
    return false;
  }
  
  return true;
}

/**
 * Gets all API keys for a user
 * @param userId The Supabase user ID
 * @returns Array of API keys
 */
export async function getUserApiKeys(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching user API keys:', error);
    return [];
  }
  
  return data || [];
} 