# iPhone URL Sharing App

A Next.js application that allows you to save and organize URLs shared from your iPhone, with AI-powered summaries.

## Features

- Share URLs directly from your iPhone using iOS Shortcuts
- Automatic AI-powered summarization of web content
- Secure authentication with Google via Supabase
- Dashboard to view, filter, and organize your saved URLs
- API key management for secure iOS Shortcut integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth with Google provider
- **Database**: PostgreSQL via Supabase
- **AI**: OpenAI GPT-4 for content summarization
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Project Structure

The project follows Next.js 14 App Router conventions:

```
/app                   # Next.js App Router directory
  /api                 # API routes
    /health            # Health check endpoint
    /receive           # Endpoint for receiving URLs from iOS Shortcuts
    /urls              # URL management endpoints
      /cleanup         # Endpoint for cleaning up stuck URLs
  /auth                # Authentication routes
    /callback          # OAuth callback handler
    /login             # Login page
  /dashboard           # Dashboard page for viewing saved URLs
  /debug               # Debug page with tools for testing and maintenance
/components            # Reusable React components
/lib                   # Utility functions and shared code
/migrations            # Database migration scripts
/public                # Static assets
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo

# Site URL for authentication redirects
NEXT_PUBLIC_SITE_URL=https://iphone-url-sharing-consolidate-johngleason-outlookcoms-projects.vercel.app
```

## Error Handling and Recovery

The application includes robust error handling for the URL processing pipeline:

1. **Timeout Protection**: OpenAI API calls have a 30-second timeout to prevent indefinite hanging
2. **Detailed Error Logging**: All errors are logged with detailed information in the `url_processing_logs` table
3. **Automatic Cleanup**: URLs that have been stuck in "pending" status for more than 10 minutes can be automatically marked as "failed"
4. **Manual Intervention**: The debug page includes a tool to manually trigger the cleanup process for stuck URLs

If you encounter URLs that are stuck in "pending" status:

1. Go to the Debug page (`/debug`)
2. Use the "Cleanup Stuck URLs" button to mark long-pending URLs as failed
3. Check the error details for more information about what went wrong

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables (see above)
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The app is configured for deployment on Vercel. Connect your GitHub repository to Vercel and set the required environment variables in the Vercel dashboard.

## iOS Shortcut Setup

1. Create a new iOS Shortcut
2. Add a "Share Sheet" input to receive URLs
3. Add a "Get Contents of URL" action with the following settings:
   - URL: `https://iphone-url-sharing-consolidate-johngleason-outlookcoms-projects.vercel.app/api/receive`
   - Method: POST
   - Headers:
     - Content-Type: application/json
     - x-api-key: your-api-key (found in the dashboard)
   - Request Body: JSON with the URL and any additional metadata

## Supabase Setup

1. Create a new Supabase project
2. Set up the following tables:
   - `urls`: For storing saved URLs and their metadata
   - `api_keys`: For storing user API keys
3. Configure authentication with Google OAuth provider
4. Add the following URL configurations in Supabase Auth settings:
   - Site URL: `https://iphone-url-sharing-consolidate-johngleason-outlookcoms-projects.vercel.app`
   - Redirect URLs:
     - `https://iphone-url-sharing-consolidate-johngleason-outlookcoms-projects.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local development)

## License

ISC

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [TailwindCSS](https://tailwindcss.com/) 