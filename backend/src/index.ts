import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import urlRoutes from './routes/urls';
import apiKeyRoutes from './routes/apiKeys';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Authentication middleware function
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip auth check in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth] Development mode - skipping authentication');
    
    // For API endpoints that need user ID, set a test user ID
    const path = req.path;
    if (path.includes('/api/v1/urls')) {
      console.log('[Auth] Setting test user ID for development mode');
      (req as any).userId = 'test_user_123';
    }
    
    return next();
  }

  console.log('[Auth] Checking authentication');
  
  // Get the authorization header
  const authHeader = req.headers.authorization;
  
  // Check if the request is from Vercel
  const isVercelRequest = req.headers['x-vercel-deployment-url'] || 
                          req.headers['x-vercel-id'] ||
                          req.headers['x-forwarded-host']?.toString().includes('vercel.app');
  
  // If it's a Vercel request or has a valid auth header, proceed
  if (isVercelRequest || (authHeader && authHeader.startsWith('Bearer '))) {
    console.log('[Auth] Authentication successful');
    return next();
  }
  
  // For the health check endpoint, allow without auth
  if (req.path === '/health') {
    return next();
  }
  
  console.log('[Auth] Authentication failed');
  res.status(401).json({ 
    error: 'Authentication required',
    message: 'Please provide valid authentication credentials'
  });
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Apply authentication middleware
app.use(authMiddleware);

// Routes
app.use('/api/v1/urls', urlRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app; 