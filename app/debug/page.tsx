'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [envVars, setEnvVars] = useState<any>(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState('https://example.com');
  const [urlProcessingResult, setUrlProcessingResult] = useState<any>(null);
  const [urlProcessingError, setUrlProcessingError] = useState<string | null>(null);
  const [urlProcessingLoading, setUrlProcessingLoading] = useState(false);
  const [urlId, setUrlId] = useState<string | null>(null);
  const [processingLogs, setProcessingLogs] = useState<any[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  
  useEffect(() => {
    checkAuth();
    fetchApiKey();
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
  
  async function checkAuth() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function fetchApiKey() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching API key:', error);
        return;
      }
      
      setApiKey(data?.key || null);
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  }
  
  async function testOpenAI() {
    try {
      setTestLoading(true);
      setTestResult(null);
      setTestError(null);
      
      const response = await fetch('/api/test-openai');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to test OpenAI');
      }
      
      setTestResult(data);
      setEnvVars(data.environment);
    } catch (error: any) {
      console.error('Error testing OpenAI:', error);
      setTestError(error.message);
    } finally {
      setTestLoading(false);
    }
  }
  
  async function checkEnvironment() {
    try {
      setEnvLoading(true);
      setEnvError(null);
      
      const response = await fetch('/api/test-env');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to check environment');
      }
      
      setEnvVars(data.environment);
    } catch (error: any) {
      console.error('Error checking environment:', error);
      setEnvError(error.message);
    } finally {
      setEnvLoading(false);
    }
  }
  
  async function processUrl() {
    try {
      if (!apiKey) {
        throw new Error('No API key found. Please generate an API key in Settings first.');
      }
      
      if (!testUrl) {
        throw new Error('Please enter a URL to process');
      }
      
      setUrlProcessingLoading(true);
      setUrlProcessingResult(null);
      setUrlProcessingError(null);
      setUrlId(null);
      setProcessingLogs([]);
      
      // Stop any existing polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Make the API request to process the URL
      const response = await fetch('/api/receive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          apiKey: apiKey,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process URL');
      }
      
      setUrlProcessingResult(data);
      setUrlId(data.url_id);
      
      // Start polling for processing logs
      const interval = setInterval(() => {
        if (data.url_id) {
          fetchProcessingLogs(data.url_id);
        }
      }, 2000); // Poll every 2 seconds
      
      setPollingInterval(interval);
      
    } catch (error: any) {
      console.error('Error processing URL:', error);
      setUrlProcessingError(error.message);
    } finally {
      setUrlProcessingLoading(false);
    }
  }
  
  async function fetchProcessingLogs(id: string) {
    try {
      const response = await fetch(`/api/urls/${id}/debug`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching logs:', data.error);
        return;
      }
      
      setProcessingLogs(data.processing_steps || []);
      
      // Check if processing is complete
      const isComplete = data.processing_steps?.some((step: string) => 
        step.includes('completed successfully') || step.includes('failed')
      );
      
      if (isComplete && pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
        
        // Fetch the URL details to show the final result
        const urlResponse = await fetch(`/api/urls/${id}`);
        const urlData = await urlResponse.json();
        
        if (urlResponse.ok) {
          setUrlProcessingResult({
            ...urlProcessingResult,
            finalStatus: urlData.status,
            summary: urlData.summary,
            tags: urlData.tags,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching processing logs:', error);
    }
  }
  
  async function cleanupStuckUrls() {
    try {
      setCleanupLoading(true);
      setCleanupResult(null);
      setCleanupError(null);
      
      const response = await fetch('/api/urls/cleanup');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to clean up stuck URLs');
      }
      
      setCleanupResult(data);
    } catch (error: any) {
      console.error('Error cleaning up stuck URLs:', error);
      setCleanupError(error.message);
    } finally {
      setCleanupLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
          <p>You must be logged in to access this page.</p>
          <a 
            href="/auth/login" 
            className="mt-2 inline-block font-medium text-blue-600 hover:underline"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">API Integration Debug</h1>
      
      <div className="mb-8 space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Test URL Processing</h2>
          <p className="mb-4 text-gray-600">
            Enter a URL to test the full processing flow, including OpenAI summarization.
          </p>
          
          <div className="mb-4">
            <label htmlFor="test-url" className="mb-2 block text-sm font-medium text-gray-700">
              URL to Process
            </label>
            <input
              id="test-url"
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <div className="flex">
              <input
                type="password"
                readOnly
                value={apiKey || "No API key found"}
                className="flex-1 rounded-l-md border border-gray-300 bg-gray-50 p-2 text-gray-500"
              />
              <a
                href="/settings"
                className="rounded-r-md border border-l-0 border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Manage
              </a>
            </div>
          </div>
          
          <button
            onClick={processUrl}
            disabled={urlProcessingLoading || !apiKey}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
          >
            {urlProcessingLoading ? (
              <span className="flex items-center">
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Processing...
              </span>
            ) : 'Process URL'}
          </button>
        </div>
        
        {urlProcessingError && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <h3 className="mb-2 font-medium">Error Processing URL</h3>
            <p>{urlProcessingError}</p>
          </div>
        )}
        
        {urlProcessingResult && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h3 className="mb-2 text-lg font-medium">URL Processing Result</h3>
            
            <div className="mb-4 rounded bg-gray-100 p-3">
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(urlProcessingResult, null, 2)}
              </pre>
            </div>
            
            {urlId && (
              <div className="mb-4">
                <h4 className="mb-2 font-medium">Processing Logs</h4>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  {processingLogs.length > 0 ? (
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {processingLogs.map((log, index) => (
                        <li key={index} className="text-gray-700">{log}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      {pollingInterval ? 'Waiting for processing logs...' : 'No processing logs available'}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {urlProcessingResult.finalStatus && (
              <div>
                <h4 className="mb-2 font-medium">Final Result</h4>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      urlProcessingResult.finalStatus === 'summarized' ? 'bg-green-100 text-green-800' :
                      urlProcessingResult.finalStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {urlProcessingResult.finalStatus}
                    </span>
                  </p>
                  
                  {urlProcessingResult.summary && (
                    <div>
                      <p className="font-medium">Summary:</p>
                      <p className="rounded bg-gray-100 p-2 text-sm">{urlProcessingResult.summary}</p>
                    </div>
                  )}
                  
                  {urlProcessingResult.tags && urlProcessingResult.tags.length > 0 && (
                    <div>
                      <p className="font-medium">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {urlProcessingResult.tags.map((tag: string, i: number) => (
                          <span key={i} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Cleanup Stuck URLs</h2>
        <p className="mb-4 text-gray-600">
          This will find URLs that have been in &quot;pending&quot; status for more than 10 minutes
          and mark them as &quot;failed&quot;.
        </p>
        
        <div className="mb-4">
          <button
            onClick={cleanupStuckUrls}
            disabled={cleanupLoading || !isLoggedIn}
            className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {cleanupLoading ? 'Cleaning up...' : 'Cleanup Stuck URLs'}
          </button>
        </div>
        
        {cleanupError && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            <h3 className="mb-2 font-semibold">Error</h3>
            <p>{cleanupError}</p>
          </div>
        )}
        
        {cleanupResult && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">Result</h3>
            <p className="mb-2">
              {cleanupResult.message}
            </p>
            {cleanupResult.count > 0 && (
              <div>
                <h4 className="mb-1 font-medium">Updated URLs:</h4>
                <ul className="list-inside list-disc">
                  {cleanupResult.urls.map((url: any) => (
                    <li key={url.id}>
                      {url.url} (ID: {url.id})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={checkEnvironment}
          disabled={envLoading}
          className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
        >
          {envLoading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Checking...
            </span>
          ) : 'Check Environment Variables'}
        </button>
        
        <button
          onClick={testOpenAI}
          disabled={testLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
        >
          {testLoading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Testing...
            </span>
          ) : 'Test OpenAI Integration'}
        </button>
      </div>
      
      {envError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          <h2 className="mb-2 text-xl font-semibold">Environment Error</h2>
          <p>{envError}</p>
        </div>
      )}
      
      {envVars && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
          <h2 className="mb-2 text-xl font-semibold">Environment Variables</h2>
          <div className="overflow-x-auto">
            <pre className="rounded bg-gray-100 p-3 text-sm">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {testError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          <h2 className="mb-2 text-xl font-semibold">OpenAI Test Error</h2>
          <p>{testError}</p>
        </div>
      )}
      
      {testResult && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
            <h2 className="mb-2 text-xl font-semibold">OpenAI Request</h2>
            <div className="overflow-x-auto">
              <pre className="rounded bg-gray-100 p-3 text-sm">
                {JSON.stringify(testResult.request, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
            <h2 className="mb-2 text-xl font-semibold">OpenAI Response</h2>
            <div className="overflow-x-auto">
              <pre className="rounded bg-gray-100 p-3 text-sm">
                {JSON.stringify(testResult.response, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
            <h2 className="mb-2 text-xl font-semibold">Generated Content</h2>
            <div className="rounded bg-gray-100 p-3">
              <p className="whitespace-pre-wrap">{testResult.response.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 