import express from 'express';
import { summarizeContent } from '../services/summarization';
import { saveUrl, getUrls } from '../services/database';

const router = express.Router();

// Define the URL request interface
interface UrlRequest {
  url: string;
  pageTitle?: string;
  dateAccessed?: string;
  tags?: string[];
}

// POST endpoint to receive and process URLs
router.post('/', function(req, res) {
  const handlePost = async () => {
    try {
      console.log('[URLs Route] Processing POST request');
      const { url, pageTitle, dateAccessed, tags = [] } = req.body as UrlRequest;

      // Validate required fields
      if (!url) {
        console.log('[URLs Route] Error: URL is required');
        return res.status(400).json({ error: 'URL is required' });
      }

      console.log(`[URLs Route] Received URL: ${url}`);
      console.log(`[URLs Route] Page title: ${pageTitle || 'Not provided'}`);
      console.log(`[URLs Route] Date accessed: ${dateAccessed || 'Not provided'}`);
      console.log(`[URLs Route] Tags: ${tags.length > 0 ? tags.join(', ') : 'None provided'}`);

      // Process the URL with OpenAI for summarization
      let summary = '';
      let detectedTags: string[] = [];
      let processingStatus = 'completed';

      try {
        console.log('[URLs Route] Calling summarization service');
        const summarizationResult = await summarizeContent(url);
        summary = summarizationResult.summary;
        detectedTags = summarizationResult.tags;
        console.log(`[URLs Route] Summarization successful. Summary length: ${summary.length}`);
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

      // Save the URL data to the database
      console.log('[URLs Route] Saving URL to database');
      const savedUrl = await saveUrl({
        url,
        pageTitle: pageTitle || url,
        dateAccessed: dateAccessed || new Date().toISOString(),
        summary,
        processingStatus,
        tags: allTags
      });

      console.log('[URLs Route] URL saved successfully');
      console.log('[URLs Route] Response data:', JSON.stringify({
        url: savedUrl.url,
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
      const urls = await getUrls();
      console.log(`[URLs Route] Retrieved ${urls.length} URLs`);
      res.status(200).json(urls);
    } catch (error) {
      console.error('[URLs Route] Error retrieving URLs:', error);
      res.status(500).json({ error: 'Failed to retrieve URLs' });
    }
  };
  
  handleGet();
});

export default router; 