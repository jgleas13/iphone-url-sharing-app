'use client';

import React from 'react';

export interface UrlItem {
  id: string;
  url: string;
  status: string;
  created_at: string;
  updated_at: string;
  title?: string;
  error_details?: string;
}

interface PendingUrlsListProps {
  urls: UrlItem[];
  isLoading: boolean;
  onSelectUrl: (url: UrlItem) => void;
  selectedUrlId?: string;
}

export default function PendingUrlsList({ 
  urls, 
  isLoading, 
  onSelectUrl, 
  selectedUrlId 
}: PendingUrlsListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
        <h3 className="text-lg font-medium mb-4">Pending/Failed URLs</h3>
        <div className="flex justify-center items-center h-24">
          <svg className="w-6 h-6 text-gray-400 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
          </svg>
          <span className="ml-2 text-gray-500">Loading URLs...</span>
        </div>
      </div>
    );
  }

  if (!urls || urls.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
        <h3 className="text-lg font-medium mb-4">Pending/Failed URLs</h3>
        <div className="text-center text-gray-500 p-4">
          No pending or failed URLs found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mb-4">
      <h3 className="text-lg font-medium mb-4">Pending/Failed URLs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {urls.map((url) => (
              <tr 
                key={url.id} 
                className={`hover:bg-gray-50 ${selectedUrlId === url.id ? 'bg-blue-50' : ''}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    url.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : url.status === 'summarized' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                    {url.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="truncate max-w-[200px]" title={url.url}>
                    {url.url}
                  </div>
                  {url.title && (
                    <div className="text-gray-500 truncate max-w-[200px]" title={url.title}>
                      {url.title}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {formatDate(url.created_at)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                  {formatDate(url.updated_at)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium">
                  <button
                    onClick={() => onSelectUrl(url)}
                    className="text-indigo-600 hover:text-indigo-900 bg-transparent p-1 rounded hover:bg-indigo-50"
                  >
                    Diagnose
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 