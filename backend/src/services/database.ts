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
  user_id?: string; // Add user_id for association with a specific user
}

/**
 * Save a URL entry to the database
 * @param urlData The URL data to save
 * @param userId The ID of the user who owns this URL
 * @returns A promise that resolves to the saved URL entry
 */
export async function saveUrl(urlData: UrlEntry, userId: string): Promise<UrlEntry> {
  try {
    console.log('[Database] Saving URL to database');
    console.log(`[Database] URL: ${urlData.url}`);
    console.log(`[Database] Page title: ${urlData.pageTitle}`);
    console.log(`[Database] Date accessed: ${urlData.dateAccessed}`);
    console.log(`[Database] Summary: ${urlData.summary.substring(0, 50)}${urlData.summary.length > 50 ? '...' : ''}`);
    console.log(`[Database] Processing status: ${urlData.processingStatus}`);
    console.log(`[Database] Tags: ${urlData.tags.join(', ')}`);
    console.log(`[Database] User ID: ${userId}`);
    
    // Add the user_id to the URL data
    const urlWithUser = {
      ...urlData,
      user_id: userId
    };
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response with generated ID
    const savedUrl: UrlEntry = {
      id: `url_${Date.now()}`,
      ...urlWithUser
    };
    
    console.log(`[Database] URL saved successfully with ID: ${savedUrl.id}`);
    return savedUrl;
    
    // Actual Supabase implementation would be:
    /*
    const { data, error } = await supabase
      .from('urls')
      .insert(urlWithUser)
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
 * Retrieve all saved URL entries for a specific user
 * @param userId The ID of the user whose URLs to retrieve
 * @returns A promise that resolves to an array of URL entries
 */
export async function getUrls(userId?: string): Promise<UrlEntry[]> {
  try {
    console.log('[Database] Retrieving URLs from database');
    if (userId) {
      console.log(`[Database] Filtering by user ID: ${userId}`);
    }
    
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
        tags: ['technology', 'programming', 'github'],
        user_id: userId || 'default_user'
      },
      {
        id: 'url_2',
        url: 'https://medium.com/example-article',
        pageTitle: 'Example Article',
        dateAccessed: new Date().toISOString(),
        summary: 'This is a Medium article discussing various topics.',
        processingStatus: 'completed',
        tags: ['article', 'blog'],
        user_id: userId || 'default_user'
      }
    ];
    
    // If userId is provided, filter the results
    const filteredUrls = userId ? urls.filter(url => url.user_id === userId) : urls;
    
    console.log(`[Database] Retrieved ${filteredUrls.length} URLs`);
    return filteredUrls;
    
    // Actual Supabase implementation would be:
    /*
    let query = supabase
      .from('urls')
      .select('*');
      
    // If userId is provided, filter by it
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query.order('dateAccessed', { ascending: false });
      
    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error('[Database] Error retrieving URLs from database:', error);
    throw new Error('Failed to retrieve URLs from database');
  }
} 