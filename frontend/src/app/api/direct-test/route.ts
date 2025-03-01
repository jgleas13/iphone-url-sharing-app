import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    console.log('[Direct Test API] Testing backend response structure directly');
    
    // Get the URL from query params
    const url = request.nextUrl.searchParams.get('url') || 'https://example.com';
    
    // Call the backend API directly
    console.log('[Direct Test API] Calling backend for URL:', url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${backendUrl}/api/v1/urls`, {
      url,
      pageTitle: 'Test Page',
      tags: ['test'],
      dateAccessed: new Date().toISOString()
    });
    
    // Return the raw response data
    return NextResponse.json({
      message: 'Raw backend response',
      data: response.data,
      headers: response.headers,
      status: response.status
    });
  } catch (error) {
    console.error('[Direct Test API] Error:', error);
    
    let errorDetails = {
      message: 'Unknown error'
    };
    
    if (error instanceof Error) {
      errorDetails.message = error.message;
      
      if (axios.isAxiosError(error)) {
        return NextResponse.json({
          error: 'Axios error',
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: errorDetails }, { status: 500 });
  }
} 