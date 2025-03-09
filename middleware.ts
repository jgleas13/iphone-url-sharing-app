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
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // If there's no session and the request is for a protected route, redirect to login
  if (!session && !isPublicRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/callback',
    '/api/receive',
    '/api/test-openai-key',
  ];
  
  return (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/favicon.ico')
  );
}

// Apply the middleware to all routes except public paths
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 