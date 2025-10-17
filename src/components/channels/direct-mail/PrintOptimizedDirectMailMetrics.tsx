/**
 * @file src/components/channels/direct-mail/PrintOptimizedDirectMailMetrics.tsx
 * Print-friendly Direct Mail metrics container that handles data fetching and error states.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { subDays, format } from 'date-fns';
import type { DirectMailMetricsResponse } from '@/lib/services/direct-mail-metrics';
import { PrintOptimizedDirectMailDashboard } from './PrintOptimizedDirectMailDashboard';

interface PrintOptimizedDirectMailMetricsProps {
  accountId?: string | null;
  clientId?: string | null;
}

export function PrintOptimizedDirectMailMetrics({
  accountId: accountIdFromProps,
  clientId: clientIdFromProps,
}: PrintOptimizedDirectMailMetricsProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const accountId = useMemo(() => accountIdFromProps ?? searchParams.get('accountId'), [accountIdFromProps, searchParams]);
  const clientId = useMemo(() => clientIdFromProps ?? searchParams.get('clientId'), [clientIdFromProps, searchParams]);

  const [data, setData] = useState<DirectMailMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = session?.user?.role;

  const buildDefaultDateRange = () => {
    const to = new Date();
    const from = subDays(to, 30);
    return {
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
    };
  };

  const fetchMetrics = useCallback(async () => {
    if (!role) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = buildDefaultDateRange();
      let targetAccountId = accountId ?? '';

      if (!targetAccountId) {
        let accountsUrl: string | null = null;

        if (role === 'CLIENT') {
          accountsUrl = '/api/client/direct-mail-accounts';
        } else if (role === 'ACCOUNT_REP') {
          if (!clientId) {
            throw new Error('Client ID is required to load account data.');
          }
          accountsUrl = `/api/account-rep/direct-mail-accounts?clientId=${encodeURIComponent(clientId)}`;
        }

        if (!accountsUrl) {
          throw new Error('Unable to load Direct Mail accounts for this role.');
        }

        const accountsResponse = await fetch(accountsUrl);
        if (!accountsResponse.ok) {
          const errorData = await accountsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch Direct Mail accounts');
        }
        const accounts = await accountsResponse.json();
        if (!accounts || accounts.length === 0) {
          throw new Error('No Direct Mail accounts found');
        }
        targetAccountId = accounts[0].id;
      }

      const metricParams = new URLSearchParams({
        accountId: targetAccountId,
        from: params.from,
        to: params.to,
      });

      let metricsUrl: string;
      if (role === 'CLIENT') {
        metricsUrl = `/api/client/direct-mail-metrics?${metricParams.toString()}`;
      } else if (role === 'ACCOUNT_REP') {
        if (!clientId) {
          throw new Error('Client ID is required to load metrics for account representatives.');
        }
        metricParams.append('clientId', clientId);
        metricsUrl = `/api/account-rep/direct-mail-metrics?${metricParams.toString()}`;
      } else {
        throw new Error('Direct Mail print is not available for this user role.');
      }

      const metricsResponse = await fetch(metricsUrl);
      if (!metricsResponse.ok) {
        const errorData = await metricsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch Direct Mail metrics');
      }

      const metricsData: DirectMailMetricsResponse = await metricsResponse.json();
      setData(metricsData);
    } catch (err) {
      console.error('Error fetching Direct Mail metrics for print:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Direct Mail metrics');
    } finally {
      setIsLoading(false);
    }
  }, [role, accountId, clientId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2" data-testid="loading">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-center text-muted-foreground">Loading Direct Mail data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">No Direct Mail analytics data available.</p>
        </CardContent>
      </Card>
    );
  }

  return <PrintOptimizedDirectMailDashboard data={data} />;
}
