'use client';

import React from 'react';

interface ProcessingLog {
  id: string;
  url_id: string;
  type: string;
  message: string;
  data?: string;
  created_at: string;
}

interface ProcessingLogViewerProps {
  logs: ProcessingLog[];
  isLoading: boolean;
}

export default function ProcessingLogViewer({ logs, isLoading }: ProcessingLogViewerProps) {
  // Function to format timestamps
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString();
  };
  
  // Function to determine log icon and colors
  const getLogTypeStyles = (type: string) => {
    switch (type) {
      case 'info':
        return {
          iconClass: 'text-blue-500',
          icon: 'ℹ️',
          bgClass: 'bg-blue-50'
        };
      case 'error':
        return {
          iconClass: 'text-red-500',
          icon: '❌',
          bgClass: 'bg-red-50'
        };
      case 'api_request':
        return {
          iconClass: 'text-purple-500',
          icon: '⬆️',
          bgClass: 'bg-purple-50'
        };
      case 'api_response':
        return {
          iconClass: 'text-green-500',
          icon: '⬇️',
          bgClass: 'bg-green-50'
        };
      case 'raw_response':
        return {
          iconClass: 'text-yellow-500',
          icon: '📦',
          bgClass: 'bg-yellow-50'
        };
      default:
        return {
          iconClass: 'text-gray-500',
          icon: '📝',
          bgClass: 'bg-gray-50'
        };
    }
  };
  
  // Function to display log data in a readable format
  const renderLogData = (log: ProcessingLog) => {
    if (!log.data) return null;
    
    try {
      const data = JSON.parse(log.data);
      
      if (log.type === 'api_request' || log.type === 'api_response' || log.type === 'raw_response') {
        return (
          <pre className="mt-2 p-2 bg-gray-800 text-white rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
      }
      
      return (
        <div className="mt-2 text-xs text-gray-600">
          {typeof data === 'object' ? JSON.stringify(data) : data.toString()}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-2 text-xs text-gray-600">
          {log.data}
        </div>
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="flex justify-center items-center h-40">
          <svg className="w-8 h-8 text-gray-400 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-2 text-gray-500">Loading logs...</span>
        </div>
      </div>
    );
  }
  
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
        <div className="text-center text-gray-500 p-4">
          No processing logs found for this URL.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Processing Logs</h3>
      
      <div className="space-y-2 max-h-[600px] overflow-y-auto p-2">
        {logs.map((log) => {
          const { icon, bgClass } = getLogTypeStyles(log.type);
          
          return (
            <div 
              key={log.id} 
              className={`p-3 rounded-lg border border-gray-200 ${bgClass}`}
            >
              <div className="flex items-start">
                <div className="mr-2">{icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm capitalize">
                      {log.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{log.message}</p>
                  {renderLogData(log)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 