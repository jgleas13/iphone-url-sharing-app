'use client';

import { useState } from 'react';

interface DebugRetryButtonProps {
  urlId: string;
}

export default function DebugRetryButton({ urlId }: DebugRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  const handleDebugRetry = async () => {
    try {
      setIsRetrying(true);
      setError(null);
      setSuccess(false);
      setResponse(null);
      setRawResponse(null);
      
      console.log("Starting debug retry for URL ID:", urlId);
      
      const fetchResponse = await fetch('/api/urls/debug-retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlId }),
      });
      
      // Get the response data
      let data;
      try {
        data = await fetchResponse.json();
        console.log("Debug retry response:", data);
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error("Failed to parse server response");
      }
      
      // Store the response data regardless of success or failure
      setResponse(data || { error: "No data received from server" });
      
      // Store raw API response if available
      if (data?.response) {
        setRawResponse(JSON.stringify(data.response, null, 2));
      }
      
      // Check if the request was successful
      if (!fetchResponse.ok) {
        throw new Error(data?.error || `Server error: ${fetchResponse.status}`);
      }
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Error in debug retry:', error);
      setError(error.message || "Unknown error occurred");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-medium mb-2">Debug Tools</h3>
      
      <button
        onClick={handleDebugRetry}
        disabled={isRetrying}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        {isRetrying ? 'Processing...' : 'Debug Retry'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-700 font-medium">Error</h4>
          <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-60">{error}</pre>
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-green-700 font-medium">Success</h4>
          <p className="text-sm">The debug retry was successful!</p>
        </div>
      )}
      
      {rawResponse && (
        <div className="mt-4">
          <h4 className="font-medium">Raw API Response</h4>
          <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs whitespace-pre-wrap overflow-auto max-h-80">
            {rawResponse}
          </pre>
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h4 className="font-medium">Complete Response Data</h4>
          <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs whitespace-pre-wrap overflow-auto max-h-80">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 