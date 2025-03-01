# iPhone URL Sharing & AI Summarization App

A modern web application that allows you to easily save and summarize URLs directly from your iPhone. The app uses an iOS Shortcut to share URLs, processes them with AI summarization, and displays them in a clean, organized dashboard.

## Features

- **iOS URL Sharing**: Share URLs directly from your iPhone using an iOS Shortcut
- **AI Summarization**: Automatically generate concise summaries of webpage content using OpenAI
- **Tag Generation**: Automatically detect and assign tags based on content type
- **Modern Dashboard**: View all saved URLs in a clean, organized interface
- **Google Authentication**: Secure sign-in using Google via Supabase
- **Filtering & Sorting**: Easily find saved URLs by filtering and sorting

## Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- Supabase Auth (Google Sign-In)

### Backend
- Node.js
- Express
- PostgreSQL (via Supabase)
- OpenAI API for Summarization

### Deployment
- Vercel

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Supabase account
- OpenAI API access

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd iphone-url-sharing
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` directory with the following variables:
     ```
     PORT=3001
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     OPENAI_API_KEY=your_openai_api_key
     OPENAI_MODEL=gpt-4-turbo
     FRONTEND_URL=http://localhost:3000
     ```
   - Create a `.env.local` file in the `frontend` directory with the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
     ```

4. Start the development servers:
   ```
   # Start the backend server
   cd backend
   npm run dev

   # Start the frontend server
   cd ../frontend
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Setting Up the iOS Shortcut

### Detailed Setup Guide

1. **Open the Shortcuts app** on your iPhone
   - If you don't have the Shortcuts app, download it from the App Store

2. **Create a new shortcut**
   - Tap the "+" button in the top right corner to create a new shortcut

3. **Add the "Get Current URL" action**
   - Tap "Add Action" and search for "Get Current URL"
   - This action will get the URL of the current page you're viewing

4. **Add the "Get Contents of URL" action**
   - Search for "Get Contents of URL" and add it to your shortcut
   - Configure it with the following settings:

5. **Configure the action with these settings:**
   - URL: Your API endpoint (e.g., `https://your-app.vercel.app/api/urls`)
   - Method: POST
   - Headers:
     - Content-Type: application/json
   - Request Body: JSON
     ```json
     {
       "url": "Shortcut Input",
       "pageTitle": "Page Title",
       "dateAccessed": "Current Date"
     }
     ```

6. **Add a "Show Result" action**
   - This will display the response from the API

7. **Name your shortcut**
   - Give it a name like "Save URL" and tap "Done"

8. **Using the shortcut**
   - While browsing a webpage, tap the share button
   - Scroll down and tap on your shortcut name ("Save URL")
   - The shortcut will run and send the URL to your dashboard

### Accessing the Setup Guide

A detailed setup guide with screenshots is available in the app at `/guide` after you sign in.

## Deployment

### Backend

1. Deploy the backend to Vercel:
   ```
   cd backend
   vercel
   ```

2. Set up the environment variables in the Vercel dashboard

### Frontend

1. Deploy the frontend to Vercel:
   ```
   cd frontend
   vercel
   ```

2. Set up the environment variables in the Vercel dashboard

## License

This project is licensed under the MIT License - see the LICENSE file for details. 