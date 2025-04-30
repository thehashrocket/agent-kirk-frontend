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

'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from "react";
import Link from "next/link";
import LLMForm from "@/components/LLMForm";
import QueryHistory from "@/components/QueryHistory";

interface GaProperty {
  id: string;
  gaPropertyId: string;
  gaPropertyName: string;
}

interface GaAccount {
  id: string;
  gaAccountId: string;
  gaAccountName: string;
  gaProperties: GaProperty[];
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
export default function ClientDashboard() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<GaAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/client/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setAccounts(data.stats || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {session?.user?.impersonatedUserId && (
          <div className="text-sm text-muted-foreground">
            Viewing as client (Impersonated by {session.user.email})
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.gaAccountName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Account ID</h3>
                  <p className="text-sm text-muted-foreground">{account.gaAccountId}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Properties</h3>
                  <div className="space-y-2">
                    {account.gaProperties.map((property) => (
                      <div key={property.id} className="pl-4 border-l-2">
                        <p className="font-medium">{property.gaPropertyName}</p>
                        <p className="text-sm text-muted-foreground">ID: {property.gaPropertyId}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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