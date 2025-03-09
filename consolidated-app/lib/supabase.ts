import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get the current authenticated user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Helper function to get a user's API key
export async function getUserApiKey(userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching API key:', error);
    return null;
  }
  
  return data?.key || null;
}

// Helper function to create an API key for a user
export async function createApiKey(userId: string) {
  // Generate a random API key
  const key = Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 36).toString(36)
  ).join('');
  
  // Store the API key in the database
  const { data, error } = await supabase
    .from('api_keys')
    .insert([
      { user_id: userId, key }
    ])
    .select();
  
  if (error) {
    console.error('Error creating API key:', error);
    return null;
  }
  
  return key;
} 