import express from 'express';
import { generateApiKey, getUserApiKeys, deactivateApiKey } from '../models/apiKey';

const router = express.Router();

// Generate a new API key
router.post('/generate', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    console.log(`[API Keys] Generating new API key for user ${userId}`);
    const apiKey = await generateApiKey(userId);
    
    res.json({ 
      success: true, 
      apiKey,
      message: 'API key generated successfully'
    });
  } catch (error) {
    console.error('[API Keys] Error generating API key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate API key',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// List all API keys for a user
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    console.log(`[API Keys] Fetching API keys for user ${userId}`);
    const apiKeys = await getUserApiKeys(userId);
    
    res.json({ 
      success: true, 
      apiKeys,
      message: 'API keys retrieved successfully'
    });
  } catch (error) {
    console.error('[API Keys] Error fetching API keys:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch API keys',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Deactivate an API key
router.delete('/:keyId', async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const { keyId } = req.params;
    console.log(`[API Keys] Deactivating API key ${keyId} for user ${userId}`);
    
    const success = await deactivateApiKey(keyId);
    if (!success) {
      throw new Error('Failed to deactivate API key');
    }
    
    res.json({ 
      success: true,
      message: 'API key deactivated successfully'
    });
  } catch (error) {
    console.error('[API Keys] Error deactivating API key:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to deactivate API key',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router; 