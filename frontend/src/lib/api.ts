// Determine if we're running in a development environment
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Use local backend in development, production backend in production
const API_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-9gedbrpwu-johngleason-outlookcoms-projects.vercel.app');

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

/**
 * Fetch all saved URLs from the API
 * @returns A promise that resolves to an array of URL entries
 */
export async function fetchUrls(): Promise<UrlEntry[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/urls`);
    
    if (!response.ok) {
      throw new Error(`Error fetching URLs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching URLs:', error);
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
    const response = await fetch(`${API_URL}/api/v1/urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(urlData),
    });
    
    if (!response.ok) {
      throw new Error(`Error saving URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving URL:', error);
    return null;
  }
} 