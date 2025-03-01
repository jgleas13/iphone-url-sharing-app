import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Create the Supabase client for client components
export const supabase = createClientComponentClient<Database>();

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!supabaseUrl && !!supabaseAnonKey;
}; 