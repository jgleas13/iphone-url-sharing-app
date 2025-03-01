import express from 'express';
import { summarizeContent } from '../services/summarization';
import { saveUrl, getUrls } from '../services/database';

const router = express.Router();

// POST endpoint to receive and process URLs
router.post('/', async (req, res) => {
  try {
    const { url, pageTitle, dateAccessed, tags = [] } = req.body;

    // Validate required fields
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Process the URL with Grok AI for summarization
    let summary = '';
    let detectedTags: string[] = [];
    let processingStatus = 'completed';

    try {
      const summarizationResult = await summarizeContent(url);
      summary = summarizationResult.summary;
      detectedTags = summarizationResult.tags;
    } catch (error) {
      console.error('Summarization failed:', error);
      summary = 'Summary unavailable';
      processingStatus = 'failed';
    }

    // Combine user-provided tags with detected tags
    const allTags = [...new Set([...tags, ...detectedTags])];

    // Save the URL data to the database
    const savedUrl = await saveUrl({
      url,
      pageTitle: pageTitle || url,
      dateAccessed: dateAccessed || new Date().toISOString(),
      summary,
      processingStatus,
      tags: allTags
    });

    res.status(201).json(savedUrl);
  } catch (error) {
    console.error('Error processing URL:', error);
    res.status(500).json({ error: 'Failed to process URL' });
  }
});

// GET endpoint to retrieve all saved URLs
router.get('/', async (req, res) => {
  try {
    const urls = await getUrls();
    res.status(200).json(urls);
  } catch (error) {
    console.error('Error retrieving URLs:', error);
    res.status(500).json({ error: 'Failed to retrieve URLs' });
  }
});

export default router; 