import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";

async function AccountRepStats() {
  // In a real application, these would be fetched from your API
  const stats = [
    {
      title: "Active Clients",
      value: await getActiveClients(),
      change: 5,
    },
    {
      title: "Open Tickets",
      value: await getOpenTickets(),
      change: -12,
    },
    {
      title: "Response Rate",
      value: "94.8%",
      change: 2.3,
    },
    {
      title: "Client Satisfaction",
      value: "4.7/5",
      change: 0.2,
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

async function getActiveClients() {
  // Implement actual API call
  return "48";
}

async function getOpenTickets() {
  // Implement actual API call
  return "23";
}

const recentActivities = [
  {
    id: 1,
    client: "Acme Corp",
    action: "Submitted new ticket",
    time: "5 minutes ago",
    status: "pending",
  },
  {
    id: 2,
    client: "TechStart Inc",
    action: "Updated profile",
    time: "2 hours ago",
    status: "completed",
  },
  {
    id: 3,
    client: "Global Solutions",
    action: "Requested consultation",
    time: "1 day ago",
    status: "pending",
  },
];

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

      <Suspense fallback={<div>Loading stats...</div>}>
        <AccountRepStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{activity.client}</h3>
                  <p className="text-sm text-gray-600">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span 
                  className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === "pending" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
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
            <Link 
              href="/account-rep/tickets" 
              className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="font-medium">Support Tickets</h3>
              <p className="text-sm text-gray-600">Handle open support requests</p>
            </Link>
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
    </div>
  );
} 