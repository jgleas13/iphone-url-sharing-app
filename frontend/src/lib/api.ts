const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

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