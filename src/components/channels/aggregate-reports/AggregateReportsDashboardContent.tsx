'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { TableSortable, type TableColumn } from '@/components/ui/TableSortable';
import { Loader2, Mail, Package, TrendingUp, BarChart3, RotateCcw, Download, Search } from 'lucide-react';
import { EmailClientSelector, type EmailClient } from '../email/email-client-selector';
import type { DirectMailAccount } from '../direct-mail/types';

interface AggregatedCampaignData {
  campaignName: string;
  emailsSent: number;
  emailClicks: number;
  emailClickThroughRate: number;
  uspsPiecesSent: number;
  uspsDelivered: number;
  uspsUndelivered: number;
  uspsSentDate: string | null;
  uspsReceivedByPostOfficeDate: string | null;
  uspsDeliveredToHomesDate: string | null;
  conversionRate: number;
}

type AggregatedCampaignRow = AggregatedCampaignData & {
  deliveryRate: number;
};

const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const createDefaultDateRange = () => {
  const to = new Date();
  const from = subDays(to, 29);
  return { from, to };
};

const formatDateLabel = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'MMM d, yyyy');
};

const toCsvCell = (value: string | number | null) => {
  if (value === null || value === undefined) {
    return '""';
  }
  const serialized = typeof value === 'number' ? value.toString() : value;
  return `"${serialized.replace(/"/g, '""')}"`;
};

