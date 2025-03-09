import express from 'express';
import { summarizeContent } from '../services/summarization';
import { saveUrl, getUrls } from '../services/database';
import { validateApiKey } from '../models/apiKey';

const router = express.Router();

// Define the URL request interface
interface UrlRequest {
  url: string;
  pageTitle?: string;
  dateAccessed?: string;
  tags?: string[];
}

// Middleware to validate API key
const validateApiKeyMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Get the API key from the Authorization header
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    
    if (!apiKey) {
      console.log('[Auth Middleware] No API key provided');
      res.status(401).json({ error: 'API key required' });
      return;
    }
    
    // For development environment, accept any API key with the correct prefix
    if (process.env.NODE_ENV === 'development' && apiKey.startsWith('ipus_')) {
      console.log('[Auth Middleware] Development mode - accepting test API key');
      (req as any).userId = 'test_user_123';
      next();
      return;
    }
    
    // Validate the API key in production
    const userId = await validateApiKey(apiKey);
    
    if (!userId) {
      console.log('[Auth Middleware] Invalid API key');
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    
    // Store the user ID in the request for later use
    (req as any).userId = userId;
    console.log(`[Auth Middleware] Valid API key for user: ${userId}`);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error validating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST endpoint to receive and process URLs
router.post('/', function(req, res) {
  const handlePost = async () => {
    try {
      console.log('[URLs Route] Processing POST request');
      const { url, pageTitle, dateAccessed, tags = [] } = req.body as UrlRequest;
      
      // Get the user ID from the request (set by the auth middleware)
      const userId = (req as any).userId || 'test_user_123';
      console.log(`[URLs Route] Request from user: ${userId}`);
      
      // Validate required fields
      if (!url) {
        console.log('[URLs Route] Error: URL is required');
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`[URLs Route] Received URL: ${url}`);
      console.log(`[URLs Route] Page title: ${pageTitle || 'Not provided'}`);
      console.log(`[URLs Route] Date accessed: ${dateAccessed || 'Not provided'}`);
      console.log(`[URLs Route] Tags: ${tags.length > 0 ? tags.join(', ') : 'None provided'}`);
      console.log(`[URLs Route] User ID: ${userId}`);

      // Process the URL with OpenAI for summarization
      let summary = '';
      let detectedTags: string[] = [];
      let generatedTitle = '';
      let processingStatus = 'completed';

      try {
        console.log('[URLs Route] Calling summarization service');
        const summarizationResult = await summarizeContent(url);
        summary = summarizationResult.summary;
        detectedTags = summarizationResult.tags;
        generatedTitle = summarizationResult.generatedTitle || '';
        console.log(`[URLs Route] Summarization successful. Summary length: ${summary.length}`);
        console.log(`[URLs Route] Generated title: ${generatedTitle}`);
        console.log(`[URLs Route] Detected tags: ${detectedTags.join(', ')}`);
      } catch (error) {
        console.error('[URLs Route] Summarization failed:', error);
        summary = 'Summary unavailable';
        processingStatus = 'failed';
        console.log('[URLs Route] Setting processing status to failed');
      }

      // Combine user-provided tags with detected tags
      const allTags = [...new Set([...tags, ...detectedTags])];
      console.log(`[URLs Route] Combined tags: ${allTags.join(', ')}`);

      // Use the generated title if no title was provided
      const finalTitle = pageTitle || generatedTitle || url;
      console.log(`[URLs Route] Final title: ${finalTitle}`);

      // Save the URL data to the database
      console.log('[URLs Route] Saving URL to database');
      const savedUrl = await saveUrl({
        url,
        pageTitle: finalTitle,
        dateAccessed: dateAccessed || new Date().toISOString(),
        summary,
        processingStatus,
        tags: allTags
      }, userId);

      console.log('[URLs Route] URL saved successfully');
      console.log('[URLs Route] Response data:', JSON.stringify({
        url: savedUrl.url,
        pageTitle: savedUrl.pageTitle,
        summary: savedUrl.summary,
        tags: savedUrl.tags
      }, null, 2));
      res.status(201).json(savedUrl);
    } catch (error) {
      console.error('[URLs Route] Error processing URL:', error);
      res.status(500).json({ error: 'Failed to process URL' });
    }
  };
  
  handlePost();
});

// GET endpoint to retrieve all saved URLs
router.get('/', function(req, res) {
  const handleGet = async () => {
    try {
      console.log('[URLs Route] Processing GET request');
      // Get the user ID from the request (set by the auth middleware)
      const userId = (req as any).userId || 'test_user_123';
      console.log(`[URLs Route] Request from user: ${userId}`);
      
      const urls = await getUrls(userId);
      console.log(`[URLs Route] Retrieved ${urls.length} URLs for user ${userId}`);
      res.status(200).json(urls);
    } catch (error) {
      console.error('[URLs Route] Error retrieving URLs:', error);
      res.status(500).json({ error: 'Failed to retrieve URLs' });
    }
  };
  
  handleGet();
});

export default router; 