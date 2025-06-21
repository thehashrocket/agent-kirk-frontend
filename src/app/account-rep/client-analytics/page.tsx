/**
 * @file src/app/account-rep/client-analytics/page.tsx
 * Account Rep client analytics page that allows account representatives to select their assigned clients and view their analytics.
 * Provides the same analytics view as the admin dashboard but with account rep-level access control.
 * 
 * Features:
 * - Account Rep authentication and role-based access control
 * - Client selection dropdown (only assigned clients)
 * - Google Analytics account and property selection for the chosen client
 * - Analytics data display matching the admin dashboard experience
 * - Print functionality for reports
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAccountRepClientsWithGaData } from "@/lib/admin-client-reports";
import { AccountRepClientAnalytics } from "@/components/account-rep/account-rep-client-analytics";

/**
 * @component AccountRepClientAnalyticsPage
 * @path src/app/account-rep/client-analytics/page.tsx
 * Main page for account rep client analytics functionality.
 * 
 * Features:
 * - Authentication check for ACCOUNT_REP role
 * - Client selection interface (restricted to assigned clients)
 * - Google Analytics data visualization for selected client
 * - Same analytics experience as admin dashboard but scoped to account rep's clients
 * - Print-friendly analytics reports
 * 
 * Authentication:
 * - Requires valid session with ACCOUNT_REP role
 * - Redirects to sign-in page if not authenticated or unauthorized
 * 
 * @param {object} props - Page props
 * @param {Promise<{ clientId?: string }>} props.searchParams - URL search parameters
 * @throws {Redirect} Redirects to /auth/signin if user is not authenticated or not an ACCOUNT_REP
 */
export default async function AccountRepClientAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ACCOUNT_REP") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  const { clientId } = await searchParams;
  const selectedClientId = clientId || undefined;

  // Get only the clients assigned to this account rep with their GA data
  const clientsWithGaData = await getAccountRepClientsWithGaData(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Client Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Select one of your assigned clients to view their Google Analytics data and reports
        </p>
        <p className="text-gray-600">
            Only your clients with active Google Analytics accounts will be shown.
        </p>
      </div>

      <Suspense fallback={<div>Loading client analytics...</div>}>
        <AccountRepClientAnalytics 
          clientsWithGaData={clientsWithGaData}
          selectedClientId={selectedClientId}
        />
      </Suspense>
    </div>
  );
}
