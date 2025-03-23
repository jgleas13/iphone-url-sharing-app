'use client';

import { useState } from 'react';

interface RetryProcessingButtonProps {
  urlId: string;
  onSuccess: () => void;
}

export default function RetryProcessingButton({ urlId, onSuccess }: RetryProcessingButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      setError(null);
      setSuccess(false);
      
      const response = await fetch('/api/urls/retry-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry processing');
      }
      
      // Set success state
      setSuccess(true);
      
      // Call the onSuccess callback to refresh the list
      onSuccess();
      
      // Set a timer to poll for updates since the processing happens in the background
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkStatus = async () => {
        try {
          attempts++;
          const statusResponse = await fetch(`/api/urls/${urlId}/status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData.status !== 'pending') {
              // If status changed, refresh the parent component
              onSuccess();
              return; // Stop polling
            }
          }
          
          // Continue polling if we haven't reached max attempts
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 2000); // Check every 2 seconds
          } else {
            // After max attempts, refresh one more time in case we missed an update
            onSuccess();
          }
        } catch (error) {
          console.error('Error checking URL status:', error);
          // Still refresh the list to ensure we have the latest data
          onSuccess();
        }
      };
      
      // Start checking for status updates
      setTimeout(checkStatus, 2000);
    } catch (error: any) {
      console.error('Error retrying processing:', error);
      setError(error.message);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="ml-2 inline-block">
      <button
        onClick={handleRetry}
        disabled={isRetrying || success}
        className={`ml-2 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          success 
            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        } disabled:opacity-50`}
        title={error || (success ? "Processing started" : "Retry processing this URL")}
      >
        {isRetrying 
          ? 'Retrying...' 
          : success 
            ? 'Processing...' 
            : 'Retry'
        }
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
} 