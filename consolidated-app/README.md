# iPhone URL Sharing App

A modern web application for capturing, summarizing, and organizing URLs shared from your iPhone. Built with Next.js 14, Supabase, and Grok AI.

## Features

- **URL Capturing**: Share URLs from your iPhone via iOS Shortcuts
- **AI Summarization**: Automatic summarization of content using Grok AI
- **Dashboard**: Browse, search, and filter your saved URLs
- **Authentication**: Secure access with Google authentication via Supabase
- **API Key Management**: Generate and manage API keys for iOS Shortcuts

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- A Supabase account
- A Grok API key (for AI summarization)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/iphone-url-sharing-app.git
   cd iphone-url-sharing-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file based on the provided example:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update the environment variables in `.env.local` with your own values.

5. Set up the Supabase database tables by running the SQL script in `create_tables.sql` in your Supabase SQL editor.

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### URLs Table
```sql
CREATE TABLE urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  summary TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Setting Up iOS Shortcuts

1. Create a new iOS Shortcut with the "Share Sheet" capability
2. Add a "Get URLs from Input" action
3. Add a "Get Contents of Web Page" action using the URL from step 2
4. Add a "Get Dictionary from Input" action to extract the page title
5. Add a "Make HTTP Request" action with:
   - Method: POST
   - URL: [Your App URL]/api/receive
   - Headers: {"x-api-key": "your-api-key"}
   - Body: {"url": "[URL from step 2]", "title": "[Title from step 4]"}
6. Add a "Show Result" action to display the response

## Deployment

This project is configured for easy deployment on Vercel:

```bash
npm run build
vercel deploy --prod
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Grok AI](https://grok.com/)
- [TailwindCSS](https://tailwindcss.com/) 