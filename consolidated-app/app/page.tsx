import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold text-white md:text-6xl">iPhone URL Sharing</h1>
        <p className="text-xl text-white opacity-80">Capture, summarize, and organize URLs shared from your iPhone</p>
      </div>
      
      <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Get Started</h2>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/auth/login"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in with Google
          </Link>
          
          <Link 
            href="/guide"
            className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Setup Guide
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-center text-white opacity-75">
        <p>Powered by Next.js 14, Supabase, and AI</p>
      </div>
    </div>
  );
} 