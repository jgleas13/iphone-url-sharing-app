'use client';

import { useState } from 'react';

interface AddUrlFormProps {
  onUrlAdded: () => void;
}

export default function AddUrlForm({ onUrlAdded }: AddUrlFormProps) {
  const [url, setUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('URL is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          pageTitle: pageTitle || undefined,
          dateAccessed: new Date().toISOString(),
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error adding URL: ${response.statusText}`);
      }
      
      // Reset form
      setUrl('');
      setPageTitle('');
      setTags('');
      setSuccess(true);
      
      // Notify parent component
      onUrlAdded();
    } catch (error) {
      console.error('Error adding URL:', error);
      setError('Failed to add URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Add URL Manually</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a URL manually to save and summarize it. AI will automatically generate a title, summary, and tags if not provided.
          </p>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  URL *
                </label>
                <input
                  type="url"
                  name="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="https://example.com"
                  required
                />
              </div>
              
              <div className="col-span-6">
                <label htmlFor="page-title" className="block text-sm font-medium text-gray-700">
                  Page Title (optional)
                </label>
                <input
                  type="text"
                  name="page-title"
                  id="page-title"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Leave blank for AI-generated title"
                />
                <p className="mt-1 text-xs text-gray-500">
                  If left blank, an AI-generated title will be created based on the URL content.
                </p>
              </div>
              
              <div className="col-span-6">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                  Tags (optional, comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="technology, article, blog"
                />
              </div>
            </div>
            
            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">URL added successfully!</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Adding...' : 'Add URL'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 