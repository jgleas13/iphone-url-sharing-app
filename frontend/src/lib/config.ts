// Dynamic configuration based on environment
export const getBackendUrl = (): string => {
  // Get the value from environment variable
  const envBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  // Check if we're running in the browser
  const isBrowser = typeof window !== 'undefined';
  
  // If we're in development mode and running in the browser
  if (process.env.NODE_ENV === 'development' && isBrowser) {
    return 'http://localhost:3001';
  }
  
  // For production or if the environment variable is set
  if (envBackendUrl) {
    return envBackendUrl;
  }
  
  // Fallback to production URL if all else fails
  return 'https://backend-johngleason-outlookcoms-projects.vercel.app';
};

// Helper to check the current environment
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

// Helper to detect if we're in browser or server
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

// Export other config values here
export const config = {
  backendUrl: getBackendUrl(),
  isDev: isDevelopment(),
};

export default config; 