'use client';

import React, { useState } from 'react';

interface UrlInfo {
  id: string;
  url: string;
  status: string;
  title?: string;
  summary?: string;
  tags?: string[];
  key_points?: string[];
  error_details?: string;
  debug_info?: any;
  created_at: string;
  updated_at: string;
}

interface UrlDebugInfoProps {
  urlInfo: UrlInfo | null;
  isLoading: boolean;
}

export default function UrlDebugInfo({ urlInfo, isLoading }: UrlDebugInfoProps) {
  const [activeTab, setActiveTab] = useState('summary');
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  const renderDebugInfo = () => {
    if (!urlInfo?.debug_info) {
      return <p className="text-gray-500">No debug information available.</p>;
    }
    
    return (
      <div className="space-y-4">
        {urlInfo.debug_info.processing_steps && (
          <div>
            <h4 className="text-md font-medium mb-2">Processing Steps</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {urlInfo.debug_info.processing_steps.map((step: string, index: number) => (
                <li key={index} className="text-gray-700">{step}</li>
              ))}
            </ul>
            {urlInfo.debug_info.processing_time && (
              <p className="text-xs text-gray-500 mt-2">
                Processing time: {urlInfo.debug_info.processing_time}ms
              </p>
            )}
          </div>
        )}
        
        {urlInfo.debug_info.api_request && (
          <div>
            <h4 className="text-md font-medium mb-2">API Request</h4>
            <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto">
              {JSON.stringify(urlInfo.debug_info.api_request, null, 2)}
            </pre>
          </div>
        )}
        
        {urlInfo.debug_info.api_response && (
          <div>
            <h4 className="text-md font-medium mb-2">API Response</h4>
            <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto max-h-60 overflow-y-auto">
              {JSON.stringify(urlInfo.debug_info.api_response, null, 2)}
            </pre>
          </div>
        )}
        
        {urlInfo.debug_info.raw_response && (
          <div>
            <h4 className="text-md font-medium mb-2">Raw API Response</h4>
            <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto max-h-60 overflow-y-auto">
              {typeof urlInfo.debug_info.raw_response === 'string' 
                ? urlInfo.debug_info.raw_response 
                : JSON.stringify(urlInfo.debug_info.raw_response, null, 2)}
            </pre>
          </div>
        )}
        
        {urlInfo.debug_info.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-md font-medium mb-2 text-red-700">Error</h4>
            <p className="text-sm text-red-700">{urlInfo.debug_info.error}</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderSummaryInfo = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium mb-2">Title</h4>
          <p className="text-gray-700">{urlInfo?.title || 'No title'}</p>
        </div>
        
        <div>
          <h4 className="text-md font-medium mb-2">Summary</h4>
          <p className="text-gray-700 whitespace-pre-line">{urlInfo?.summary || 'No summary'}</p>
        </div>
        
        {urlInfo?.tags && urlInfo.tags.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {urlInfo.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {urlInfo?.key_points && urlInfo.key_points.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-2">Key Points</h4>
            <ul className="list-disc pl-5 space-y-1">
              {urlInfo.key_points.map((point, index) => (
                <li key={index} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <svg className="w-8 h-8 text-gray-400 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-2 text-gray-500">Loading URL info...</span>
        </div>
      </div>
    );
  }
  
  if (!urlInfo) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="text-center text-gray-500 p-4">
          Select a URL to view its information.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium">URL Details</h3>
        <p className="text-sm text-gray-500 mt-1 break-all">{urlInfo.url}</p>
        
        <div className="flex justify-between items-center mt-2">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              urlInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              urlInfo.status === 'summarized' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {urlInfo.status}
            </span>
            {urlInfo.error_details && (
              <span className="ml-2 text-xs text-red-600">{urlInfo.error_details}</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            <div>Created: {formatDate(urlInfo.created_at)}</div>
            <div>Updated: {formatDate(urlInfo.updated_at)}</div>
          </div>
        </div>
      </div>
      
      <div className="p-1 border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'summary' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'debug' 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('debug')}
          >
            Debug Info
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {activeTab === 'summary' ? renderSummaryInfo() : renderDebugInfo()}
      </div>
    </div>
  );
} 