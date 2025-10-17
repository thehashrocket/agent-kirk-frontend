/**
 * @file src/app/(print)/analytics/channel/direct/print/page.tsx
 * Print-optimized Direct Mail analytics report page.
 */

'use client';

import { useSession } from 'next-auth/react';
import { redirect, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import type { CSSProperties } from 'react';
import { PrintOptimizedDirectMailMetrics } from '@/components/channels/direct-mail/PrintOptimizedDirectMailMetrics';

function PrintDirectMailDashboardContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const clientId = searchParams.get('clientId');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    redirect('/auth/signin');
    return null;
  }

  const allowedRoles = ['CLIENT', 'ACCOUNT_REP'];
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/auth/signin');
    return null;
  }

  return (
    <div
      className="w-full max-w-none p-8 bg-white print:p-4 print:text-sm"
      data-print-page="true"
      style={{
        colorAdjust: 'exact',
        WebkitColorAdjust: 'exact',
      } as CSSProperties}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Direct Mail Analytics Report</h1>
        <p className="text-gray-600 mb-2">
          Generated for: {session.user.name || session.user.email}
        </p>
        <p className="text-sm text-gray-500">
          Generated on:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="space-y-8">
        <Suspense fallback={<div className="text-center p-8" data-testid="loading">Loading Direct Mail analytics data...</div>}>
          <PrintOptimizedDirectMailMetrics accountId={accountId} clientId={clientId} />
        </Suspense>
      </div>
    </div>
  );
}

export default function PrintDirectMailDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-center">Loading...</div></div>}>
      <PrintDirectMailDashboardContent />
    </Suspense>
  );
}
