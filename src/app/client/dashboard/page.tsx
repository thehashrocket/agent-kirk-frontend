/**
 * @file src/app/client/dashboard/page.tsx
 * Client dashboard landing page for CLIENT users.
 *
 * Features:
 * - Authentication guard with role enforcement
 * - Personalized welcome message and breadcrumbs
 * - Channel picker linking to detailed analytics dashboards
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BreadCrumbs from "@/components/layout/BreadCrumbs";
import { prisma } from "@/lib/prisma";
import { ClientDashboardPicker } from "@/components/dashboard/ClientDashboardPicker";
/**
 * @component ClientDashboard
 * @path src/app/client/dashboard/page.tsx
 * Main dashboard page for client users.
 *
 * Features:
 * - Authentication and role-based access control
 * - Personalized greeting with breadcrumb context
 * - Channel picker entry point to analytics dashboards
 *
 * Layout:
 * - Container layout with responsive spacing
 * - Channel picker grid adapts to screen size
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

  const result = await prisma.user.findMany({
    where: {
      email: session.user.email
    },
    include: {
      userToGaAccounts: {
        include: {
          gaAccount: true
        }
      }
    }
  });

  // return gaAccount or null
  const gaAccounts = result.flatMap(user => user.userToGaAccounts.map((uta: { gaAccount: any; }) => uta.gaAccount));

  // if there are no GaAccounts, return null
  if (!gaAccounts || gaAccounts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4">No Google Analytics Accounts Found</h2>
<p className="text-gray-600">It seems you don&apos;t have any Google Analytics accounts linked to your profile.</p>
        <p className="text-gray-600">Please contact support or your Account Representative for assistance.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <BreadCrumbs breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/client/dashboard" }]} />
          <h1 className="text-2xl font-bold mb-2 text-primary uppercase">
            Welcome back, {session.user.name || session.user.email}
          </h1>
          <p className="text-gray-600">Here&apos;s an overview of your account activity</p>
        </div>
      </div>

      <div className="mt-8">
        <ClientDashboardPicker />
      </div>
    </div>
  );
}
