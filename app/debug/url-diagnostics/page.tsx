'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EnvironmentInfo from '../../../components/EnvironmentInfo';
import PendingUrlsList, { UrlItem } from '../../../components/PendingUrlsList';
import ProcessingLogViewer from '../../../components/ProcessingLogViewer';
import UrlDebugInfo from '../../../components/UrlDebugInfo';
import StuckUrlsCleanup from '../../../components/StuckUrlsCleanup';

interface ProcessingLog {
  id: string;
  url_id: string;
  type: string;
  message: string;
  data?: any;
  created_at: string;
}

export default function UrlDiagnosticsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUrlsLoading, setIsUrlsLoading] = useState<boolean>(false);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [pendingUrls, setPendingUrls] = useState<UrlItem[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<UrlItem | null>(null);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [envInfo, setEnvInfo] = useState<any>({});
  const [retryResult, setRetryResult] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Unexpected error during auth check:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Fetch environment info
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const response = await fetch('/api/debug/environment');
        if (response.ok) {
          const data = await response.json();
          setEnvInfo(data);
        }
      } catch (error) {
        console.error('Error checking environment:', error);
      }
    };

    if (isAuthenticated) {
      checkEnvironment();
    }
  }, [isAuthenticated]);

  // Fetch pending URLs when authenticated
  useEffect(() => {
    const fetchPendingUrls = async () => {
      if (!isAuthenticated) return;
      
      setIsUrlsLoading(true);
      try {
        const response = await fetch('/api/debug/pending-urls');
        if (response.ok) {
          const data = await response.json();
          setPendingUrls(data.urls || []);
        } else {
          console.error('Failed to fetch pending URLs:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching pending URLs:', error);
      } finally {
        setIsUrlsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchPendingUrls();
    }
  }, [isAuthenticated]);

  // Function to select a URL and fetch its logs
  const selectUrl = async (url: UrlItem) => {
    setSelectedUrl(url);
    setRetryResult(null);
    
    // Fetch processing logs for the selected URL
    setIsLogsLoading(true);
    try {
      const response = await fetch(`/api/debug/url-logs?urlId=${url.id}`);
      if (response.ok) {
        const data = await response.json();
        setProcessingLogs(data.logs || []);
      } else {
        console.error('Failed to fetch URL logs:', await response.text());
        setProcessingLogs([]);
      }
    } catch (error) {
      console.error('Error fetching URL logs:', error);
      setProcessingLogs([]);
    } finally {
      setIsLogsLoading(false);
    }
  };

  // Function to retry processing for the selected URL
  const retryProcessing = async () => {
    if (!selectedUrl) return;
    
    setIsRetrying(true);
    setRetryResult(null);
    
    try {
      const response = await fetch('/api/debug/retry-processing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlId: selectedUrl.id }),
      });
      
      const data = await response.json();
      setRetryResult(data);
      
      // Refresh URL data and logs
      const updatedUrlResponse = await fetch(`/api/debug/url?urlId=${selectedUrl.id}`);
      if (updatedUrlResponse.ok) {
        const updatedUrl = await updatedUrlResponse.json();
        setSelectedUrl(updatedUrl.url);
        
        // Update the URL in the pending URLs list
        setPendingUrls(prev => prev.map(url => 
          url.id === selectedUrl.id ? updatedUrl.url : url
        ));
      }
      
      // Refresh logs
      const logsResponse = await fetch(`/api/debug/url-logs?urlId=${selectedUrl.id}`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setProcessingLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error('Error retrying URL processing:', error);
      setRetryResult({
        success: false,
        error: 'An unexpected error occurred during processing'
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">URL Processing Diagnostics</h1>
        <div className="bg-white p-8 rounded-lg shadow flex justify-center items-center">
          <svg className="w-8 h-8 text-blue-500 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">URL Processing Diagnostics</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-lg text-gray-700 mb-4">You need to be logged in to use this page.</p>
          <Link 
            href="/login" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-16 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">URL Processing Diagnostics</h1>
        <div>
          <Link 
            href="/debug" 
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            Debug Home
          </Link>
          <Link 
            href="/urls" 
            className="text-blue-600 hover:text-blue-800"
          >
            URLs Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Environment Info */}
        <EnvironmentInfo envInfo={envInfo} isLoading={false} />
        
        {/* Stuck URLs Cleanup */}
        <StuckUrlsCleanup onComplete={() => {
          // Refresh the pending URLs list after cleanup
          setIsUrlsLoading(true);
          fetch('/api/debug/pending-urls')
            .then(response => response.ok ? response.json() : { urls: [] })
            .then(data => {
              setPendingUrls(data.urls || []);
              setIsUrlsLoading(false);
            })
            .catch(error => {
              console.error('Error refreshing URLs:', error);
              setIsUrlsLoading(false);
            });
        }} />
        
        {/* Pending URLs List */}
        <PendingUrlsList 
          urls={pendingUrls} 
          isLoading={isUrlsLoading} 
          onSelectUrl={selectUrl} 
          selectedUrlId={selectedUrl?.id}
        />
        
        {/* Selected URL Details */}
        {selectedUrl && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Selected URL</h3>
              <button
                onClick={retryProcessing}
                disabled={isRetrying}
                className={`px-4 py-2 text-white rounded-md ${
                  isRetrying 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRetrying ? (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white animate-spin mr-2" viewBox="0 0 100 101" fill="none">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                    </svg>
                    Processing...
                  </div>
                ) : 'Retry Processing'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">URL</h4>
                <p className="text-sm break-all bg-gray-50 p-2 rounded">
                  {selectedUrl.url}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <p className="text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedUrl.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : selectedUrl.status === 'summarized' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUrl.status}
                  </span>
                </p>
              </div>
            </div>
            
            {selectedUrl.title && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Title</h4>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedUrl.title}</p>
              </div>
            )}
            
            {selectedUrl.error_details && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Error Details</h4>
                <p className="text-sm bg-red-50 p-2 rounded text-red-800">{selectedUrl.error_details}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Retry Result */}
        {retryResult && (
          <div className={`bg-white rounded-lg border ${
            retryResult.success ? 'border-green-200' : 'border-red-200'
          } shadow-md p-6 mb-4`}>
            <h3 className="text-lg font-medium mb-4">Retry Result</h3>
            <div className={`p-4 rounded ${
              retryResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={retryResult.success ? 'text-green-800' : 'text-red-800'}>
                {retryResult.success ? 'Processing completed successfully!' : retryResult.error || 'Processing failed.'}
              </p>
              
              {retryResult.details && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Details:</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                    {typeof retryResult.details === 'object' 
                      ? JSON.stringify(retryResult.details, null, 2) 
                      : retryResult.details}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* URL Debug Info */}
        {selectedUrl && (
          <UrlDebugInfo urlInfo={selectedUrl} isLoading={false} />
        )}
        
        {/* Processing Logs */}
        {selectedUrl && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
            <h3 className="text-lg font-medium mb-4">Processing Logs</h3>
            <ProcessingLogViewer logs={processingLogs} isLoading={isLogsLoading} />
          </div>
        )}
      </div>
    </div>
  );
} 