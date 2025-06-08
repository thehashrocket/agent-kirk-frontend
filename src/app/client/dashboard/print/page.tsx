/**
 * @file src/app/client/dashboard/print/page.tsx
 * Print-optimized version of the client dashboard.
 * This page displays the dashboard content without navigation elements,
 * optimized for printing and PDF generation.
 * 
 * Features:
 * - Clean layout without header/sidebar
 * - Google Analytics metrics and charts
 * - Account and property information
 * - Print-friendly styling
 */

'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PrintOptimizedGaMetrics } from "@/components/analytics/PrintOptimizedGaMetrics";

/**
 * @component PrintDashboard
 * Print-optimized version of the client dashboard.
 * 
 * Features:
 * - No header, sidebar, or navigation elements
 * - Full-width layout optimized for printing
 * - All dashboard data and charts
 * - Clean typography and spacing
 * 
 * Authentication:
 * - Requires valid session with CLIENT role
 * - Redirects to sign-in if not authenticated
 */
export default function PrintDashboard() {
  const { data: session, status } = useSession();

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
          Analytics Dashboard Report
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
        <Suspense fallback={<div className="text-center p-8" data-testid="loading">Loading analytics data...</div>}>
          <div data-testid="analytics-content">
            <PrintOptimizedGaMetrics />
          </div>
        </Suspense>
      </div>
    </div>
  );
} 