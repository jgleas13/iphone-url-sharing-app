**Phase 1: Environment Setup**

1.  Install and verify Node.js installation (using your system’s preferred LTS version) by running `node -v` (**Tech Stack: node.js in PRD Section 5**).
2.  Set up a new Git repository with branches `main` and `dev` and initialize the project directory structure with two folders: `/frontend` and `/backend` (**PRD Section 7**).
3.  **Validation**: Run `git branch` and check the folder structure to ensure both the `/frontend` and `/backend` directories exist.

**Phase 2: Frontend Development**

1.  In the `/frontend` directory, initialize a Next.js project using Next.js 14 (as recommended for compatibility with AI coding tools) by running:

`npx create-next-app@14 . `(**Tech Stack: Next.js in PRD Section 5 and instructions for Next.js version**).

1.  Set up Tailwind CSS following Next.js integration guides in `/frontend` so that the UI has a modern, clean design (**Frontend Guidelines Document**).
2.  Create the landing page at `/frontend/pages/index.js` that features a modern hero section and a Google Sign-In button (authentication via Supabase) (**PRD Section 3, App Flow: Onboarding and Sign-In/Sign-Up**).
3.  Implement Supabase authentication in the landing page by adding the appropriate client library and configuration (store configuration at `/frontend/config/supabaseClient.js`) (**PRD Section 3, Tech Stack: Supabase**).
4.  Create a dashboard page at `/frontend/pages/dashboard.js` which displays saved URLs as a list of clickable hyperlinks. Design each URL card as a separate component at `/frontend/components/LinkCard.js` that shows the URL (hyperlink) and, when expanded, displays additional details such as summary, title, date accessed and associated tags (**App Flow: Main Dashboard and Detailed Feature Flows**).
5.  Build a filtering and sorting UI component for the dashboard at `/frontend/components/FilterSortBar.js` to allow users to filter URLs by tags and sort by date or content type (**PRD Section 4, App Flow: Detailed Feature Flows**).
6.  Create an activity/history page at `/frontend/pages/activity.js` that shows comprehensive processing status for each URL (**PRD Section 4, App Flow: Activity and Filtering Features**).
7.  **Validation**: Run `npm run dev` in the `/frontend` folder and verify manually that the landing page, dashboard, and activity pages render correctly with dummy data.

**Phase 3: Backend Development**

1.  In the `/backend` directory, initialize a new Node.js project using `npm init` (ensure the project is configured to work with Node.js as the server environment) (**PRD Section 5**).
2.  Install necessary packages including Express, a PostgreSQL driver, and the Supabase client library by running:

`npm install express pg @supabase/supabase-js `(**Tech Stack: Node.js, PostgreSQL, Supabase**).

1.  Create an API endpoint for receiving URLs by setting up an Express server in `/backend/index.js` (**PRD Section 2, Backend Structure Document**).

2.  Create a dedicated route file at `/backend/routes/urls.js` that defines the `POST /api/v1/urls` endpoint. This endpoint should:

    *   Extract the URL, page title, and date accessed from the request.
    *   Call the Grok AI summarization service to generate a concise summary (implement this call in a separate function in `/backend/services/summarization.js`).
    *   Add functionality to handle multiple tags (either existing or new) supplied from the request.
    *   Mark the summary as unavailable if the Grok service fails (do not implement a retry mechanism) (**PRD Section 4, Core Features, App Flow: Processing and AI Summarization**).

3.  In `/backend/services/summarization.js`, integrate with the Grok AI summarization service API. Write a function that accepts webpage data, calls Grok, and returns a summary along with detected tags (**Q&A: AI Summarization, PRD Section 4**).

4.  Implement database interaction in `/backend/services/database.js` using the Supabase client to store URL entries in the PostgreSQL database. Each record should include: URL, page title, date accessed, summary (or an error notice if unavailable), processing status, and tags (**PRD Section 4, Data Storage & Management**).

5.  Add a GET endpoint at `/backend/routes/urls.js` to retrieve all saved URLs along with their metadata for display in the dashboard (**PRD Section 3, App Flow: Main Dashboard**).

6.  **Validation**: Use a tool like Postman or curl to POST a sample payload to `http://localhost:3001/api/v1/urls` and verify that the response contains the stored data, and then GET the saved URLs to ensure data retrieval works as expected.

**Phase 4: Integration**

1.  In the `/frontend` directory, create a service file at `/frontend/services/api.js` that defines functions to perform API calls (GET and POST) to the backend endpoints (e.g., using `fetch` or `axios`) (**App Flow: Integration between frontend and backend**).
2.  Integrate the POST URL function so that when the iOS Shortcut triggers (or when simulated in development), it sends the URL data to the backend endpoint (`/api/v1/urls`), and then update the dashboard view accordingly (**App Flow: iPhone URL Sharing via Shortcut**).
3.  Ensure Supabase authentication is tied in so that only authenticated users can invoke these API calls; adjust CORS settings in the backend (`/backend/index.js`) to allow requests from your Vercel-hosted frontend (**PRD Section 3, Q&A: User Authentication**).
4.  **Validation**: Test the complete flow by simulating an iOS Shortcut call (using a tool like Postman) and verify that the dashboard updates with a new URL entry (including checking summary and tag data).

**Phase 5: Deployment**

1.  Prepare the project for deployment on Vercel by merging the frontend and backend where possible. For the Next.js app, place API routes under `/pages/api` if choosing a serverless deployment, or deploy the backend separately (ensure CORS settings allow integration) (**Tech Stack: Vercel, PRD Section 7**).
2.  Configure environment variables on Vercel for Supabase (e.g. SUPABASE_URL, SUPABASE_KEY) and the Grok API credentials. Store these variables securely in the Vercel dashboard (**PRD Section 7, Tech Stack: Deployment**).
3.  Deploy the Next.js frontend (with integrated or separate API endpoints) to Vercel ensuring the region is set as preferred (e.g. deployment region if specified in your Vercel account) (**PRD Section 7, Q&A: Deployment Preferences**).
4.  If deploying the backend separately, deploy it to an environment that supports Node.js (e.g., using a Vercel serverless function or another Node provider), and update the frontend service endpoints accordingly (**Tech Stack: Deployment**).
5.  Create and commit a detailed README that outlines the deployment process and any necessary configuration steps for production, including setting up Supabase and Grok API keys (**PRD Section 7**).
6.  **Validation**: After deployment, perform an end-to-end test by signing in with Google, posting a URL via a simulated iOS Shortcut call, and then verifying on the production dashboard that the URL, its summary, and metadata appear correctly.

**Note:** The iOS Shortcut workflow is external. You should create a simple shortcut that sends a POST request with the URL, page title, and current date to the deployed backend API. Test this using the Apple Shortcuts app, and ensure the workflow works as described in the App Flow (**App Flow: iOS URL Sharing via Shortcut**).

This implementation plan provides a clear, step-by-step roadmap to build the URL-sharing and summarization tool using Next.js (version 14), Node.js, PostgreSQL via Supabase, Grok AI, and deployment on Vercel as specified in the provided project documents.
