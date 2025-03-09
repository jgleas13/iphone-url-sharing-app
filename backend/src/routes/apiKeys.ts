import express from 'express';
import { generateApiKey, getUserApiKeys, deactivateApiKey } from '../models/apiKey';

const router = express.Router();

// Middleware to validate Supabase JWT
const validateAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // In a real implementation, this would validate the JWT from Supabase
    // For now, we'll just check if the Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth Middleware] No JWT provided');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // In production, you would validate the JWT and extract the user ID
    // For now, we'll simulate this with a mock user ID
    (req as any).userId = 'test_user_123';
    
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error validating JWT:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST endpoint to generate a new API key
router.post('/', validateAuthMiddleware, function(req, res) {
  const handlePost = async () => {
    try {
      console.log('[API Keys Route] Processing generate API key request');
      const userId = (req as any).userId;
      
      // Generate a new API key for the user
      const apiKey = await generateApiKey(userId);
      
      console.log(`[API Keys Route] Generated new API key for user ${userId}`);
      res.status(201).json({ apiKey });
    } catch (error) {
      console.error('[API Keys Route] Error generating API key:', error);
      res.status(500).json({ error: 'Failed to generate API key' });
    }
  };
  
  handlePost();
});

// GET endpoint to list all API keys for a user
router.get('/', validateAuthMiddleware, function(req, res) {
  const handleGet = async () => {
    try {
      console.log('[API Keys Route] Processing get API keys request');
      const userId = (req as any).userId;
      
      // Get all API keys for the user
      const apiKeys = await getUserApiKeys(userId);
      
      console.log(`[API Keys Route] Retrieved ${apiKeys.length} API keys for user ${userId}`);
      res.status(200).json({ apiKeys });
    } catch (error) {
      console.error('[API Keys Route] Error retrieving API keys:', error);
      res.status(500).json({ error: 'Failed to retrieve API keys' });
    }
  };
  
  handleGet();
});

// DELETE endpoint to deactivate an API key
router.delete('/:keyId', validateAuthMiddleware, function(req, res) {
  const handleDelete = async () => {
    try {
      console.log('[API Keys Route] Processing deactivate API key request');
      const keyId = req.params.keyId;
      
      // Deactivate the API key
      const success = await deactivateApiKey(keyId);
      
      if (success) {
        console.log(`[API Keys Route] Successfully deactivated API key ${keyId}`);
        res.status(200).json({ message: 'API key deactivated successfully' });
      } else {
        console.log(`[API Keys Route] Failed to deactivate API key ${keyId}`);
        res.status(400).json({ error: 'Failed to deactivate API key' });
      }
    } catch (error) {
      console.error('[API Keys Route] Error deactivating API key:', error);
      res.status(500).json({ error: 'Failed to deactivate API key' });
    }
  };
  
  handleDelete();
});

export default router; 