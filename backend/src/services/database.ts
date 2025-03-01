import dotenv from 'dotenv';
import supabase from '../config/supabaseClient';

dotenv.config();

// Define types
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
 * Save a URL entry to the database
 * @param urlData The URL data to save
 * @returns A promise that resolves to the saved URL entry
 */
export async function saveUrl(urlData: UrlEntry): Promise<UrlEntry> {
  try {
    // In a real implementation, this would insert data into Supabase
    // For now, we'll simulate a response
    
    console.log('[Database] Saving URL to database');
    console.log(`[Database] URL: ${urlData.url}`);
    console.log(`[Database] Page title: ${urlData.pageTitle}`);
    console.log(`[Database] Date accessed: ${urlData.dateAccessed}`);
    console.log(`[Database] Summary: ${urlData.summary.substring(0, 50)}${urlData.summary.length > 50 ? '...' : ''}`);
    console.log(`[Database] Processing status: ${urlData.processingStatus}`);
    console.log(`[Database] Tags: ${urlData.tags.join(', ')}`);
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response with generated ID
    const savedUrl: UrlEntry = {
      id: `url_${Date.now()}`,
      ...urlData
    };
    
    console.log(`[Database] URL saved successfully with ID: ${savedUrl.id}`);
    return savedUrl;
    
    // Actual Supabase implementation would be:
    /*
    const { data, error } = await supabase
      .from('urls')
      .insert(urlData)
      .select()
      .single();
      
    if (error) throw error;
    return data;
    */
  } catch (error) {
    console.error('[Database] Error saving URL to database:', error);
    throw new Error('Failed to save URL to database');
  }
}

/**
 * Retrieve all saved URL entries from the database
 * @returns A promise that resolves to an array of URL entries
 */
export async function getUrls(): Promise<UrlEntry[]> {
  try {
    // In a real implementation, this would query data from Supabase
    // For now, we'll simulate a response
    
    console.log('[Database] Retrieving URLs from database');
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response with sample data
    const urls: UrlEntry[] = [
      {
        id: 'url_1',
        url: 'https://github.com/example/repo',
        pageTitle: 'Example Repository',
        dateAccessed: new Date().toISOString(),
        summary: 'This is a GitHub repository page containing code and documentation.',
        processingStatus: 'completed',
        tags: ['technology', 'programming', 'github']
      },
      {
        id: 'url_2',
        url: 'https://medium.com/example-article',
        pageTitle: 'Example Article',
        dateAccessed: new Date().toISOString(),
        summary: 'This is a Medium article discussing various topics.',
        processingStatus: 'completed',
        tags: ['article', 'blog']
      }
    ];
    
    console.log(`[Database] Retrieved ${urls.length} URLs`);
    return urls;
    
    // Actual Supabase implementation would be:
    /*
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .order('dateAccessed', { ascending: false });
      
    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('[Database] Error retrieving URLs from database:', error);
    throw new Error('Failed to retrieve URLs from database');
  }
} 