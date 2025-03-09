import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import urlRoutes from './routes/urls';
import apiKeyRoutes from './routes/apiKeys';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication middleware function
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For the health check endpoint, allow without auth
    if (req.path === '/health') {
      return next();
    }

    // Skip auth check in development if explicitly set
    if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
      console.log('[Auth] Development mode - skipping authentication');
      (req as any).userId = 'test_user_123';
      return next();
    }

    console.log('[Auth] Checking authentication');
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header found');
    }

    // Extract the JWT token
    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }

    // Add the user ID to the request
    (req as any).userId = user.id;
    console.log('[Auth] Authentication successful for user:', user.id);
    next();
  } catch (error) {
    console.error('[Auth] Authentication failed:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Please provide valid authentication credentials'
    });
  }
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