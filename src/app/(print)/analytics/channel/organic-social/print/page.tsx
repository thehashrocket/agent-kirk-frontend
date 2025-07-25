/**
 * @file src/app/(print)/analytics/channel/organic-social/print/page.tsx
 * Print-optimized version of the organic social analytics dashboard.
 * This page displays the social analytics content without navigation elements,
 * optimized for printing and PDF generation.
 * 
 * Features:
 * - Clean layout without header/sidebar
 * - Social analytics metrics and charts
 * - Account information
 * - Print-friendly styling
 */

'use client';

import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PrintOptimizedSproutSocialMetrics } from "@/components/channels/sprout-social/PrintOptimizedSproutSocialMetrics";

/**
 * @component PrintSocialDashboardContent
 * Inner component that uses useSearchParams - must be wrapped in Suspense
 */
function PrintSocialDashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/auth/signin");
    return null;
  }

  return (
    <div className="w-full max-w-none p-8 bg-white print:p-4 print:text-sm"
         data-print-page="true"
         style={{
           colorAdjust: 'exact',
           WebkitColorAdjust: 'exact'
         } as React.CSSProperties}>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">
          Social Media Analytics Report
        </h1>
        <p className="text-gray-600 mb-2">
          Generated for: {session.user.name || session.user.email}
        </p>
        <p className="text-sm text-gray-500">
          Generated on: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<div className="text-center p-8" data-testid="loading">Loading social analytics data...</div>}>
          <div data-testid="social-content">
            <PrintOptimizedSproutSocialMetrics accountId={accountId} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}

/**
 * @component PrintSocialDashboard
 * Print-optimized version of the organic social analytics dashboard.
 * Wraps the content in Suspense to handle useSearchParams()
 */
export default function PrintSocialDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-center">Loading...</div></div>}>
      <PrintSocialDashboardContent />
    </Suspense>
  );
} 