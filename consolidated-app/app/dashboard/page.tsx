'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Url {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  created_at: string;
  user_id: string;
  tags: string[] | null;
  status: 'pending' | 'summarized' | 'failed';
}

export default function Dashboard() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
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
      
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setUrls(data || []);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError('Failed to load URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  
  // Filter URLs based on search term and status
  const filteredUrls = urls.filter(url => {
    const matchesSearch = 
      url.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      url.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (url.tags && url.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = statusFilter === 'all' || url.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Your Saved URLs</h1>
        <p className="text-gray-600">View and manage your saved content</p>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title, URL, or summary..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="summarized">Summarized</option>
            <option value="failed">Failed</option>
          </select>
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
      ) : filteredUrls.length === 0 ? (
        <div className="rounded-lg bg-gray-50 p-8 text-center">
          <h3 className="mb-2 text-xl font-medium">No URLs found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Share your first URL from your iPhone to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUrls.map((url) => (
            <div 
              key={url.id} 
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-shadow hover:shadow-md"
            >
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-medium">
                    <a 
                      href={url.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {url.title || 'Untitled Page'}
                    </a>
                  </h3>
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${
                    url.status === 'summarized' ? 'bg-green-100 text-green-800' :
                    url.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {url.status === 'summarized' ? 'Summarized' :
                     url.status === 'failed' ? 'Failed' :
                     'Pending'}
                  </span>
                </div>
                
                <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                  {url.url}
                </p>
                
                <div className="mb-2">
                  {expandedUrl === url.id ? (
                    <p className="text-sm text-gray-700">
                      {url.summary || 'No summary available.'}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {url.summary || 'No summary available.'}
                    </p>
                  )}
                  
                  {url.summary && (
                    <button
                      onClick={() => setExpandedUrl(expandedUrl === url.id ? null : url.id)}
                      className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {expandedUrl === url.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
                
                {url.tags && url.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {url.tags.map((tag, i) => (
                      <span key={i} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  {new Date(url.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link 
          href="/settings"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Manage API Key
        </Link>
      </div>
    </div>
  );
} 