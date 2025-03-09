'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

export default function Settings() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
  useEffect(() => {
    fetchUserAndApiKey();
  }, []);
  
  async function fetchUserAndApiKey() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to view settings');
      }
      
      setUser(session.user);
      
      // Fetch API key
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }
      
      setApiKey(data?.key || null);
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError('Failed to load your settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  
  async function regenerateApiKey() {
    try {
      setRegenerating(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a new API key
      const newKey = Array.from(
        { length: 32 },
        () => Math.floor(Math.random() * 36).toString(36)
      ).join('');
      
      // Delete existing key
      if (apiKey) {
        await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id);
      }
      
      // Insert new key
      const { error } = await supabase
        .from('api_keys')
        .insert([
          { user_id: user.id, key: newKey }
        ]);
      
      if (error) {
        throw error;
      }
      
      setApiKey(newKey);
    } catch (error) {
      console.error('Error regenerating API key:', error);
      setError('Failed to regenerate API key. Please try again later.');
    } finally {
      setRegenerating(false);
    }
  }
  
  function copyApiKey() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and API key</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-medium">Account Information</h2>
            
            {user && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{user.email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-sm font-mono">{user.id}</p>
                </div>
                
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/';
                  }}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-medium">API Key</h2>
            <p className="mb-4 text-sm text-gray-600">
              This API key is used to authenticate requests from your iOS shortcut. Keep it secure.
            </p>
            
            {apiKey ? (
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex overflow-hidden rounded-md border border-gray-300 bg-gray-50">
                    <input
                      type="text"
                      value={apiKey}
                      readOnly
                      className="w-full bg-gray-50 p-2 font-mono text-sm"
                    />
                    <button
                      onClick={copyApiKey}
                      className="border-l border-gray-300 bg-white px-4 text-gray-600 hover:bg-gray-50"
                    >
                      {showCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={regenerateApiKey}
                  disabled={regenerating}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate API Key'}
                </button>
                
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p>Warning: Regenerating your API key will invalidate your current key. You'll need to update your iOS shortcut with the new key.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-yellow-600">No API key found. Generate one to use with your iOS shortcut.</p>
                <button
                  onClick={regenerateApiKey}
                  disabled={regenerating}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {regenerating ? 'Generating...' : 'Generate API Key'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-8 flex justify-center">
        <Link
          href="/dashboard"
          className="rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
} 