export function AggregateReportsDashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [selectedEmailClientId, setSelectedEmailClientId] = useState<string | null>(null);
  const [selectedEmailClient, setSelectedEmailClient] = useState<EmailClient | null>(null);
  const [selectedUspsAccountId, setSelectedUspsAccountId] = useState<string | null>(null);
  const [selectedUspsAccountName, setSelectedUspsAccountName] = useState<string | null>(null);
  const [directMailAccounts, setDirectMailAccounts] = useState<DirectMailAccount[]>([]);
  const [isLoadingDirectMailAccount, setIsLoadingDirectMailAccount] = useState(true);
  const [directMailAccountError, setDirectMailAccountError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(createDefaultDateRange);
  const [campaigns, setCampaigns] = useState<AggregatedCampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const activeUserId = clientId ?? session?.user?.id ?? null;
  const canFetch = Boolean(
    activeUserId &&
    selectedEmailClientId &&
    selectedUspsAccountId &&
    !isLoadingDirectMailAccount &&
    !directMailAccountError
  );
  const emptyStateMessage = (() => {
    if (!selectedEmailClientId) {
      return 'Select an Email client to load aggregate campaign performance.';
    }
    if (isLoadingDirectMailAccount) {
      return 'Loading Direct Mail accounts...';
    }
    if (directMailAccountError) {
      return directMailAccountError;
    }
    if (!selectedUspsAccountId) {
      return 'No Direct Mail accounts are linked to this user yet. Contact your account rep to connect one.';
    }
    if (!activeUserId) {
      return 'You must be signed in to view aggregate reports.';
    }
    return 'Select an Email client to load aggregate campaign performance.';
  })();

  useEffect(() => {
    let isCancelled = false;

    const fetchDirectMailAccounts = async () => {
      setIsLoadingDirectMailAccount(true);
      setDirectMailAccountError(null);

      try {
        const url = clientId
          ? `/api/account-rep/direct-mail-accounts?clientId=${encodeURIComponent(clientId)}`
          : '/api/client/direct-mail-accounts';

        const response = await fetch(url);

        if (!response.ok) {
          let message = 'Failed to load Direct Mail accounts';
          try {
            const body = await response.json();
            message = body?.error || message;
          } catch {
            //
          }
          throw new Error(message);
        }

        const accounts: DirectMailAccount[] = await response.json();
        if (isCancelled) return;

        setDirectMailAccounts(accounts);

        if (accounts.length === 0) {
          setSelectedUspsAccountId(null);
          setSelectedUspsAccountName(null);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load Direct Mail accounts', err);
        setDirectMailAccountError(err instanceof Error ? err.message : 'Failed to load Direct Mail accounts');
        setDirectMailAccounts([]);
        setSelectedUspsAccountId(null);
        setSelectedUspsAccountName(null);
      } finally {
        if (!isCancelled) {
          setIsLoadingDirectMailAccount(false);
        }
      }
    };

    fetchDirectMailAccounts();

    return () => {
      isCancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!directMailAccounts.length) return;

    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matched = selectedEmailClient?.clientName
      ? directMailAccounts.find(account => normalize(account.clientName) === normalize(selectedEmailClient.clientName))
      : null;

    const nextAccount = matched ?? directMailAccounts[0] ?? null;
    if (!nextAccount) return;

    setSelectedUspsAccountId(prev => (prev === nextAccount.id ? prev : nextAccount.id));
    setSelectedUspsAccountName(nextAccount.clientName);
  }, [directMailAccounts, selectedEmailClient?.clientName]);

  useEffect(() => {
    if (!canFetch) {
      setCampaigns([]);
      return;
    }

    let isCancelled = false;

    const fetchAggregation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          userId: activeUserId!,
          emailClientId: selectedEmailClientId!,
          uspsClientId: selectedUspsAccountId!,
        });

        if (dateRange.from) {
          params.append('fromDate', format(dateRange.from, 'yyyy-MM-dd'));
        }
        if (dateRange.to) {
          params.append('toDate', format(dateRange.to, 'yyyy-MM-dd'));
        }

        const response = await fetch(`/api/channels/campaign-aggregation?${params.toString()}`);

        if (!response.ok) {
          let errorMessage = 'Failed to load aggregate data';
          try {
            const errorBody = await response.json();
            errorMessage = errorBody?.details || errorBody?.error || errorMessage;
          } catch {
            //
          }
          throw new Error(errorMessage);
        }

        const json = await response.json();
        if (isCancelled) return;

        const payload = Array.isArray(json?.data) ? json.data as AggregatedCampaignData[] : [];
        setCampaigns(payload);
        setLastUpdated(new Date());
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load campaign aggregation', err);
        setError(err instanceof Error ? err.message : 'Failed to load campaign aggregation');
        setCampaigns([]);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchAggregation();

    return () => {
      isCancelled = true;
    };
  }, [
    canFetch,
    activeUserId,
    selectedEmailClientId,
    selectedUspsAccountId,
    dateRange.from,
    dateRange.to,
    refreshToken,
  ]);

  const tableRows: AggregatedCampaignRow[] = useMemo(() => {
    return campaigns.map(campaign => ({
      ...campaign,
      emailClickThroughRate: Number.isFinite(campaign.emailClickThroughRate)
        ? campaign.emailClickThroughRate
        : 0,
      deliveryRate: campaign.uspsPiecesSent > 0
        ? (campaign.uspsDelivered / campaign.uspsPiecesSent) * 100
        : 0,
    }));
  }, [campaigns]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return tableRows;
    }
    const term = search.trim().toLowerCase();
    return tableRows.filter(row => row.campaignName.toLowerCase().includes(term));
  }, [tableRows, search]);

  const summary = useMemo(() => {
    return tableRows.reduce(
      (acc, row) => {
        acc.campaigns += 1;
        acc.emailsSent += row.emailsSent;
        acc.emailClicks += row.emailClicks;
        acc.pieces += row.uspsPiecesSent;
        acc.delivered += row.uspsDelivered;
        acc.undelivered += row.uspsUndelivered;
        return acc;
      },
      {
        campaigns: 0,
        emailsSent: 0,
        emailClicks: 0,
        pieces: 0,
        delivered: 0,
        undelivered: 0,
      }
    );
  }, [tableRows]);

  const averageCtr = summary.emailsSent
    ? (summary.emailClicks / summary.emailsSent) * 100
    : 0;
  const deliveryRate = summary.pieces
    ? (summary.delivered / summary.pieces) * 100
    : 0;

  const metricCards = [
    {
      title: 'Campaigns tracked',
      value: summary.campaigns ? summary.campaigns.toString() : '0',
      description: 'Email + Direct Mail combined',
      icon: BarChart3,
    },
    {
      title: 'Emails sent',
      value: numberFormatter.format(summary.emailsSent),
      description: `${numberFormatter.format(summary.emailClicks)} clicks`,
      icon: Mail,
    },
    {
      title: 'Email CTR',
      value: `${percentFormatter.format(averageCtr)}%`,
      description: 'Unique clicks ÷ sent',
      icon: TrendingUp,
    },
    {
      title: 'Direct mail delivered',
      value: numberFormatter.format(summary.delivered),
      description: `${percentFormatter.format(deliveryRate)}% delivery rate`,
      icon: Package,
    },
  ];

  const columns: TableColumn<AggregatedCampaignRow>[] = [
    {
      header: 'Campaign',
      accessor: 'campaignName',
      sortable: true,
      render: value => (
        <div className="max-w-xs">
          <p className="font-medium text-foreground">{truncateCampaignName(value)}</p>
        </div>
      ),
    },
    {
      header: 'Emails Sent',
      accessor: 'emailsSent',
      align: 'right',
      sortable: true,
      render: value => numberFormatter.format(value),
    },
    {
      header: 'Email Clicks',
      accessor: 'emailClicks',
      align: 'right',
      sortable: true,
      render: value => numberFormatter.format(value),
    },
    {
      header: 'Email CTR',
      accessor: 'emailClickThroughRate',
      align: 'right',
      sortable: true,
      render: value => `${percentFormatter.format(value)}%`,
    },
    {
      header: 'USPS Pieces',
      accessor: 'uspsPiecesSent',
      align: 'right',
      sortable: true,
      render: value => numberFormatter.format(value),
    },
    {
      header: 'USPS Delivered',
      accessor: 'uspsDelivered',
      align: 'right',
      sortable: true,
      render: value => numberFormatter.format(value),
    },
    {
      header: 'Delivery Rate',
      accessor: 'deliveryRate',
      align: 'right',
      sortable: true,
      render: value => `${percentFormatter.format(value)}%`,
    },
    {
      header: 'Sent to USPS',
      accessor: 'uspsSentDate',
      sortable: true,
      render: value => formatDateLabel(value),
    },
    {
      header: 'Delivered to Homes',
      accessor: 'uspsDeliveredToHomesDate',
      sortable: true,
      render: value => formatDateLabel(value),
    },
  ];

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;
    setDateRange({
      from: range.from,
      to: range.to,
    });
  };

  const handleRefresh = () => setRefreshToken(prev => prev + 1);

  const handleClearFilters = () => setSearch('');

  const handleExport = () => {
    if (!filteredRows.length) return;
    const header = [
      'Campaign',
      'Emails Sent',
      'Email Clicks',
      'Email CTR (%)',
      'USPS Pieces',
      'USPS Delivered',
      'Delivery Rate (%)',
      'Sent to USPS',
      'Delivered to Homes',
    ];

    const rows = filteredRows.map(row => [
      row.campaignName,
      row.emailsSent,
      row.emailClicks,
      row.emailClickThroughRate.toFixed(2),
      row.uspsPiecesSent,
      row.uspsDelivered,
      row.deliveryRate.toFixed(2),
      formatDateLabel(row.uspsSentDate),
      formatDateLabel(row.uspsDeliveredToHomesDate),
    ]);

    const csv = [header, ...rows]
      .map(line => line.map(toCsvCell).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `aggregate-reports_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const truncateCampaignName = (name: string, maxLength = 50) => {
    if (name.length <= maxLength) {
      return name;
    }

    return `${name.slice(0, maxLength - 3)}...`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Aggregate Reports</p>
        <h1 className="text-3xl font-semibold text-primary-900">
          {selectedEmailClient ? `${selectedEmailClient.clientName} – Cross-channel` : 'Cross-channel performance'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Combine email engagement with USPS delivery data to spot campaigns that are resonating across touchpoints.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EmailClientSelector
          onClientChange={setSelectedEmailClientId}
          onClientObjectChange={setSelectedEmailClient}
        />
        <Card>
          <CardHeader>
            <CardTitle>Direct Mail source</CardTitle>
            <p className="text-sm text-muted-foreground">
              We automatically pair your USPS account by company name so you only have to choose once.
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingDirectMailAccount ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Direct Mail accounts...
              </div>
            ) : directMailAccountError ? (
              <p className="text-sm text-red-600">{directMailAccountError}</p>
            ) : selectedUspsAccountName ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pulling USPS delivery data from</p>
                <p className="text-base font-semibold text-foreground">{selectedUspsAccountName}</p>
                {directMailAccounts.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    We matched this automatically. Let your account rep know if you need a different USPS account.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No Direct Mail accounts are linked to this user yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex md:items-center md:justify-between">
          <div>
            <CardTitle>Date range</CardTitle>
            <p className="text-sm text-muted-foreground">The same window is applied to both email and direct mail metrics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={handleDateRangeChange}
              className="w-full md:w-auto"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={!canFetch || isLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!filteredRows.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(card => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canFetch && (
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-muted-foreground">{emptyStateMessage}</p>
          </CardContent>
        </Card>
      )}

      {canFetch && (
        <Card>
          <CardHeader className="gap-4 md:flex md:items-start md:justify-between">
            <div>
              <CardTitle>Campaign breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review delivery timelines and engagement for every campaign in the selected window.
              </p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Last refreshed {format(lastUpdated, 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search campaigns"
                  className="pl-9"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                disabled={!search}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading aggregate campaign metrics...
              </div>
            )}

            {!isLoading && filteredRows.length === 0 && (
              <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                No campaigns match the current filters.
              </div>
            )}

            {!isLoading && filteredRows.length > 0 && (
              <div className="overflow-x-auto">
                <TableSortable
                  columns={columns}
                  data={filteredRows}
                  rowKey={row => row.campaignName}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
