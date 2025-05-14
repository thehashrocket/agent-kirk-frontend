/**
 * @file src/app/not-found.tsx
 * Custom 404 Not Found page component for the application.
 * Renders when a user attempts to access a non-existent route or resource.
 */

import Link from 'next/link';

/**
 * NotFound component shown when accessing non-existent routes.
 * Provides a user-friendly experience with a message and navigation back to home.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="mt-4 text-2xl font-medium">Page Not Found</h2>
      <p className="mt-2 text-gray-600">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link 
        href="/"
        className="mt-8 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Go back home
      </Link>
    </div>
  );
} 