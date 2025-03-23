'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', requiresAuth: true },
    { name: 'URL Tracker', href: '/urls', requiresAuth: true },
    { name: 'iOS Setup', href: '/ios-setup', requiresAuth: true },
    { name: 'Settings', href: '/settings', requiresAuth: true },
  ];

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">URL Saver</span>
            </Link>
            
            {/* Desktop navigation */}
            <nav className="ml-10 hidden space-x-8 md:flex">
              {navLinks.map((link) => (
                (!link.requiresAuth || isLoggedIn) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive(link.href)
                        ? 'border-b-2 border-blue-500 text-gray-900'
                        : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </nav>
          </div>
          
          <div className="flex items-center">
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
            
            {/* Mobile menu button */}
            <div className="ml-4 md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              (!link.requiresAuth || isLoggedIn) && (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    isActive(link.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
} 