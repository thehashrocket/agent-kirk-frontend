/**
 * @file src/app/admin/reports/page.tsx
 * Admin reports page component that displays various analytics and reporting components.
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportContent } from "@/components/reports/report-content";

export const metadata: Metadata = {
  title: "Admin Reports",
  description: "Comprehensive reports and analytics dashboard for administrators",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="h-[400px] w-full animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <ReportContent />
      </Suspense>
    </div>
  );
} 