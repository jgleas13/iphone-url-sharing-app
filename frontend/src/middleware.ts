import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next();
    
    console.log(`[Middleware] Processing request: ${request.nextUrl.pathname}`);
    
    // Create middleware Supabase client
    const supabase = createMiddlewareClient<Database>({ req: request, res });
    
    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`[Middleware] Session status: ${session ? 'Active' : 'No session'}`);
    
    return res;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.next();
  }
}

// This ensures the middleware runs for all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 