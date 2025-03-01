'use client';

import { useState, useEffect } from 'react';
import LinkCard from './LinkCard';
import FilterSortBar from './FilterSortBar';
import AddUrlForm from './AddUrlForm';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

interface UrlEntry {
  id: string;
  url: string;
  pageTitle: string;
  dateAccessed: string;
  summary: string;
  processingStatus?: string;
  tags: string[];
}

export default function UrlList() {
  const { user, isLoading: authLoading } = useAuth();
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [filteredUrls, setFilteredUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Get all unique tags from the URLs
  const getAllTags = (urls: UrlEntry[]) => {
    const tagSet = new Set<string>();
    urls.forEach(url => {
      url.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };
  
  // Fetch URLs from the API
  const fetchUrls = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/urls');
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('You need to be logged in to view your URLs.');
          setLoading(false);
          return;
        }
        throw new Error(`Error fetching URLs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the data from database format to component format
      const transformedData = data.map((item: any) => ({
        id: item.id,
        url: item.url,
        pageTitle: item.page_title || item.url,
        dateAccessed: item.date_accessed || new Date().toISOString(),
        summary: item.summary || '',
        processingStatus: 'completed', // Default to completed since this field doesn't exist in DB
        tags: item.tags || []
      }));
      
      console.log('[UrlList] Transformed URL data:', JSON.stringify(transformedData.map((item: UrlEntry) => ({
        id: item.id,
        url: item.url,
        summary: item.summary
      })), null, 2));
      
      setUrls(transformedData);
      setFilteredUrls(transformedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError('Failed to fetch URLs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch URLs when user is authenticated
  useEffect(() => {
    if (user) {
      fetchUrls();
    }
  }, [user]);
  
  // Handle filter change
  const handleFilterChange = (selectedTags: string[]) => {
    if (selectedTags.length === 0) {
      setFilteredUrls(urls);
      return;
    }
    
    const filtered = urls.filter(url => {
      return selectedTags.some(tag => url.tags.includes(tag));
    });
    
    setFilteredUrls(filtered);
  };
  
  // Handle sort change
  const handleSortChange = (sortBy: string) => {
    const sorted = [...filteredUrls];
    
    switch (sortBy) {
      case 'dateAccessed':
        sorted.sort((a, b) => new Date(b.dateAccessed).getTime() - new Date(a.dateAccessed).getTime());
        break;
      case 'dateAccessed_asc':
        sorted.sort((a, b) => new Date(a.dateAccessed).getTime() - new Date(b.dateAccessed).getTime());
        break;
      case 'pageTitle':
        sorted.sort((a, b) => a.pageTitle.localeCompare(b.pageTitle));
        break;
      case 'pageTitle_desc':
        sorted.sort((a, b) => b.pageTitle.localeCompare(a.pageTitle));
        break;
      default:
        break;
    }
    
    setFilteredUrls(sorted);
  };
  
  // Handle URL added
  const handleUrlAdded = () => {
    fetchUrls();
  };
  
  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-gray-500 mb-4">Please log in to view and manage your saved URLs.</p>
        <Link href="/auth/login" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Go to Login
        </Link>
      </div>
    );
  }
  
  if (loading && urls.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error && urls.length === 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
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
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showAddForm ? 'Hide Form' : 'Add URL Manually'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="mb-8">
          <AddUrlForm onUrlAdded={handleUrlAdded} />
        </div>
      )}
      
      {urls.length > 0 ? (
        <>
          <FilterSortBar
            availableTags={getAllTags(urls)}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
          
          <div className="mt-8 space-y-6">
            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            
            {filteredUrls.map(url => (
              <LinkCard
                key={url.id}
                id={url.id}
                url={url.url}
                pageTitle={url.pageTitle}
                dateAccessed={url.dateAccessed}
                summary={url.summary}
                processingStatus={url.processingStatus || 'completed'}
                tags={url.tags}
              />
            ))}
            
            {filteredUrls.length === 0 && !loading && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500">No URLs match the selected filters.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <p className="text-gray-500">No URLs saved yet. Share a URL from your iPhone or add one manually to get started.</p>
        </div>
      )}
    </div>
  );
} 