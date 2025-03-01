"use client";

import { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not properly configured. Please check your environment variables.');
      }
      
      console.log('Initiating Google sign-in...');
      await signIn();
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      
      // Check if the error is related to redirect URI mismatch
      if (error?.message?.includes('redirect_uri_mismatch') || 
          error?.message?.includes('OAuth') || 
          error?.message?.includes('comply with Google')) {
        setErrorMessage(
          "Google OAuth Error: You need to register the Supabase callback URL in Google Cloud Console. " +
          "Add 'https://ylbkfzhkkcttwevgpyfv.supabase.co/auth/v1/callback' to your authorized redirect URIs."
        );
      } else {
        setErrorMessage(error?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent"
      >
        <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
            fill="#EA4335"
          />
          <path
            d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
            fill="#4285F4"
          />
          <path
            d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
            fill="#FBBC05"
          />
          <path
            d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
            fill="#34A853"
          />
        </svg>
        <span className="text-sm font-semibold leading-6">
          {isLoading ? 'Signing in...' : 'Google'}
        </span>
      </button>
      
      {errorMessage && (
        <div className="mt-3 text-sm text-red-600 max-w-md">
          {errorMessage}
        </div>
      )}
    </div>
  );
} 