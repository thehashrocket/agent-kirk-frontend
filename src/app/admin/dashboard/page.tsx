/**
 * @file src/app/admin/dashboard/page.tsx
 * Admin dashboard page that provides an overview of system statistics and health metrics.
 * Includes real-time stats, quick actions, and system health monitoring.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { useUsers } from "@/hooks/use-users";
import Link from "next/link";

/**
 * @component AdminStats
 * Server component that fetches and displays key system statistics.
 * Displays metrics for:
 * - Total user count
 * - Active user count
 * - System uptime
 * - API request rate
 * 
 * Uses suspense for loading state management.
 */
async function AdminStats() {
  // In a real application, these would be fetched from your API
  const stats = [
    {
      title: "Total Users",
      value: await getTotalUsers(),
      change: 12,
    },
    {
      title: "Active Users",
      value: await getActiveUsers(),
      change: 8,
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: 0.1,
    },
    {
      title: "API Requests/hour",
      value: await getApiRequestsPerHour(),
      change: -5,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.title} data={stat} />
      ))}
    </div>
  );
}

/**
 * @component StatsCard
 * Displays a single statistic in a card format.
 * Features:
 * - Metric title
 * - Current value
 * - Percentage change indicator (green for positive, red for negative)
 * 
 * @param {Object} props
 * @param {Object} props.data - The statistic data to display
 * @param {string} props.data.title - Title of the statistic
 * @param {string|number} props.data.value - Current value of the statistic
 * @param {number} props.data.change - Percentage change from previous period
 */
function StatsCard({ data }: { data: { title: string; value: string | number; change: number } }) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{data.title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{data.value}</p>
        <p className={`ml-2 text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.change > 0 ? '+' : ''}{data.change}%
        </p>
      </div>
    </Card>
  );
}

/**
 * Fetches the total number of users in the system.
 * @returns {Promise<string>} Total user count formatted as a string
 * @todo Implement actual API call to fetch user count
 */
async function getTotalUsers() {
  // Implement actual API call
  return "1,234";
}

/**
 * Fetches the number of active users in the system.
 * @returns {Promise<string>} Active user count formatted as a string
 * @todo Implement actual API call to fetch active user count
 */
async function getActiveUsers() {
  // Implement actual API call
  return "892";
}

/**
 * Fetches the current API request rate.
 * @returns {Promise<string>} API requests per hour formatted as a string
 * @todo Implement actual API call to fetch API request rate
 */
async function getApiRequestsPerHour() {
  // Implement actual API call
  return "45.2K";
}

/**
 * @component AdminDashboard
 * @path src/app/admin/dashboard/page.tsx
 * Main admin dashboard page component.
 * Features:
 * - Authentication and role-based access control
 * - Real-time system statistics
 * - Quick action links
 * - System health monitoring
 * - Resource usage metrics
 * 
 * Requires ADMIN role for access.
 * Redirects to sign-in page if not authenticated or unauthorized.
 */
export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {session.user.name || session.user.email}
        </h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening in your system</p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <AdminStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link 
              href="/admin/users" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">User Management</h3>
              <p className="text-sm text-gray-600">Add, remove, or modify user accounts</p>
            </Link>
            <Link 
              href="/admin/settings" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">System Settings</h3>
              <p className="text-sm text-gray-600">Configure system-wide parameters</p>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <h3 className="font-medium text-green-700">All Systems Operational</h3>
                <p className="text-sm text-green-600">Last checked: 5 minutes ago</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">CPU Usage</h3>
                <p className="text-2xl font-semibold">24%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Memory</h3>
                <p className="text-2xl font-semibold">3.2GB</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 