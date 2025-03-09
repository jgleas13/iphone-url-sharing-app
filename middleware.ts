import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/callback',
  '/api/health',
  '/api/receive', // This needs to be accessible from iOS shortcuts
  '/guide',
];

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Allow access to public paths
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Allow access to static files and favicon
  if (
    pathname.includes('.') || // Static files like .js, .css, etc.
    pathname.startsWith('/_next') || // Next.js static files
    pathname.startsWith('/favicon')
  ) {
    return res;
  }
  
  // Check if the request is for an API route and contains an API key
  const isApiRequest = pathname.startsWith('/api/');
  const apiKey = request.headers.get('x-api-key');
  
  if (isApiRequest && apiKey) {
    // We'll validate the API key in the route handlers
    return res;
  }
  
  // Redirect unauthenticated users to the login page if accessing protected routes
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// Apply the middleware to all routes except public paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/test-openai-key (OpenAI API key test endpoint)
     * - api/receive (API endpoint for receiving URLs from iOS Shortcuts)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/test-openai-key|api/receive|_next/static|_next/image|favicon.ico).*)',
  ],
}; 