import ServerNavigation from '@/components/ServerNavigation';

export default function Guide() {
  // In a real implementation, we would check if the user is authenticated
  const isAuthenticated = true;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={isAuthenticated} currentPath="/guide" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">iOS Shortcut Setup Guide</h1>
            <p className="mt-2 text-sm text-gray-500">
              Learn how to set up the iOS Shortcut to share URLs from your iPhone
            </p>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Setting Up the iOS Shortcut
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Follow these steps to create a shortcut that sends URLs to your dashboard.
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 1</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Open the Shortcuts app on your iPhone.</p>
                    <p className="mt-2 text-xs text-gray-500">
                      If you don't have the Shortcuts app, you can download it from the App Store.
                    </p>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 2</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Tap the "+" button in the top right corner to create a new shortcut.</p>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 3</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Tap "Add Action" and search for "Get Current URL" action. Add it to your shortcut.</p>
                    <p className="mt-2 text-xs text-gray-500">
                      This action will get the URL of the current page you're viewing.
                    </p>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 4</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Add another action by searching for "Get Contents of URL" and add it to your shortcut.</p>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 5</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Configure the "Get Contents of URL" action with the following settings:</p>
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                      <li>URL: Your API endpoint (e.g., <code className="bg-gray-100 px-1 py-0.5 rounded">https://your-app.vercel.app/api/urls</code>)</li>
                      <li>Method: POST</li>
                      <li>Headers:
                        <ul className="mt-1 list-disc pl-5 space-y-1">
                          <li>Content-Type: application/json</li>
                        </ul>
                      </li>
                      <li>Request Body: JSON</li>
                    </ul>
                    <div className="mt-3 bg-gray-100 p-3 rounded">
                      <pre className="text-xs overflow-x-auto">
{`{
  "url": "Shortcut Input",
  "pageTitle": "Page Title",
  "dateAccessed": "Current Date"
}`}
                      </pre>
                    </div>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 6</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Add a "Show Result" action to display the response from the API.</p>
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 7</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>Name your shortcut (e.g., "Save URL") and tap "Done" to save it.</p>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Step 8</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <p>To use the shortcut, while browsing a webpage:</p>
                    <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm">
                      <li>Tap the share button</li>
                      <li>Scroll down and tap on your shortcut name ("Save URL")</li>
                      <li>The shortcut will run and send the URL to your dashboard</li>
                    </ol>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 