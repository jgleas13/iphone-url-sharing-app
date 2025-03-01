'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [url, setUrl] = useState('https://example.com');
  const [result, setResult] = useState<any>(null);
  const [directResult, setDirectResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directError, setDirectError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('processed'); // 'processed' or 'direct'
  
  const testBackendResponse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/debug?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (error) {
      console.error('Error testing backend:', error);
      setError('Failed to test backend connection');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };
  
  const testDirectBackendResponse = async () => {
    try {
      setDirectLoading(true);
      setDirectError(null);
      const response = await fetch(`/api/direct-test?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.error) {
        setDirectError(data.error);
        setDirectResult(null);
      } else {
        setDirectResult(data);
      }
    } catch (error) {
      console.error('Error testing direct backend:', error);
      setDirectError('Failed to test direct backend connection');
      setDirectResult(null);
    } finally {
      setDirectLoading(false);
    }
  };
  
  // Helper function to render nested objects with better formatting
  const renderNestedObject = (obj: any, level = 0) => {
    if (obj === null) return <span className="text-gray-500">null</span>;
    if (obj === undefined) return <span className="text-gray-500">undefined</span>;
    
    if (typeof obj !== 'object') {
      if (typeof obj === 'string') return <span className="text-green-600">"{obj}"</span>;
      if (typeof obj === 'number') return <span className="text-blue-600">{obj}</span>;
      if (typeof obj === 'boolean') return <span className="text-purple-600">{obj.toString()}</span>;
      return <span>{String(obj)}</span>;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span className="text-gray-500">[]</span>;
      
      return (
        <div style={{ marginLeft: `${level * 20}px` }}>
          [
          <div style={{ marginLeft: '20px' }}>
            {obj.map((item, index) => (
              <div key={index}>
                {renderNestedObject(item, level + 1)}
                {index < obj.length - 1 && ','}
              </div>
            ))}
          </div>
          ]
        </div>
      );
    }
    
    const keys = Object.keys(obj);
    if (keys.length === 0) return <span className="text-gray-500">{'{}'}</span>;
    
    return (
      <div style={{ marginLeft: `${level * 20}px` }}>
        {'{'}
        <div style={{ marginLeft: '20px' }}>
          {keys.map((key, index) => (
            <div key={key}>
              <span className="text-red-600">{key}</span>: {renderNestedObject(obj[key], level + 1)}
              {index < keys.length - 1 && ','}
            </div>
          ))}
        </div>
        {'}'}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Backend Response</h1>
      
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          URL to Test
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
            placeholder="https://example.com"
          />
          <button
            onClick={testBackendResponse}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Processed'}
          </button>
          <button
            onClick={testDirectBackendResponse}
            disabled={directLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {directLoading ? 'Testing...' : 'Test Direct'}
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('processed')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'processed'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Processed Response
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeTab === 'direct'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Direct Response
          </button>
        </nav>
      </div>
      
      {/* Processed Response Tab */}
      {activeTab === 'processed' && (
        <>
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Processed Result</h2>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-lg font-medium mb-2">Summary Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Response Type:</span> {result.responseType}</p>
                    <p><span className="font-medium">Is Array:</span> {result.isArray ? 'Yes' : 'No'}</p>
                    <p><span className="font-medium">Summary Location:</span> {result.summaryAnalysis?.location || 'Not found'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Summary Value Type:</span> {result.summaryAnalysis?.valueType || 'N/A'}</p>
                    <p><span className="font-medium">Summary Value:</span> {result.summaryAnalysis?.value || 'None'}</p>
                    <p><span className="font-medium">Top Level Keys:</span> {result.topLevelKeys?.join(', ') || 'None'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <h3 className="text-lg font-medium mb-2">Full Response Structure</h3>
                <div className="font-mono text-sm">
                  {renderNestedObject(result.responseData)}
                </div>
              </div>
              
              {result.nestedStructure && Object.keys(result.nestedStructure).length > 0 && (
                <div className="mt-4 bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  <h3 className="text-lg font-medium mb-2">Nested Structure Analysis</h3>
                  <div className="font-mono text-sm">
                    {renderNestedObject(result.nestedStructure)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Direct Response Tab */}
      {activeTab === 'direct' && (
        <>
          {directError && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p>{directError}</p>
            </div>
          )}
          
          {directResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Direct Backend Result</h2>
              
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-lg font-medium mb-2">Response Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Status:</span> {directResult.status}</p>
                    <p><span className="font-medium">Message:</span> {directResult.message}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                <h3 className="text-lg font-medium mb-2">Raw Response Data</h3>
                <div className="font-mono text-sm">
                  {renderNestedObject(directResult.data)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 