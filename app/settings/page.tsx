'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database.types';

type ApiKey = Database['public']['Tables']['api_keys']['Row'];

export default function Settings() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  
  useEffect(() => {
    fetchApiKey();
    fetchUserEmail();
  }, []);
  
  async function fetchUserEmail() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user.email) {
      setUserEmail(data.session.user.email);
    }
  }
  
  async function fetchApiKey() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to view your API key');
      }
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      setApiKey(data || null);
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError('Failed to load API key. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  
  async function generateApiKey() {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate an API key');
      }
      
      // Generate a random API key
      const newKey = Array(32)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');
      
      const keyPrefix = 'url_saver_';
      const fullKey = `${keyPrefix}${newKey}`;
      
      if (apiKey) {
        // Update existing key
        const { error } = await supabase
          .from('api_keys')
          .update({ 
            key: fullKey,
            // Use the current timestamp for updated_at
            updated_at: new Date().toISOString() 
          })
          .eq('id', apiKey.id);
          
        if (error) throw error;
      } else {
        // Create new key
        const { error } = await supabase
          .from('api_keys')
          .insert({
            user_id: session.user.id,
            key: fullKey,
          });
          
        if (error) throw error;
      }
      
      await fetchApiKey();
      setShowKey(true);
      setSuccess('API key generated successfully');
    } catch (error) {
      console.error('Error generating API key:', error);
      setError('Failed to generate API key. Please try again later.');
    } finally {
      setGenerating(false);
    }
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings and API key</p>
      </div>
      
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">API Key</h2>
        <p className="mb-4 text-gray-600">
          Your API key is used to authenticate requests from your iPhone shortcuts. 
          Keep this key secret and do not share it with others.
        </p>
        
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-700">
                {success}
              </div>
            )}
            
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your API Key
              </label>
              <div className="flex">
                <input
                  type={showKey ? "text" : "password"}
                  readOnly
                  value={apiKey?.key || "No API key generated yet"}
                  className="flex-1 rounded-l-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              {apiKey && apiKey.updated_at && (
                <p className="mt-2 text-sm text-gray-500">
                  Last updated: {new Date(apiKey.updated_at).toLocaleString()}
                </p>
              )}
            </div>
            
            <button
              onClick={generateApiKey}
              disabled={generating}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {generating ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Generating...
                </span>
              ) : apiKey ? "Regenerate API Key" : "Generate API Key"}
            </button>
            
            {apiKey && (
              <p className="mt-4 text-sm text-red-600">
                Warning: Regenerating your API key will invalidate your previous key. 
                You will need to update your iPhone shortcuts with the new key.
              </p>
            )}
          </>
        )}
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Account Information</h2>
        
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            readOnly
            value={userEmail}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 