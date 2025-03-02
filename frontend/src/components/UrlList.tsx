'use client';

import { useState, useEffect, Fragment } from 'react';
import LinkCard from './LinkCard';
import FilterSortBar from './FilterSortBar';
import AddUrlForm from './AddUrlForm';
import UrlDetailsModal from './UrlDetailsModal';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

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
  const [selectedUrl, setSelectedUrl] = useState<UrlEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
  
  // Handle opening the details modal
  const openDetailsModal = (url: UrlEntry) => {
    setSelectedUrl(url);
    setIsModalOpen(true);
  };
  
  // Handle closing the details modal
  const closeDetailsModal = () => {
    setIsModalOpen(false);
    setSelectedUrl(null);
  };
  
  // Handle URL deletion
  const handleDeleteUrl = async (id: string) => {
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting URL: ${response.statusText}`);
      }
      
      // Remove the deleted URL from the state
      const updatedUrls = urls.filter(url => url.id !== id);
      setUrls(updatedUrls);
      setFilteredUrls(filteredUrls.filter(url => url.id !== id));
      
      // Show success message (you could add a toast notification here)
      console.log('URL deleted successfully');
    } catch (error) {
      console.error('Error deleting URL:', error);
      // Show error message (you could add a toast notification here)
    }
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
          
          <div className="mt-8">
            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            
            {filteredUrls.length > 0 && !loading && (
              <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">URL</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Date Saved</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">Tags</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredUrls.map(url => {
                      // Format the date for display
                      const formattedDate = url.dateAccessed ? new Date(url.dateAccessed).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Unknown date';
                      
                      return (
                        <tr 
                          key={url.id} 
                          className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                        >
                          <td 
                            className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                            onClick={() => openDetailsModal(url)}
                          >
                            <div className="max-w-xs truncate">{url.pageTitle}</div>
                            <div className="text-xs text-gray-500 mt-1 md:hidden truncate">{url.url}</div>
                          </td>
                          <td 
                            className="px-3 py-4 text-sm hidden md:table-cell"
                            onClick={() => openDetailsModal(url)}
                          >
                            <a 
                              href={url.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-600 hover:text-indigo-900 truncate max-w-xs inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="max-w-xs truncate">{url.url}</div>
                            </a>
                          </td>
                          <td 
                            className="px-3 py-4 text-sm text-gray-500 hidden sm:table-cell"
                            onClick={() => openDetailsModal(url)}
                          >
                            {formattedDate}
                          </td>
                          <td 
                            className="px-3 py-4 text-sm text-gray-500 hidden lg:table-cell"
                            onClick={() => openDetailsModal(url)}
                          >
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              url.processingStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {url.processingStatus || 'completed'}
                            </span>
                          </td>
                          <td 
                            className="px-3 py-4 text-sm text-gray-500 hidden lg:table-cell"
                            onClick={() => openDetailsModal(url)}
                          >
                            <div className="flex flex-wrap gap-1">
                              {url.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {url.tags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{url.tags.length - 3}
                                </span>
                              )}
                              {url.tags.length === 0 && <span className="text-gray-400">No tags</span>}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 text-right relative">
                            <div className="relative inline-block text-left">
                              <Menu>
                                <Menu.Button 
                                  className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="sr-only">Open options</span>
                                  <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                                </Menu.Button>
                                <Transition
                                  as={Fragment}
                                  enter="transition ease-out duration-100"
                                  enterFrom="transform opacity-0 scale-95"
                                  enterTo="transform opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="transform opacity-100 scale-100"
                                  leaveTo="transform opacity-0 scale-95"
                                >
                                  <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1">
                                      <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openDetailsModal(url);
                                            }}
                                            className={`${
                                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                            } block w-full text-left px-4 py-2 text-sm`}
                                          >
                                            View Details
                                          </button>
                                        )}
                                      </Menu.Item>
                                      <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteUrl(url.id);
                                            }}
                                            className={`${
                                              active ? 'bg-red-50 text-red-700' : 'text-red-600'
                                            } block w-full text-left px-4 py-2 text-sm`}
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </div>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
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
      
      {/* URL Details Modal */}
      <UrlDetailsModal
        isOpen={isModalOpen}
        onClose={closeDetailsModal}
        onDelete={handleDeleteUrl}
        url={selectedUrl}
      />
    </div>
  );
} 