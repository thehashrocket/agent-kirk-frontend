/**
 * @file src/app/admin/client-reports/page.tsx
 * Admin client reports page that provides comprehensive dashboard reports for all clients.
 * Administrators can view dashboard reports for all clients, including their GA Accounts and Properties.
 * Features client selection dropdown to filter data by specific client or view all clients.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import { 
  getAllClientsStats,
  getSystemResponseRateStats,
  getSystemClientSatisfactionStats,
  getSystemRecentActivities,
  getAllClientsWithGaData,
  type SystemRecentActivity 
} from "@/lib/admin-client-reports";
import { getTicketStats } from "@/lib/services/ticket-service";
import { formatDuration } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Inbox, Users, Clock, Star, Settings } from "lucide-react";
import { AdminSatisfactionMetrics } from "@/components/admin/admin-satisfaction-metrics";
import { ClientSelector } from "@/components/admin/client-selector";
import { GaAccountsOverview } from "@/components/admin/ga-accounts-overview";

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
 * @component AdminClientStats
 * @path src/app/admin/client-reports/page.tsx
 * Server component that displays key performance metrics for all clients or a selected client.
 * Shows statistics for active clients, system response rate, and client satisfaction.
 * Uses Suspense for loading state management.
 */
async function AdminClientStats({ selectedClientId }: { selectedClientId?: string }) {
  const [
    clientsStats,
    responseRateStats,
    satisfactionStats,
    ticketStats
  ] = await Promise.all([
    getAllClientsStats(selectedClientId),
    getSystemResponseRateStats(selectedClientId),
    getSystemClientSatisfactionStats(selectedClientId),
    getTicketStats(selectedClientId)
  ]);

  const stats = [
    {
      title: selectedClientId ? "Client Status" : "Total Active Clients",
      value: clientsStats.current,
      change: clientsStats.percentageChange,
      icon: <Users className="h-4 w-4 text-blue-500" />,
    },
    {
      title: "System Response Time",
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatsCard key={stat.title} data={stat} />
      ))}
    </div>
  );
}

/**
 * @component StatsCard
 * @path src/app/admin/client-reports/page.tsx
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
function ActivityBadge({ activity }: { activity: SystemRecentActivity }) {
  const colors: Record<string, string> = {
    message: 'bg-blue-100 text-blue-800',
    ticket: 'bg-yellow-100 text-yellow-800',
    update: 'bg-green-100 text-green-800',
    ga_account: 'bg-purple-100 text-purple-800',
    ga_property: 'bg-indigo-100 text-indigo-800',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex gap-2">
      <Badge className={colors[activity.type] || 'bg-gray-100 text-gray-800'}>
        {activity.type.replace('_', ' ')}
      </Badge>
      {activity.priority && (
        <Badge className={priorityColors[activity.priority] || 'bg-gray-100 text-gray-800'}>
          {activity.priority}
        </Badge>
      )}
    </div>
  );
}

/**
 * @component SystemRecentActivitiesList
 * Displays recent activities across all clients or for a selected client
 */
async function SystemRecentActivitiesList({ selectedClientId }: { selectedClientId?: string }) {
  const activities = await getSystemRecentActivities(selectedClientId);

  return (
    <div className="space-y-4">
      {activities.map((activity: SystemRecentActivity) => (
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
            {activity.accountRep && (
              <p className="text-xs text-gray-500">Account Rep: {activity.accountRep}</p>
            )}
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
 * @component AdminClientReports
 * @path src/app/admin/client-reports/page.tsx
 * Main dashboard component for admin client reports.
 * Features:
 * - Client selection dropdown
 * - System-wide or client-specific performance metrics
 * - Recent activities across all clients
 * - Google Analytics accounts and properties overview
 * - Quick access links to admin features
 * 
 * Requires authentication and admin role.
 * Redirects to sign-in page if not authenticated or unauthorized.
 */
export default async function AdminClientReports({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  const { clientId } = await searchParams;
  const selectedClientId = clientId || undefined;

  const clientsWithGaData = await getAllClientsWithGaData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Client Reports Dashboard
        </h1>
        <p className="text-gray-600">
          {selectedClientId 
            ? `Viewing reports for selected client` 
            : `System-wide dashboard reports for all clients`}
        </p>
      </div>

      {/* Client Selection */}
      <div className="mb-6">
        <ClientSelector 
          clients={clientsWithGaData}
          selectedClientId={selectedClientId}
        />
      </div>

      {/* Stats Overview */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      }>
        <AdminClientStats selectedClientId={selectedClientId} />
      </Suspense>

      {/* Google Analytics Overview */}
      <div className="mt-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <GaAccountsOverview 
            clientId={selectedClientId}
            clientsWithGaData={clientsWithGaData}
          />
        </Suspense>
      </div>

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
            <SystemRecentActivitiesList selectedClientId={selectedClientId} />
          </Suspense>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link 
              href="/admin/users" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">User Management</h3>
              <p className="text-sm text-gray-600">Manage all users and their roles</p>
            </Link>
            <Link 
              href="/admin/messages" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">System Messages</h3>
              <p className="text-sm text-gray-600">View all messages in the system</p>
            </Link>
            <Link 
              href="/admin/dashboard" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">System Overview</h3>
              <p className="text-sm text-gray-600">View overall system health and metrics</p>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Suspense fallback={<StatsCardSkeleton />}>
          <AdminSatisfactionMetrics selectedClientId={selectedClientId} />
        </Suspense>
      </div>
    </div>
  );
} 

