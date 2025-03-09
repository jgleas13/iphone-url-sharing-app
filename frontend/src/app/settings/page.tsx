'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import ServerNavigation from '@/components/ServerNavigation';

export default function Settings() {
  const { user, isLoading, getSession } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  const generateApiKey = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccessMessage(null);
      
      // In development mode, generate a mock API key
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_API_KEYS === 'true') {
        const mockApiKey = `ipus_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        setApiKey(mockApiKey);
        setShowApiKey(true);
        setSuccessMessage('API key generated successfully!');
        return;
      }
      
      // Get the current session
      const session = await getSession();
      if (!session) {
        throw new Error('No active session found');
      }
      
      // In production, call the backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-johngleason-outlookcoms-projects.vercel.app';
      const response = await fetch(`${backendUrl}/api/v1/api-keys/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to generate API key: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.apiKey) {
        throw new Error(data.message || 'Failed to generate API key');
      }
      
      setApiKey(data.apiKey);
      setShowApiKey(true);
      setSuccessMessage('API key generated successfully!');
    } catch (error) {
      console.error('Error generating API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate API key. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
        .then(() => {
          setSuccessMessage('API key copied to clipboard!');
          setTimeout(() => setSuccessMessage(null), 3000);
        })
        .catch(err => {
          console.error('Failed to copy API key:', err);
          setError('Failed to copy API key to clipboard.');
        });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={!!user} currentPath="/settings" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage your account settings and API keys
            </p>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                API Key Management
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Generate and manage API keys for use with the iOS Shortcut
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}
              
              {apiKey && showApiKey ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your API Key (copy this now, it won't be shown again)
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      readOnly
                      value={apiKey}
                      className="flex-grow shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Make sure to save this API key securely. For security reasons, we can't show it again.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={generateApiKey}
                  disabled={isGenerating}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isGenerating ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate New API Key'
                  )}
                </button>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">How to use your API key</h4>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                  <li>Generate a new API key using the button above.</li>
                  <li>Copy the API key and save it securely.</li>
                  <li>Use this API key in your iOS Shortcut as described in the <a href="/guide" className="text-indigo-600 hover:text-indigo-900">iOS Shortcut Setup Guide</a>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 