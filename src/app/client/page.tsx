/**
 * @file src/app/client/page.tsx
 * Root client page that serves as the entry point for client users.
 * Built using Next.js App Router and Server Components for optimal performance.
 * 
 * Features:
 * - Metadata configuration for SEO
 * - Responsive grid layout using Tailwind CSS
 * - Quick access to key client features
 * - Mobile-first design with responsive breakpoints
 */

import { Metadata } from "next";

/**
 * Static metadata for the client dashboard page.
 * Provides SEO-friendly title and description.
 */
export const metadata: Metadata = {
  title: "Client Dashboard",
  description: "Dashboard for clients to manage their account and services",
};

/**
 * @component ClientDashboard
 * @path src/app/client/page.tsx
 * Root component for the client section.
 * Provides a high-level overview of available features and quick access links.
 * 
 * Features:
 * - Account management access
 * - Support ticket system
 * - Usage statistics overview
 * 
 * Layout:
 * - Responsive grid layout (1 column on mobile, 2 on tablet, 3 on desktop)
 * - Consistent card styling with shadcn/ui components
 * - Proper spacing and typography using Tailwind's utility classes
 * 
 * Design:
 * - Clean, minimalist interface
 * - Clear visual hierarchy
 * - Accessible color contrast
 * - Consistent component spacing
 */
export default function ClientDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Client Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Account Management Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My Account</h2>
          <p className="text-gray-600">View and manage your account settings</p>
        </div>
        {/* Support Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Support</h2>
          <p className="text-gray-600">Get help and submit support tickets</p>
        </div>
        {/* Usage Statistics Card */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
          <p className="text-gray-600">View your service usage and analytics</p>
        </div>
      </div>
    </div>
  );
} 