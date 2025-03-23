import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'URL Saver - Save and organize URLs from your iPhone',
  description: 'Save, summarize, and organize URLs shared from your iPhone with AI-powered summaries',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Header />
        <main className="py-6">
          {children}
        </main>
      </body>
    </html>
  );
} 