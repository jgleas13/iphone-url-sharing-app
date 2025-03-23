'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Image from 'next/image';

export default function IosSetup() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchApiKey();
  }, []);
  
  async function fetchApiKey() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to view setup instructions');
      }
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('key')
        .eq('user_id', session.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      setApiKey(data?.key || null);
    } catch (error) {
      console.error('Error fetching API key:', error);
      setError('Failed to load your API key. Please try again later.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">iOS Setup Instructions</h1>
        <p className="text-gray-600">Learn how to set up the URL sharing shortcut on your iPhone</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : !apiKey ? (
        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-yellow-700">
          <p>You need to generate an API key before setting up the shortcut.</p>
          <a 
            href="/settings" 
            className="mt-2 inline-block font-medium text-blue-600 hover:underline"
          >
            Go to Settings to generate an API key
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Prerequisites</h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>An iPhone running iOS 13 or later</li>
              <li>The Shortcuts app installed (comes pre-installed on iOS 13+)</li>
              <li>Your API key (shown below)</li>
            </ul>
            
            <div className="mt-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-2 font-medium">Your API Key:</p>
              <div className="overflow-x-auto rounded border border-gray-300 bg-white p-2 font-mono text-sm">
                {apiKey}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                You'll need this key when setting up the shortcut. Keep it private.
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Step 1: Install the Shortcut</h2>
            <p className="mb-4">
              Click the button below to download and install the URL Saver shortcut on your iPhone:
            </p>
            
            <a 
              href="https://www.icloud.com/shortcuts/123456789abc" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Get the Shortcut
            </a>
            
            <div className="mt-4">
              <p className="font-medium">Alternative method:</p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>Open the Shortcuts app on your iPhone</li>
                <li>Tap the "+" button to create a new shortcut</li>
                <li>Follow the manual setup instructions below</li>
              </ol>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Step 2: Configure the Shortcut</h2>
            <p className="mb-4">
              After installing the shortcut, you'll need to configure it with your API key:
            </p>
            
            <ol className="ml-6 list-decimal space-y-2">
              <li>Open the Shortcuts app</li>
              <li>Find the "URL Saver" shortcut and tap the ⓘ (info) button</li>
              <li>Tap "Edit" in the top right corner</li>
              <li>Find the "Text" action containing "YOUR_API_KEY_HERE"</li>
              <li>Replace it with your API key shown above</li>
              <li>Tap "Done" to save your changes</li>
            </ol>
            
            <div className="mt-4">
              <p className="font-medium">Manual setup instructions:</p>
              <p className="mb-2">If you're creating the shortcut manually, use these actions:</p>
              <ol className="ml-6 list-decimal space-y-2">
                <li>Add a "URL" action and set it to "Shortcut Input"</li>
                <li>Add a "Text" action with your API key</li>
                <li>Add a "URL" action with: <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">https://your-app-url.vercel.app/api/save-url</code></li>
                <li>Add a "Get Contents of URL" action with:
                  <ul className="ml-6 list-disc">
                    <li>Method: POST</li>
                    <li>Request Body: JSON</li>
                    <li>Add "url" key with the Shortcut Input URL value</li>
                    <li>Add "apiKey" key with your API key</li>
                  </ul>
                </li>
                <li>Add a "Show Result" action to display the response</li>
              </ol>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Step 3: Using the Shortcut</h2>
            <p className="mb-4">
              Once configured, you can use the shortcut in several ways:
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">From the Share Sheet:</h3>
                <ol className="ml-6 list-decimal space-y-1">
                  <li>While browsing a webpage, tap the share button</li>
                  <li>Scroll through the share options and tap "URL Saver"</li>
                  <li>The URL will be sent to your dashboard for processing</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium">From the Shortcuts App:</h3>
                <ol className="ml-6 list-decimal space-y-1">
                  <li>Open the Shortcuts app</li>
                  <li>Tap the "URL Saver" shortcut</li>
                  <li>When prompted, enter or paste a URL</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium">From the Home Screen:</h3>
                <ol className="ml-6 list-decimal space-y-1">
                  <li>Add the shortcut to your home screen for quick access</li>
                  <li>In the Shortcuts app, tap the ⓘ (info) button on your shortcut</li>
                  <li>Tap "Add to Home Screen"</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Troubleshooting</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Shortcut Not Working:</h3>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Verify your API key is entered correctly</li>
                  <li>Check your internet connection</li>
                  <li>Make sure you're logged into your account</li>
                  <li>Try regenerating your API key in Settings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">URL Not Appearing in Dashboard:</h3>
                <ul className="ml-6 list-disc space-y-1">
                  <li>URLs may take a moment to process and appear</li>
                  <li>Check the URL Tracker page to see if the URL is pending</li>
                  <li>Verify the shortcut received a success message</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Need More Help?</h3>
                <p>
                  If you're still having issues, please contact support or check the documentation for more detailed instructions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 