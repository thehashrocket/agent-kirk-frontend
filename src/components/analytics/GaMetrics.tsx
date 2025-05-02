/**
 * @file src/components/analytics/GaMetrics.tsx
 * Server component that fetches and displays Google Analytics metrics for a client dashboard.
 * Handles session/auth and data fetching, and renders GaMetricsGrid.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GaMetricsGrid } from "./GaMetricsGrid";

/**
 * @component GaMetrics
 * Server component that fetches and displays Google Analytics metrics.
 * Uses Suspense for loading state management.
 *
 * @returns {Promise<JSX.Element>} GA metrics grid
 */
export default async function GaMetrics() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const apiUrl = `${process.env.NEXTAUTH_URL}/api/client/ga-metrics`;
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Authorization': `Bearer ${session.user.id}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GA metrics');
  }

  const data = await response.json();
  return <GaMetricsGrid data={data} />;
} 