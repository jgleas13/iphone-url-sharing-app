'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Url = Database['public']['Tables']['urls']['Insert'];

interface AddUrlFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddUrlForm({ onSuccess, onCancel }: AddUrlFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('URL is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add a URL');
      }
      
      // Process tags
      const tagArray = tags
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];
      
      // Insert the URL
      const { error: insertError } = await supabase
        .from('urls')
        .insert({
          url,
          title: title || null,
          tags: tagArray.length > 0 ? tagArray : null,
          user_id: user.id,
          status: 'pending', // Start with pending status
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Clear the form
      setUrl('');
      setTitle('');
      setTags('');
      
      // Notify parent component
      onSuccess();
      
    } catch (error) {
      console.error('Error adding URL:', error);
      setError('Failed to add URL. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Add New URL</h2>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page Title"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="tags" className="mb-1 block text-sm font-medium text-gray-700">
              Tags (comma separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tech, article, reference"
              className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 