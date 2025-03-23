/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configure for dynamic API routes
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        '*.vercel.app', 
        'iphone-url-sharing-consolidate-johngleason-outlookcoms-projects.vercel.app'
      ],
    },
  },
};

export default nextConfig;
