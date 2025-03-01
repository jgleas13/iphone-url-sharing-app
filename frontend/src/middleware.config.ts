// This file ensures that the middleware is properly configured for the Edge Runtime
export const runtime = 'experimental-edge';

// Export environment variables that should be available in the middleware
export const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://ylbkfzhkkcttwevgpyfv.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYmtmemhra2N0dHdldmdweWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NjA5MzEsImV4cCI6MjA1NjQzNjkzMX0.MnFIML0acRkYjAVXFDKkyILdVV-40mbLy4wpedCJ8Fk',
}; 