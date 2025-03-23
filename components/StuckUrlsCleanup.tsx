import React, { useState } from 'react';

interface StuckUrl {
  id: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
  title?: string;
}

interface StuckUrlsCleanupProps {
  onComplete?: () => void;
}

export default function StuckUrlsCleanup({ onComplete }: StuckUrlsCleanupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [stuckUrls, setStuckUrls] = useState<StuckUrl[]>([]);
  const [results, setResults] = useState<{
    success: boolean;
    message: string;
    fixed?: number;
    details?: string;
  } | null>(null);
  const [threshold, setThreshold] = useState(30); // Default 30 minutes threshold

  // Function to find URLs that are stuck in pending state
  const findStuckUrls = async () => {
    setIsChecking(true);
    setResults(null);
    
    try {
      const response = await fetch(`/api/debug/find-stuck-urls?threshold=${threshold}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stuck URLs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStuckUrls(data.urls || []);
      
      if (data.urls?.length === 0) {
        setResults({
          success: true,
          message: 'No stuck URLs found!',
        });
      }
    } catch (error: any) {
      console.error('Error finding stuck URLs:', error);
      setResults({
        success: false,
        message: 'Failed to find stuck URLs',
        details: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Function to fix all stuck URLs
  const fixStuckUrls = async () => {
    if (stuckUrls.length === 0) return;
    
    setIsLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/debug/cleanup-stuck-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urlIds: stuckUrls.map(url => url.id),
          action: 'mark_failed'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fix stuck URLs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResults({
        success: data.success,
        message: data.message,
        fixed: data.fixed,
        details: data.details
      });
      
      // Clear the list after fixing
      setStuckUrls([]);
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error fixing stuck URLs:', error);
      setResults({
        success: false,
        message: 'Failed to fix stuck URLs',
        details: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
      <h3 className="text-lg font-medium mb-4">Stuck URLs Cleanup Tool</h3>
      
      <div className="mb-4">
        <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
          Threshold (minutes for URL to be considered stuck)
        </label>
        <div className="flex items-center">
          <input
            id="threshold"
            type="number"
            min="5"
            max="1440"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 30)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-24 p-2.5"
          />
          <span className="ml-2 text-sm text-gray-500">minutes</span>
        </div>
      </div>
      
      <div className="flex space-x-3 mb-4">
        <button
          onClick={findStuckUrls}
          disabled={isChecking || isLoading}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            isChecking
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isChecking ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 text-white animate-spin mr-2" viewBox="0 0 100 101" fill="none">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
              </svg>
              Checking...
            </div>
          ) : 'Find Stuck URLs'}
        </button>
        
        {stuckUrls.length > 0 && (
          <button
            onClick={fixStuckUrls}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="w-4 h-4 text-white animate-spin mr-2" viewBox="0 0 100 101" fill="none">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                </svg>
                Fixing...
              </div>
            ) : `Mark ${stuckUrls.length} URL${stuckUrls.length > 1 ? 's' : ''} as Failed`}
          </button>
        )}
      </div>
      
      {/* Results message */}
      {results && (
        <div className={`p-4 mb-4 text-sm rounded-lg ${
          results.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="font-medium">{results.message}</p>
          {results.fixed && (
            <p className="mt-1">Fixed {results.fixed} URL{results.fixed !== 1 ? 's' : ''}</p>
          )}
          {results.details && (
            <p className="mt-1">{results.details}</p>
          )}
        </div>
      )}
      
      {/* List of stuck URLs */}
      {stuckUrls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Found {stuckUrls.length} stuck URL{stuckUrls.length > 1 ? 's' : ''}</h4>
          <div className="mt-2 bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stuckUrls.map((url) => (
                  <tr key={url.id}>
                    <td className="px-3 py-2 text-xs">
                      <div className="truncate max-w-[200px]" title={url.url}>
                        {url.title || url.url}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(url.created_at)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(url.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 