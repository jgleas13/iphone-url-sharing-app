'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import RetryProcessingButton from '../../components/RetryProcessingButton';
import DebugRetryButton from '../../components/DebugRetryButton';

// Define the Url type based on our database schema
type Url = Database['public']['Tables']['urls']['Row'];

// Extended URL type with debug information
interface UrlWithDebug extends Url {
  debug_info?: {
    api_request?: string;
    api_response?: string;
    processing_steps?: string[];
    error_details?: string;
    processing_time?: number;
  };
  showDebug?: boolean;
}

export default function UrlTracker() {
  const [urls, setUrls] = useState<UrlWithDebug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Url>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [loadingDebugInfo, setLoadingDebugInfo] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    fetchUrls();
  }, []);
  
  async function fetchUrls() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to view your URLs');
      }
      
      // Fetch all URLs regardless of status
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Initialize URLs with debug flag
      const urlsWithDebug = (data || []).map(url => ({
        ...url,
        showDebug: false
      }));
      
      setUrls(urlsWithDebug);
      console.log('URLs refreshed successfully', data?.length);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError('Failed to load URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (field: keyof Url) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle debug information display
  const toggleDebugInfo = async (urlId: string) => {
    const updatedUrls = [...urls];
    const urlIndex = updatedUrls.findIndex(url => url.id === urlId);
    
    if (urlIndex === -1) return;
    
    // Toggle the debug panel
    updatedUrls[urlIndex].showDebug = !updatedUrls[urlIndex].showDebug;
    
    // If opening and no debug info yet, fetch it
    if (updatedUrls[urlIndex].showDebug && !updatedUrls[urlIndex].debug_info) {
      try {
        setLoadingDebugInfo(prev => ({ ...prev, [urlId]: true }));
        
        // Fetch debug information from the API
        const response = await fetch(`/api/urls/${urlId}/debug`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch debug information');
        }
        
        const debugData = await response.json();
        
        // Update the URL with debug information
        updatedUrls[urlIndex].debug_info = {
          api_request: debugData.api_request || 'No API request data available',
          api_response: debugData.api_response || 'No API response data available',
          processing_steps: debugData.processing_steps || ['No processing steps recorded'],
          error_details: debugData.error_details || 'No error details available',
          processing_time: debugData.processing_time || 0
        };
      } catch (error) {
        console.error('Error fetching debug info:', error);
        updatedUrls[urlIndex].debug_info = {
          error_details: 'Failed to load debug information. API endpoint may not be implemented yet.'
        };
      } finally {
        setLoadingDebugInfo(prev => ({ ...prev, [urlId]: false }));
      }
    }
    
    setUrls(updatedUrls);
  };

  // Filter and sort URLs
  const filteredAndSortedUrls = [...urls]
    .filter(url => {
      if (!searchTerm && statusFilter === 'all') return true;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        url.title?.toLowerCase().includes(searchLower) ||
        url.url.toLowerCase().includes(searchLower) ||
        url.summary?.toLowerCase().includes(searchLower) ||
        (url.tags && url.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
      
      const matchesStatus = statusFilter === 'all' || url.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      
      if (fieldA === null) return sortDirection === 'asc' ? -1 : 1;
      if (fieldB === null) return sortDirection === 'asc' ? 1 : -1;
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      // Default sort for other types
      return sortDirection === 'asc'
        ? (fieldA < fieldB ? -1 : 1)
        : (fieldB < fieldA ? -1 : 1);
    });

  // Get counts for each status
  const statusCounts = urls.reduce((acc, url) => {
    acc[url.status] = (acc[url.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Render debug information panel
  const renderDebugPanel = (url: UrlWithDebug) => {
    if (!url.showDebug) return null;
    
    if (loadingDebugInfo[url.id]) {
      return (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-6 py-4">
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading debug information...</span>
            </div>
          </td>
        </tr>
      );
    }
    
    const debugInfo = url.debug_info || {
      api_request: 'No data available',
      api_response: 'No data available',
      processing_steps: ['No steps recorded'],
      error_details: url.status === 'failed' ? 'Processing failed' : 'No errors',
      processing_time: 0
    };
    
    // Determine which AI service was used based on the API request content
    let aiProvider = "AI";

    // Try to determine from the request data if available
    if (debugInfo.api_request) {
      try {
        const requestData = JSON.parse(debugInfo.api_request);
        if (requestData.model?.includes('grok')) {
          aiProvider = "Grok";
        } else if (requestData.model?.includes('gpt')) {
          aiProvider = "OpenAI";
        }
      } catch (e) {
        // If parsing fails, keep the default name
        console.error("Failed to parse API request data", e);
      }
    }

    // If still not determined, check processing steps
    if (aiProvider === "AI") {
      const steps = debugInfo.processing_steps || [];
      if (steps.some(step => step.toLowerCase().includes('grok'))) {
        aiProvider = "Grok";
      } else if (steps.some(step => step.toLowerCase().includes('openai'))) {
        aiProvider = "OpenAI";
      }
    }

    // For pending URLs, check if the URL might be in the mock data mode
    // and the server has indicated which model it's using
    if (url.status === 'pending' && aiProvider === "AI") {
      // Look for hints in the processing steps about which provider is configured
      const steps = debugInfo.processing_steps || [];
      const lastStep = steps[steps.length - 1] || '';
      
      // If the last step mentions waiting for processing and we have no clear indicator,
      // we'll make an educated guess based on any hints in the steps
      if (lastStep.toLowerCase().includes('waiting') || lastStep.toLowerCase().includes('queue')) {
        // Default to Grok if we specified USE_GROK=true in our changes
        aiProvider = "Grok";
      }
    }
    
    return (
      <tr className="bg-gray-50">
        <td colSpan={6} className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Processing Timeline</h4>
              <div className="mt-2 rounded-md bg-gray-100 p-3">
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {debugInfo.processing_steps?.map((step, index) => (
                    <li key={index}>{step}</li>
                  )) || <li>No processing steps recorded</li>}
                  {debugInfo.processing_time && (
                    <li className="font-medium">
                      Total processing time: {debugInfo.processing_time}ms
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">{aiProvider} API Request</h4>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-3">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {debugInfo.api_request || 'No API request data available'}
                </pre>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">{aiProvider} API Response</h4>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md bg-gray-100 p-3">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {debugInfo.api_response || 'No API response data available'}
                </pre>
              </div>
            </div>
            
            {url.status === 'failed' && (
              <div>
                <h4 className="font-medium text-red-700">Error Details</h4>
                <div className="mt-2 rounded-md bg-red-50 p-3">
                  <pre className="text-xs text-red-800 whitespace-pre-wrap">
                    {debugInfo.error_details || 'No detailed error information available'}
                  </pre>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleDebugInfo(url.id)}
                  className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Close Debug View
                </button>
                
                {(url.status === 'pending' || url.status === 'failed') && (
                  <DebugRetryButton urlId={url.id} />
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">URL Tracker</h1>
        <p className="text-gray-600">Track all your URLs and their processing status</p>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title, URL, summary, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses ({urls.length})</option>
            <option value="pending">Pending ({statusCounts['pending'] || 0})</option>
            <option value="summarized">Summarized ({statusCounts['summarized'] || 0})</option>
            <option value="failed">Failed ({statusCounts['failed'] || 0})</option>
            <option value="manual">Manual ({statusCounts['manual'] || 0})</option>
          </select>
          
          <button
            onClick={fetchUrls}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </span>
            )}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : filteredAndSortedUrls.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h3 className="mb-2 text-xl font-medium">No URLs found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Share your first URL from your iPhone to get started'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Title
                    {sortField === 'title' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => handleSort('url')}
                >
                  <div className="flex items-center">
                    URL
                    {sortField === 'url' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Date Added
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tags
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAndSortedUrls.map((url) => (
                <React.Fragment key={url.id}>
                  <tr 
                    className={`hover:bg-gray-50 ${url.showDebug ? 'bg-blue-50' : ''}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <a 
                        href={url.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {url.title || 'Untitled Page'}
                      </a>
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                      <a 
                        href={url.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {url.url}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(url.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          url.status === 'summarized' ? 'bg-green-100 text-green-800' :
                          url.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {url.status === 'summarized' ? 'Summarized' :
                           url.status === 'failed' ? 'Failed' :
                           'Pending'}
                        </span>
                        {(url.status === 'pending' || url.status === 'failed') && (
                          <RetryProcessingButton urlId={url.id} onSuccess={fetchUrls} />
                        )}
                        <button
                          onClick={() => toggleDebugInfo(url.id)}
                          className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          title="Toggle debug information"
                        >
                          {url.showDebug ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {url.tags && url.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {url.tags.map((tag, i) => (
                            <span key={i} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No tags</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-md">
                        {url.summary || 'No summary available'}
                      </div>
                    </td>
                  </tr>
                  {renderDebugPanel(url)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 