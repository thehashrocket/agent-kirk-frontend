/**
 * @file src/app/client/dashboard/page.tsx
 * Client dashboard page that provides a comprehensive overview of client activity and services.
 * Built using Next.js App Router and Server Components for optimal performance.
 * 
 * Features:
 * - Real-time usage statistics
 * - Google Analytics metrics
 * - LLM query interface
 * - Recent query history
 * - Quick action links
 * - Usage monitoring
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import GaMetrics from "@/components/analytics/GaMetrics";
import BreadCrumbs from "@/components/layout/BreadCrumbs";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { ClientDashboardContent } from "@/components/dashboard/ClientDashboardContent";

/**
 * @component ClientDashboard
 * @path src/app/client/dashboard/page.tsx
 * Main dashboard page for client users.
 * 
 * Features:
 * - Authentication and role-based access control
 * - Real-time usage statistics with Suspense
 * - Google Analytics metrics with Suspense
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <BreadCrumbs breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/client/dashboard" }]} />
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {session.user.name || session.user.email}
          </h1>
          <p className="text-gray-600">Here&apos;s an overview of your account activity</p>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Loading analytics...</div>}>
          <ClientDashboardContent />
        </Suspense>
      </div>

    </div>
  );
} 