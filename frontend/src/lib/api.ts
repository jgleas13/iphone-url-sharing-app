// Import the configuration
import { getBackendUrl, isDevelopment } from './config';

// Use the dynamic configuration to get the backend URL
const API_URL = getBackendUrl();

console.log(`[API] Using backend URL: ${API_URL}`);

interface UrlEntry {
  id?: string;
  url: string;
  pageTitle: string;
  dateAccessed: string;
  summary: string;
  processingStatus: string;
  tags: string[];
}

// Helper function to get authentication headers
const getAuthHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Only add auth headers in production
  if (!isDevelopment) {
    try {
      // If using Supabase auth, you can get the session token
      const { supabase } = await import('./supabase');
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
    } catch (error) {
      console.error('[API] Error getting auth headers:', error);
    }
  }
  
  return headers;
};

/**
 * Fetch all saved URLs from the API
 * @returns A promise that resolves to an array of URL entries
 */
export async function fetchUrls(): Promise<UrlEntry[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/urls`, {
      headers,
      credentials: 'include', // Include cookies for cross-origin requests
    });
    
    if (!response.ok) {
      console.error(`[API] Error fetching URLs: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[API] Error details:`, errorText);
      throw new Error(`Error fetching URLs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Error fetching URLs:', error);
    return [];
  }
}

/**
 * Save a URL to the API
 * @param urlData The URL data to save
 * @returns A promise that resolves to the saved URL entry
 */
export async function saveUrl(urlData: {
  url: string;
  pageTitle?: string;
  dateAccessed?: string;
  tags?: string[];
}): Promise<UrlEntry | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/urls`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for cross-origin requests
      body: JSON.stringify(urlData),
    });
    
    if (!response.ok) {
      console.error(`[API] Error saving URL: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[API] Error details:`, errorText);
      throw new Error(`Error saving URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Error saving URL:', error);
    return null;
  }
} 