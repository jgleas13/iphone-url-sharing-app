'use client';

import React from 'react';

interface EnvironmentInfoProps {
  envInfo: {
    nodeEnv?: string;
    useGrok?: boolean;
    hasGrokApiKey?: boolean;
    grokModel?: string;
    hasOpenAIApiKey?: boolean;
    [key: string]: any;
  };
  isLoading: boolean;
}

export default function EnvironmentInfo({ envInfo, isLoading }: EnvironmentInfoProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
        <h3 className="text-lg font-medium mb-4">Environment</h3>
        <div className="flex justify-center items-center h-24">
          <svg className="w-6 h-6 text-gray-400 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-2 text-gray-500">Loading environment info...</span>
        </div>
      </div>
    );
  }
  
  if (!envInfo || Object.keys(envInfo).length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
        <h3 className="text-lg font-medium mb-4">Environment</h3>
        <div className="text-center text-gray-500 p-4">
          No environment information available.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
      <h3 className="text-lg font-medium mb-4">Environment</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Node Environment</h4>
          <p className="text-sm">
            {envInfo.nodeEnv || 'Not set'}
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">API Configuration</h4>
          <div className="space-y-1">
            <p className="text-sm flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${envInfo.useGrok ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Use Grok: {envInfo.useGrok ? 'Yes' : 'No'}
            </p>
            <p className="text-sm flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${envInfo.hasGrokApiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Grok API Key: {envInfo.hasGrokApiKey ? 'Set' : 'Not set'}
            </p>
            {envInfo.grokModel && (
              <p className="text-sm flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2 bg-blue-500"></span>
                Grok Model: {envInfo.grokModel}
              </p>
            )}
            <p className="text-sm flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${envInfo.hasOpenAIApiKey ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              OpenAI API Key: {envInfo.hasOpenAIApiKey ? 'Set' : 'Not set'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Show any additional environment variables */}
      {Object.entries(envInfo).filter(([key]) => 
        !['nodeEnv', 'useGrok', 'hasGrokApiKey', 'grokModel', 'hasOpenAIApiKey'].includes(key)
      ).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Environment Variables</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(envInfo)
                .filter(([key]) => !['nodeEnv', 'useGrok', 'hasGrokApiKey', 'grokModel', 'hasOpenAIApiKey'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="font-medium text-xs text-gray-600 mr-2">{key}:</span>
                    <span className="text-xs">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 