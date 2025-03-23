'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';
import AddUrlForm from '../../components/AddUrlForm';

// Define the Url type based on our database schema
type Url = Database['public']['Tables']['urls']['Row'];

export default function Dashboard() {
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Url>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
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
      
      // Only fetch URLs that have been successfully summarized
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'summarized')
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
  
  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchUrls();
  };

  const handleSort = (field: keyof Url) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort URLs
  const filteredAndSortedUrls = [...urls]
    .filter(url => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        url.title?.toLowerCase().includes(searchLower) ||
        url.url.toLowerCase().includes(searchLower) ||
        url.summary?.toLowerCase().includes(searchLower) ||
        (url.tags && url.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
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
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">View your summarized content</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add URL
        </button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, URL, summary, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
          <h3 className="mb-2 text-xl font-medium">No summarized URLs found</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search' 
              : 'Add URLs and wait for them to be summarized'}
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
                <tr key={url.id} className="hover:bg-gray-50">
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <AddUrlForm 
          onSuccess={handleAddSuccess} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}
    </div>
  );
} 