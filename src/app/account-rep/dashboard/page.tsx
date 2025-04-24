/**
 * @file src/app/account-rep/dashboard/page.tsx
 * Account Representative dashboard overview page.
 * Provides a comprehensive view of client portfolio, recent activities,
 * and quick access to key account management features.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import { 
  getActiveClientsStats,
  getResponseRateStats,
  getClientSatisfactionStats,
  getRecentActivities,
  type RecentActivity 
} from "@/lib/account-rep";
import { getTicketStats } from "@/lib/services/ticket-service";
import { formatDuration } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Inbox, Users, Clock, Star } from "lucide-react";
import { SatisfactionMetrics } from "@/components/account-rep/satisfaction-metrics";

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
 * @component AccountRepStats
 * @path src/app/account-rep/dashboard/page.tsx
 * Server component that displays key performance metrics for the account representative.
 * Shows statistics for active clients, open tickets, response rate, and client satisfaction.
 * Uses Suspense for loading state management.
 */
async function AccountRepStats({ accountRepId }: { accountRepId: string }) {
  const [
    activeClientsStats,
    responseRateStats,
    satisfactionStats,
    ticketStats
  ] = await Promise.all([
    getActiveClientsStats(accountRepId),
    getResponseRateStats(accountRepId),
    getClientSatisfactionStats(accountRepId),
    getTicketStats(accountRepId)
  ]);

  const stats = [
    {
      title: "Active Clients",
      value: activeClientsStats.current,
      change: activeClientsStats.percentageChange,
      icon: <Users className="h-4 w-4 text-blue-500" />,
    },
    // {
    //   title: "Open Tickets",
    //   value: ticketStats.open,
    //   change: ticketStats.percentageChanges.open,
    //   icon: <Inbox className="h-4 w-4 text-yellow-500" />,
    // },
    {
      title: "Response Time",
      value: formatDuration(ticketStats.averageResponseTime),
      change: ticketStats.percentageChanges.averageResponseTime,
      icon: <Clock className="h-4 w-4 text-green-500" />,
    },
    {
      title: "Client Satisfaction",
      value: satisfactionStats.current.toFixed(1) + "/5",
      change: satisfactionStats.percentageChange,
      icon: <Star className="h-4 w-4 text-purple-500" />,
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
 * @path src/app/account-rep/dashboard/page.tsx
 * Displays a single statistic card with title, value, and change indicator.
 * Shows positive changes in green and negative changes in red.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Statistics data
 * @param {string} props.data.title - Title of the statistic
 * @param {string|number} props.data.value - Current value
 * @param {number} props.data.change - Percentage change
 */
function StatsCard({ data }: { 
  data: { 
    title: string; 
    value: string | number; 
    change: number; 
    icon: React.ReactNode;
  } 
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        {data.icon}
        <h3 className="text-sm font-medium text-gray-500">{data.title}</h3>
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">
          {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
        <p className={`ml-2 text-sm ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.change > 0 ? '+' : ''}{data.change}%
        </p>
      </div>
    </Card>
  );
}

/**
 * @component ActivityBadge
 * Displays a badge for activity type and priority
 */
function ActivityBadge({ activity }: { activity: RecentActivity }) {
  const colors = {
    message: 'bg-blue-100 text-blue-800',
    ticket: 'bg-yellow-100 text-yellow-800',
    update: 'bg-green-100 text-green-800',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex gap-2">
      <Badge className={colors[activity.type]}>
        {activity.type}
      </Badge>
      {activity.priority && (
        <Badge className={priorityColors[activity.priority]}>
          {activity.priority}
        </Badge>
      )}
    </div>
  );
}

/**
 * @component RecentActivitiesList
 * Displays recent activities with enhanced details
 */
async function RecentActivitiesList({ accountRepId }: { accountRepId: string }) {
  const activities = await getRecentActivities(accountRepId);

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium">{activity.client}</h3>
              <ActivityBadge activity={activity} />
            </div>
            <p className="text-sm text-gray-600">{activity.action}</p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(activity.time, { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * @component AccountRepDashboard
 * @path src/app/account-rep/dashboard/page.tsx
 * Main dashboard component for account representatives.
 * Features:
 * - Personal welcome message
 * - Key performance metrics
 * - Recent client activities feed
 * - Quick access links to main features
 * 
 * Requires authentication and account representative role.
 * Redirects to sign-in page if not authenticated or unauthorized.
 */
export default async function AccountRepDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ACCOUNT_REP") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {session.user.name || session.user.email}
        </h1>
        <p className="text-gray-600">Here&apos;s an overview of your client portfolio</p>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      }>
        <AccountRepStats accountRepId={session.user.id} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <Suspense fallback={
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          }>
            <RecentActivitiesList accountRepId={session.user.id} />
          </Suspense>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link 
              href="/account-rep/clients" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">Client Management</h3>
              <p className="text-sm text-gray-600">View and manage your client accounts</p>
            </Link>
            {/* <Link 
              href="/account-rep/tickets" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">Support Tickets</h3>
              <p className="text-sm text-gray-600">Handle open support requests</p>
            </Link> */}
            <Link 
              href="/account-rep/messages" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">Messages</h3>
              <p className="text-sm text-gray-600">Check your inbox and send messages</p>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <SatisfactionMetrics accountRepId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
} 