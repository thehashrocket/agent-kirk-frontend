/**
 * @file src/app/admin/page.tsx
 * Admin dashboard page component that serves as the main interface for administrative functions.
 * Provides access to user management, system settings, and analytics features.
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing the application",
};

/**
 * @component AdminDashboard
 * @path src/app/admin/page.tsx
 * Root component for the admin dashboard page.
 * Displays a grid of administrative features including user management,
 * system settings, and analytics in a responsive layout.
 */
export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder cards for admin features */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600">View system usage and performance metrics</p>
        </div>
        <a href="/admin/sendgrid-single-sends" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">SendGrid Single Sends</h2>
          <p className="text-gray-600">Fetch and upsert SendGrid campaigns</p>
        </a>
        <a href="/admin/campaign-recipient-sync" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Campaign Recipient Sync</h2>
          <p className="text-gray-600">Pull scheduled email recipients from Google Drive</p>
        </a>
      </div>
    </div>
  );
}
