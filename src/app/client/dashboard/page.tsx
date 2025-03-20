/**
 * @file src/app/client/dashboard/page.tsx
 * Client dashboard page that provides a comprehensive overview of client activity and services.
 * Built using Next.js App Router and Server Components for optimal performance.
 * 
 * Features:
 * - Real-time usage statistics
 * - LLM query interface
 * - Recent query history
 * - Quick action links
 * - Usage monitoring
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import LLMForm from "@/components/LLMForm";
import QueryHistory from "@/components/QueryHistory";

interface ClientStats {
  monthlyQueries: { value: string; change: number };
  avgResponseTime: { value: string; change: number };
  successRate: { value: string; change: number };
  apiCredits: { value: string; total: string; change: number };
}

/**
 * @component ClientStats
 * Server component that fetches and displays key client statistics.
 * Uses Suspense for loading state management.
 * 
 * Displays metrics for:
 * - Monthly query count
 * - Average response time
 * - Success rate
 * - Remaining API credits
 * 
 * @returns {Promise<JSX.Element>} Grid of statistics cards
 */
async function ClientStats() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/client/stats`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch client stats');
  }

  const { stats } = await response.json() as { stats: ClientStats };

  const statsData = [
    {
      title: "Queries This Month",
      value: stats.monthlyQueries.value,
      change: stats.monthlyQueries.change,
    },
    {
      title: "Average Response Time",
      value: stats.avgResponseTime.value,
      change: stats.avgResponseTime.change,
    },
    {
      title: "Success Rate",
      value: stats.successRate.value,
      change: stats.successRate.change,
    },
    {
      title: "API Credits Left",
      value: `${stats.apiCredits.value} / ${stats.apiCredits.total}`,
      change: stats.apiCredits.change,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <StatsCard key={stat.title} data={stat} />
      ))}
    </div>
  );
}

/**
 * @component StatsCard
 * Displays a single statistic in a card format with change indicator.
 * 
 * Features:
 * - Metric title and current value
 * - Change percentage with color coding
 * - Responsive layout using Tailwind CSS
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
 * @component ClientDashboard
 * @path src/app/client/dashboard/page.tsx
 * Main dashboard page for client users.
 * 
 * Features:
 * - Authentication and role-based access control
 * - Real-time usage statistics with Suspense
 * - LLM query interface for making new queries
 * - Recent query history with status indicators
 * - Quick action links for common tasks
 * - Usage summary with plan details and API usage
 * 
 * Layout:
 * - Responsive grid layout using Tailwind CSS
 * - Main content area (2/3 width) with query interface
 * - Sidebar (1/3 width) with quick actions and usage summary
 * - Mobile-first design with proper stacking
 * 
 * Authentication:
 * - Requires valid session with user ID
 * - Requires CLIENT role
 * - Redirects to sign-in page if not authenticated or unauthorized
 * 
 * @throws {Redirect} Redirects to /auth/signin if user is not authenticated or not a CLIENT
 */
export default async function ClientDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "CLIENT") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {session.user.name || session.user.email}
        </h1>
        <p className="text-gray-600">Here&apos;s an overview of your account activity</p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <ClientStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <div className="md:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">New Query</h2>
            <LLMForm />
          </Card>
          
          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Recent Queries</h2>
            <QueryHistory />
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link 
                href="/client/history" 
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium">Query History</h3>
                <p className="text-sm text-gray-600">View your past queries and results</p>
              </Link>
              <Link 
                href="/client/settings" 
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium">Account Settings</h3>
                <p className="text-sm text-gray-600">Manage your preferences and API keys</p>
              </Link>
              <Link 
                href="/client/support" 
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium">Support</h3>
                <p className="text-sm text-gray-600">Get help or contact your account rep</p>
              </Link>
            </div>
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Usage Summary</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">Plan Status</h3>
                <p className="text-sm text-gray-600">Enterprise Plan</p>
                <p className="text-xs text-gray-500">Renews in 18 days</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">API Usage</h3>
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>This Month</span>
                    <span>1,543 / 10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '15.43%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 