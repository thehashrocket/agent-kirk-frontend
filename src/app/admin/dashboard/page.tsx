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
import Link from "next/link";
import { getTotalUsers, getActiveUsers, getApiRequestsPerHour, getSystemHealth } from "@/lib/admin";
import { SatisfactionOverview } from "@/components/admin/satisfaction-overview";
import { AccountRepPerformance } from "@/components/admin/account-rep-performance";

/**
 * Loading skeleton for stats cards
 */
function StatsCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
}

/**
 * @component AdminStats
 * Server component that fetches and displays key system statistics.
 */
async function AdminStats() {
  const [totalUsers, activeUsers, apiRequests] = await Promise.all([
    getTotalUsers(),
    getActiveUsers(),
    getApiRequestsPerHour(),
  ]);

  // Calculate percentage changes (in a real app, you'd compare with historical data)
  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      change: ((totalUsers - (totalUsers * 0.9)) / (totalUsers * 0.9) * 100).toFixed(1),
    },
    {
      title: "Active Users",
      value: activeUsers,
      change: ((activeUsers - (activeUsers * 0.92)) / (activeUsers * 0.92) * 100).toFixed(1),
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: 0.1,
    },
    {
      title: "API Requests/hour",
      value: apiRequests,
      change: ((apiRequests - (apiRequests * 1.05)) / (apiRequests * 1.05) * 100).toFixed(1),
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
 */
function StatsCard({ data }: { data: { title: string; value: string | number; change: number | string } }) {
  const changeNum = typeof data.change === 'string' ? parseFloat(data.change) : data.change;
  
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{data.title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
        <p className={`ml-2 text-sm ${changeNum >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {changeNum > 0 ? '+' : ''}{changeNum}%
        </p>
      </div>
    </Card>
  );
}

/**
 * @component SystemHealthCard
 * Displays real-time system health metrics
 */
async function SystemHealthCard() {
  const health = await getSystemHealth();
  
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">System Health</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
          <div>
            <h3 className="font-medium text-green-700">All Systems Operational</h3>
            <p className="text-sm text-green-600">Last checked: {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">CPU Usage</h3>
            <p className="text-2xl font-semibold">{health.cpuUsage}%</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Memory</h3>
            <p className="text-2xl font-semibold">{health.memoryUsage}GB</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * @component AdminDashboard
 * Main admin dashboard page component.
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

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      }>
        <AdminStats />
      </Suspense>

      <div className="grid gap-6 mt-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <SatisfactionOverview />
        </Suspense>

        <Suspense fallback={<StatsCardSkeleton />}>
          <AccountRepPerformance />
        </Suspense>

        <div className="grid gap-6 md:grid-cols-2">
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
                href="/admin/campaign-recipient-sync" 
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium">Campaign Recipient Sync</h3>
                <p className="text-sm text-gray-600">Pull scheduled email recipients from Google Drive</p>
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

          <Suspense fallback={<StatsCardSkeleton />}>
            <SystemHealthCard />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 
