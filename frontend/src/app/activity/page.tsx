import ServerNavigation from '@/components/ServerNavigation';

// This would normally come from an API call
const mockActivities = [
  {
    id: 'url_1',
    url: 'https://github.com/example/repo',
    pageTitle: 'Example Repository',
    dateAccessed: new Date().toISOString(),
    processingStatus: 'completed',
    processingTime: '1.2s'
  },
  {
    id: 'url_2',
    url: 'https://medium.com/example-article',
    pageTitle: 'Example Article',
    dateAccessed: new Date().toISOString(),
    processingStatus: 'completed',
    processingTime: '0.8s'
  },
  {
    id: 'url_3',
    url: 'https://news.example.com/current-events',
    pageTitle: 'Current Events',
    dateAccessed: new Date().toISOString(),
    processingStatus: 'failed',
    processingTime: '2.5s',
    error: 'Failed to generate summary'
  }
];

export default function Activity() {
  // In a real implementation, we would check if the user is authenticated
  const isAuthenticated = true;
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={isAuthenticated} currentPath="/activity" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
            <p className="mt-2 text-sm text-gray-500">
              View the processing status of your saved URLs
            </p>
          </div>
          
          {/* Activity List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {mockActivities.map((activity) => (
                <li key={activity.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {activity.pageTitle}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activity.processingStatus === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {activity.processingStatus}
                          </p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.dateAccessed)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 truncate">
                            {activity.url}
                          </a>
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Processing time: {activity.processingTime}
                        </p>
                      </div>
                    </div>
                    {activity.error && (
                      <div className="mt-2">
                        <p className="text-sm text-red-600">
                          Error: {activity.error}
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 