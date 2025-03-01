# Project Requirements Document

## 1. Project Overview

This project is designed to create a simple yet powerful tool that lets you easily save and summarize URLs directly from your iPhone. The idea revolves around setting up an iOS Shortcut that, when activated, shares a webpage URL with the app. Once the URL is received by the backend, the system fetches additional details like the page title and the date the link was shared, then uses the Grok AI summarization service to generate a brief, concise summary of the webpage content. The summary is enhanced by tagging it with labels based on the type of content, making it easier to filter and locate related links later on.

The purpose of building this application is to help you quickly capture interesting content while on the go and to organize it in a modern, user-friendly website interface. Key objectives of the project include reliable and seamless URL sharing from an iPhone, swift and effective summarization using AI, and an organized dashboard where all saved URLs, their summaries, metadata, and processing statuses are easy to access. Success will be measured by the ease of use, performance of the URL processing and summarization, and the clarity of the user interface for browsing and filtering content.

## 2. In-Scope vs. Out-of-Scope

### In-Scope:

*   A working iOS Shortcut that allows a user to share a URL from their iPhone.
*   A backend API that receives the URL along with key metadata (page title and current date).
*   Integration with the Grok AI summarization service to generate concise summaries.
*   Saving each URL entry in a database (PostgreSQL) with the summary, tags, processing status, page title, and date accessed.
*   A modern web application with a landing page that supports Google sign-in via Supabase authentication.
*   A dashboard where users can see a clean list of saved URLs (as clickable hyperlinks) with expandable details.
*   A separate activity page that tracks the processing state of each URL.
*   Features for filtering, sorting, and categorizing URLs by tags.

### Out-of-Scope:

*   Automated retry mechanism if the summarization process fails (failed summaries remain as unavailable).
*   Mobile apps on platforms other than iOS.
*   Advanced UI customization beyond a modern, clean design.
*   Additional integrations such as notifications or analytics in the initial version.
*   More complex user management beyond simple Google authentication.

## 3. User Flow

A new user first lands on a modern, inviting landing page where they are prompted to sign in using their Google account through the Supabase-based authentication process. Once authenticated, the user is immediately directed to a main dashboard that displays a simple list of saved URLs. From here, users can click on any URL to expand and view extra details such as a brief summary, the title of the page, the date it was saved, and any tags associated with it.

When browsing on their iPhone, the user will activate a pre-configured iOS Shortcut. This shortcut allows them to quickly share a URL from Safari (or any other app) directly to the system via an API call. Behind the scenes, the backend processes the shared URL by gathering metadata (like the page title and date) and connecting to the Grok AI summarization service to produce a concise summary. Whether the summarization is successful or not, the URL, its metadata, and the generated summary (or a status indicating its absence) are stored in a centralized database, ready for the user to access later via the dashboard.

## 4. Core Features

*   **iOS URL Sharing Shortcut:**

    *   A configurable iOS Shortcut that triggers the share action from the iPhone, sending the URL and minimal metadata to the API.

*   **Backend API for URL Handling:**

    *   An API endpoint to receive URLs from the iOS Shortcut.
    *   Functionality to extract supplementary metadata (page title, date accessed).

*   **AI Summarization Service Integration:**

    *   Integration with Grok to generate a short, concise summary (a few sentences) of the webpage content.
    *   Tagging mechanism to assign existing tags or allow insertion of new ones based on content type.

*   **Data Storage & Management:**

    *   A PostgreSQL database (via Supabase) that stores URLs alongside their metadata, summaries, processing status, and tags.
    *   Marking entries that failed the summarization process while still retaining the submitted data.

*   **User Authentication:**

    *   Google sign-in using Supabase to provide secure and simple access.

*   **Modern Dashboard & UI:**

    *   A landing page that offers a clean, uncluttered view of saved URLs.
    *   A main page displaying just the URLs, with options to expand for further details.
    *   An additional activity/history page showing processing statuses.
    *   Advanced filtering, sorting, and categorization options via dynamic tagging.

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Next.js for the web application framework.
    *   Modern CSS frameworks (e.g., Tailwind CSS) for the UI design and layout.

*   **Backend:**

    *   Node.js as the server environment.
    *   PostgreSQL for the relational database, with Supabase to handle both authentication and database interactions.
    *   Integration with the Grok AI summarization service for content processing.

*   **Integration & Deployment:**

    *   iOS Shortcuts for allowing users to share URLs from their iPhones.
    *   Vercel for hosting and deploying the web application.
    *   Cursor as the advanced IDE for AI-powered real-time coding suggestions during development.

## 6. Non-Functional Requirements

*   **Performance:**

    *   The API should respond quickly with minimal latency (< 500ms for API calls) to ensure a seamless user experience.
    *   The web application should load quickly, with a target load time of under 3 seconds for the main dashboard.

*   **Security:**

    *   Use OAuth-based Google sign-in through Supabase to ensure secure user authentication.
    *   Ensure that communication between the iOS Shortcut, backend, and frontend is encrypted (using HTTPS).

*   **Compliance & Usability:**

    *   The application should conform to general web accessibility standards.
    *   Design the UI to be intuitive and easy to navigate, ensuring a clutter-free experience for quick scanning and filtering of saved URLs.

## 7. Constraints & Assumptions

*   Assumes that users will only be using iOS for direct URL sharing via the Shortcut.
*   Assumes availability of the Grok summarization service with expected API performance.
*   The system does not implement a retry mechanism for AI summarization failures; failed summaries will simply be marked as unavailable.
*   The project will use Supabase for both authentication and database, aligning with the developer’s previous experiences and preferences.
*   Deployment is preferred on Vercel for ease of credential management and integrated hosting.

## 8. Known Issues & Potential Pitfalls

*   There might be occasional API rate limits or delays from the Grok summarization service, potentially impacting the speed of summary generation. A possible mitigation could be to cache previous summaries or to notify users if a summary is delayed.
*   Handling and managing dynamic tags could introduce complexities, especially if similar but slightly different tags are created. Standardizing tag input or imposing a controlled tag selection might help mitigate confusion.
*   Ensuring seamless integration between the iOS Shortcut and backend API requires robust error-handling for edge cases (e.g., no URL sent, network issues). Proper logging and user feedback mechanisms are necessary to ensure that even if an action fails, the user understands the state of their submission.
*   Google authentication via Supabase might face occasional token expiry or session issues; timely error handling and session refresh logic should be planned.

This document provides a clear, detailed overview of the project and should serve as the main brain for subsequent technical documents. Every aspect is laid out in everyday language to avoid any ambiguity for further development and integration work.
