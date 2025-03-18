import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import LLMForm from "@/components/LLMForm";
import QueryHistory from "@/components/QueryHistory";

async function ClientStats() {
  // In a real application, these would be fetched from your API
  const stats = [
    {
      title: "Queries This Month",
      value: await getMonthlyQueries(),
      change: 15,
    },
    {
      title: "Average Response Time",
      value: "1.2s",
      change: -8,
    },
    {
      title: "Success Rate",
      value: "98.5%",
      change: 0.5,
    },
    {
      title: "API Credits Left",
      value: await getApiCredits(),
      change: -22,
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

async function getMonthlyQueries() {
  // Implement actual API call
  return "1,543";
}

async function getApiCredits() {
  // Implement actual API call
  return "8,750";
}

const recentQueries = [
  {
    id: 1,
    query: "How to implement authentication in Next.js?",
    time: "10 minutes ago",
    status: "success",
  },
  {
    id: 2,
    query: "Best practices for React performance optimization",
    time: "1 hour ago",
    status: "success",
  },
  {
    id: 3,
    query: "Debugging memory leaks in Node.js",
    time: "3 hours ago",
    status: "partial",
  },
];

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
            <div className="space-y-4">
              {recentQueries.map((query) => (
                <div 
                  key={query.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-900">{query.query}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">{query.time}</span>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${
                        query.status === "success" 
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {query.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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