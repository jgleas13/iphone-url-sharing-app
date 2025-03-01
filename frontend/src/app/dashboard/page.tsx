import ServerNavigation from '@/components/ServerNavigation';
import ProtectedDashboard from '@/components/ProtectedDashboard';

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
const getAllTags = (urls: any[]) => {
  const tagSet = new Set<string>();
  urls.forEach(url => {
    url.tags.forEach((tag: string) => tagSet.add(tag));
  });
  return Array.from(tagSet);
};

export default function Dashboard() {
  // We'll set isAuthenticated to true here since the actual auth check happens in the client component
  const isAuthenticated = true;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={isAuthenticated} currentPath="/dashboard" />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ProtectedDashboard />
      </main>
    </div>
  );
} 