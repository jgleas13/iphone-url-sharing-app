import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug API] Testing backend response structure');
    
    // Get the URL from query params
    const url = request.nextUrl.searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    // Call the backend API
    console.log('[Debug API] Calling backend for URL:', url);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${backendUrl}/api/v1/urls`, {
      url,
      pageTitle: '',
      tags: [],
      dateAccessed: new Date().toISOString()
    });
    
    // Detailed analysis of the response structure
    const responseData = response.data;
    const responseType = typeof responseData;
    const isArray = Array.isArray(responseData);
    
    // Check for summary in different possible locations
    let summaryLocation = 'not found';
    let summaryValue = null;
    
    // Direct property
    if (responseType === 'object' && !isArray && responseData && 'summary' in responseData) {
      summaryLocation = 'direct property';
      summaryValue = responseData.summary;
    } 
    // Nested in data property
    else if (responseType === 'object' && !isArray && responseData && responseData.data && 
             typeof responseData.data === 'object' && 'summary' in responseData.data) {
      summaryLocation = 'nested in data property';
      summaryValue = responseData.data.summary;
    }
    // First item in array
    else if (isArray && responseData.length > 0) {
      if (typeof responseData[0] === 'object' && responseData[0] && 'summary' in responseData[0]) {
        summaryLocation = 'first item in array';
        summaryValue = responseData[0].summary;
      }
    }
    // Deeply nested
    else if (responseType === 'object' && !isArray && responseData) {
      // Try to find summary in any nested object (one level deep)
      for (const key in responseData) {
        if (typeof responseData[key] === 'object' && responseData[key] && 'summary' in responseData[key]) {
          summaryLocation = `nested in ${key} property`;
          summaryValue = responseData[key].summary;
          break;
        }
      }
    }
    
    // Return the full response structure for debugging
    return NextResponse.json({
      message: 'Backend response structure',
      responseData,
      responseType,
      isArray,
      summaryAnalysis: {
        location: summaryLocation,
        value: summaryValue,
        valueType: typeof summaryValue
      },
      topLevelKeys: responseType === 'object' && !isArray ? Object.keys(responseData) : [],
      nestedStructure: responseType === 'object' ? 
        Object.entries(responseData).reduce((acc, [key, value]) => {
          acc[key] = {
            type: typeof value,
            isArray: Array.isArray(value),
            keys: typeof value === 'object' && value !== null ? Object.keys(value) : []
          };
          return acc;
        }, {} as Record<string, any>) : {}
    });
  } catch (error) {
    console.error('[Debug API] Error:', error);
    
    // Enhanced error reporting
    let errorMessage = 'Failed to fetch backend response';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If it's an Axios error, extract more details
      if (axios.isAxiosError(error) && error.response) {
        errorDetails = {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        };
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        stack: process.env.NODE_ENV !== 'production' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
} 