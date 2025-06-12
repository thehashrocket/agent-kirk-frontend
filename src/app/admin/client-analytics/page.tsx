/**
 * @file src/app/admin/client-analytics/page.tsx
 * Admin client analytics page that allows administrators to select a client and view their analytics.
 * Provides the same analytics view as the client dashboard but with admin-level access.
 * 
 * Features:
 * - Admin authentication and role-based access control
 * - Client selection dropdown
 * - Google Analytics account and property selection for the chosen client
 * - Analytics data display matching the client dashboard experience
 * - Print functionality for reports
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAllClientsWithGaData } from "@/lib/admin-client-reports";
import { AdminClientAnalytics } from "@/components/admin/admin-client-analytics";

/**
 * @component AdminClientAnalyticsPage
 * @path src/app/admin/client-analytics/page.tsx
 * Main page for admin client analytics functionality.
 * 
 * Features:
 * - Authentication check for ADMIN role
 * - Client selection interface
 * - Google Analytics data visualization for selected client
 * - Same analytics experience as client dashboard
 * - Print-friendly analytics reports
 * 
 * Authentication:
 * - Requires valid session with ADMIN role
 * - Redirects to sign-in page if not authenticated or unauthorized
 * 
 * @param {object} props - Page props
 * @param {Promise<{ clientId?: string }>} props.searchParams - URL search parameters
 * @throws {Redirect} Redirects to /auth/signin if user is not authenticated or not an ADMIN
 */
export default async function AdminClientAnalyticsPage({
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

  // Get all clients with their GA data for the selection dropdown
  const clientsWithGaData = await getAllClientsWithGaData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Client Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Select a client to view their Google Analytics data and reports
        </p>
        <p className="text-gray-600">
            Only clients with active Google Analytics accounts will be shown.
        </p>
      </div>

      <Suspense fallback={<div>Loading client analytics...</div>}>
        <AdminClientAnalytics 
          clientsWithGaData={clientsWithGaData}
          selectedClientId={selectedClientId}
        />
      </Suspense>
    </div>
  );
}

