import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// This function creates a Supabase client for server components
export function createServerSupabaseClient() {
  console.log('[Server] Creating Supabase server client');
  
  // Check if environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Server] Supabase environment variables are missing');
    throw new Error('Supabase environment variables are required');
  }
  
  console.log(`[Server] Using Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  
  return createServerComponentClient<Database>({
    cookies,
  });
} 