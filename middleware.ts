import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // For all other routes, redirect to the login page if not authenticated
  // This is a simplified version that doesn't check authentication
  // You'll need to implement proper authentication checks in your API routes
  
  return NextResponse.next();
}

// Apply the middleware to all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 