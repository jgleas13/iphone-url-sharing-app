import Link from 'next/link';
import ServerNavigation from '@/components/ServerNavigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ServerNavigation isAuthenticated={false} currentPath="/auth/login" />
      
      <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-gray-900">Continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <GoogleSignInButton />
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 