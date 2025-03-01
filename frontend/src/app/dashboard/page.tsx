import ServerNavigation from '@/components/ServerNavigation';
import UrlList from '@/components/UrlList';

// This would normally come from an API call
const mockUrls = [
  {
    id: 'url_1',
    url: 'https://github.com/example/repo',
    pageTitle: 'Example Repository',
    dateAccessed: new Date().toISOString(),
    summary: 'This is a GitHub repository page containing code and documentation.',
    processingStatus: 'completed',
    tags: ['technology', 'programming', 'github']
  },
  {
    id: 'url_2',
    url: 'https://medium.com/example-article',
    pageTitle: 'Example Article',
    dateAccessed: new Date().toISOString(),
    summary: 'This is a Medium article discussing various topics.',
    processingStatus: 'completed',
    tags: ['article', 'blog']
  },
  {
    id: 'url_3',
    url: 'https://news.example.com/current-events',
    pageTitle: 'Current Events',
    dateAccessed: new Date().toISOString(),
    summary: 'This is a news article covering current events.',
    processingStatus: 'failed',
    tags: ['news', 'current events']
  }
];

// Get all unique tags from the URLs
const getAllTags = (urls: typeof mockUrls) => {
  const tagSet = new Set<string>();
  urls.forEach(url => {
    url.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
};

export default function Dashboard() {
  // In a real implementation, we would check if the user is authenticated
  const isAuthenticated = true;
  const allTags = getAllTags(mockUrls);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={isAuthenticated} currentPath="/dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500">
              View and manage your saved URLs
            </p>
          </div>
          
          <UrlList />
        </div>
      </main>
    </div>
  );
} 