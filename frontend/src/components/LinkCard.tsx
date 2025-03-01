import { useState } from 'react';

interface LinkCardProps {
  id: string;
  url: string;
  pageTitle: string;
  dateAccessed: string;
  summary: string;
  processingStatus: string;
  tags: string[];
}

export default function LinkCard({
  id,
  url,
  pageTitle,
  dateAccessed,
  summary,
  processingStatus,
  tags
}: LinkCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format the date for display
  const formattedDate = new Date(dateAccessed).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
            {pageTitle}
          </h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 truncate">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
            {url}
          </a>
        </p>
      </div>
      
      {expanded && (
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Summary</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {summary || 'Summary unavailable'}
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Date Saved</dt>
              <dd className="mt-1 text-sm text-gray-900">{formattedDate}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  processingStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {processingStatus}
                </span>
              </dd>
            </div>
            
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length === 0 && <span className="text-gray-500">No tags</span>}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
} 