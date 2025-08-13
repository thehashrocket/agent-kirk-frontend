'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, TrendingUp, Package, CheckCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableSortable, TableColumn } from '@/components/ui/TableSortable';

interface DirectMailAccount {
    id: string;
    clientName: string;
    createdAt: string;
    updatedAt: string;
}

interface DirectMailTableRow {
    campaignName: string;
    sendDate: string;
    lastScanDate: string;
    totalSent: number;
    scanned: number;
    delivered: number;
    percentOnTime: number;
    percentDelivered: number;
    percentScanned: number;
    percentFinalScan: number;
    reportId: string;
    order?: string;
    sector?: string;
    type?: string;
}

interface DirectMailSummary {
    totalCampaigns: number;
    totalSent: number;
    totalScanned: number;
    totalDelivered: number;
    avgPercentOnTime: number;
    avgPercentDelivered: number;
    scanRate: number;
    deliveryRate: number;
}

interface DirectMailMetricsResponse {
    account: DirectMailAccount;
    dateRange: {
        from: string;
        to: string;
    };
    tableData: DirectMailTableRow[];
    summary: DirectMailSummary;
}

interface DirectMailMetricsProps {
    selectedAccountId?: string | null;
    onAccountChange?: (accountId: string | null) => void;
}

export default function DirectMailMetrics({ selectedAccountId, onAccountChange }: DirectMailMetricsProps) {
    const [data, setData] = useState<DirectMailMetricsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<DirectMailAccount[]>([]);
    const [dateRange, setDateRange] = useState({
        from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd'),
    });

    // Filter states
    const [filters, setFilters] = useState({
        campaignName: '',
        sendDate: '',
        lastScanDate: '',
    });

    // Fetch available accounts
    const fetchAccounts = useCallback(async () => {
        try {
            const response = await fetch('/api/client/direct-mail-accounts');
            if (!response.ok) {
                throw new Error('Failed to fetch Direct Mail accounts');
            }
            const accountsData = await response.json();
            setAccounts(accountsData);
        } catch (error) {
            console.error('Error fetching Direct Mail accounts:', error);
        }
    }, []);

    // Fetch Direct Mail metrics
    const fetchDirectMailMetrics = useCallback(async (customDateRange?: { from: string; to: string }) => {
        if (!selectedAccountId) return;

        setIsLoading(true);
        setError(null);

        try {
            const range = customDateRange || dateRange;
            const params = new URLSearchParams({
                accountId: selectedAccountId,
                from: range.from,
                to: range.to,
            });

            const response = await fetch(`/api/client/direct-mail-metrics?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch Direct Mail metrics');
            }

            const metricsData = await response.json();
            setData(metricsData);
        } catch (error) {
            console.error('Error fetching Direct Mail metrics:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch Direct Mail metrics');
        } finally {
            setIsLoading(false);
        }
    }, [selectedAccountId, dateRange]);

    // Handle account selection
    const handleAccountChange = useCallback((accountId: string) => {
        if (onAccountChange) {
            onAccountChange(accountId);
        }
    }, [onAccountChange]);

    // Handle date range change
    const handleDateRangeChange = useCallback(() => {
        fetchDirectMailMetrics();
    }, [fetchDirectMailMetrics]);

    // Fetch accounts on mount
    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // Fetch data when account or date range changes
    useEffect(() => {
        if (selectedAccountId) {
            fetchDirectMailMetrics();
        }
    }, [selectedAccountId, fetchDirectMailMetrics]);

    // Format percentage for display
    const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

    // Format number with commas
    const formatNumber = (value: number) => value.toLocaleString();

    // Filter data based on current filters
    const filteredData = useMemo(() => {
        if (!data?.tableData) return [];

        return data.tableData.filter((row) => {
            const matchesCampaignName = !filters.campaignName ||
                row.campaignName.toLowerCase().includes(filters.campaignName.toLowerCase());
            const matchesSendDate = !filters.sendDate ||
                row.sendDate.includes(filters.sendDate);
            const matchesLastScanDate = !filters.lastScanDate ||
                row.lastScanDate.includes(filters.lastScanDate);

            return matchesCampaignName && matchesSendDate && matchesLastScanDate;
        });
    }, [data?.tableData, filters]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({
            campaignName: '',
            sendDate: '',
            lastScanDate: '',
        });
    }, []);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(filter => filter !== '');
    }, [filters]);

    // Table columns configuration
    const columns: TableColumn<DirectMailTableRow>[] = useMemo(() => [
        {
            header: 'Campaign Name',
            accessor: 'campaignName',
            sortable: true,
            render: (value) => <span className="font-medium">{value}</span>
        },
        {
            header: 'Send Date',
            accessor: 'sendDate',
            sortable: true,
        },
        {
            header: 'Last Scan Date',
            accessor: 'lastScanDate',
            sortable: true,
        },
        {
            header: 'Total Sent',
            accessor: 'totalSent',
            align: 'right',
            sortable: true,
            render: (value) => formatNumber(value)
        },
        {
            header: 'Scanned',
            accessor: 'scanned',
            align: 'right',
            sortable: true,
            render: (value) => formatNumber(value)
        },
        {
            header: 'Delivered',
            accessor: 'delivered',
            align: 'right',
            sortable: true,
            render: (value) => formatNumber(value)
        },
        {
            header: '% On Time',
            accessor: 'percentOnTime',
            align: 'right',
            sortable: true,
            render: (value) => formatPercentage(value)
        },
        {
            header: '% Delivered',
            accessor: 'percentDelivered',
            align: 'right',
            sortable: true,
            render: (value) => formatPercentage(value)
        }
    ], []);

    return (
        <div className="space-y-6">
            {/* Account Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Direct Mail Account
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="flex-1">
                            <Label htmlFor="account-select">Select Account</Label>
                            <select
                                id="account-select"
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                value={selectedAccountId || ''}
                                onChange={(e) => handleAccountChange(e.target.value)}
                            >
                                <option value="">Select an account...</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.clientName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <div>
                                <Label htmlFor="from-date">From</Label>
                                <Input
                                    id="from-date"
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="to-date">To</Label>
                                <Input
                                    id="to-date"
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleDateRangeChange} disabled={isLoading}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Update
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {data && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(data.summary.totalCampaigns)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(data.summary.totalSent)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(data.summary.deliveryRate)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg % On Time</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPercentage(data.summary.avgPercentOnTime)}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content */}
            {error ? (
                <Card>
                    <CardContent className="py-6">
                        <p className="text-center text-red-500">{error}</p>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <Card>
                    <CardContent className="py-6">
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <p className="text-center text-muted-foreground">Loading Direct Mail analytics data...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : data && data.tableData.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Performance</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredData.length} of {data.tableData.length} campaigns from {data.dateRange.from} to {data.dateRange.to}
                        </p>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Filters
                                </h3>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="h-8 px-2 lg:px-3"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="filter-campaign-name" className="text-xs">Campaign Name</Label>
                                    <Input
                                        id="filter-campaign-name"
                                        placeholder="Search campaigns..."
                                        value={filters.campaignName}
                                        onChange={(e) => setFilters(prev => ({ ...prev, campaignName: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="filter-send-date" className="text-xs">Send Date</Label>
                                    <Input
                                        id="filter-send-date"
                                        placeholder="Search send date..."
                                        value={filters.sendDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sendDate: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="filter-last-scan-date" className="text-xs">Last Scan Date</Label>
                                    <Input
                                        id="filter-last-scan-date"
                                        placeholder="Search scan date..."
                                        value={filters.lastScanDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, lastScanDate: e.target.value }))}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <TableSortable
                                columns={columns}
                                data={filteredData}
                                rowKey={(row) => `${row.campaignName}-${row.reportId}`}
                                initialSort={{ accessor: 'sendDate', direction: 'desc' }}
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : selectedAccountId ? (
                <Card>
                    <CardContent className="py-6">
                        <p className="text-center text-muted-foreground">
                            {data && data.tableData.length > 0 && filteredData.length === 0
                                ? 'No campaigns match the current filters.'
                                : 'No Direct Mail campaigns found for the selected date range.'}
                        </p>
                        {data && data.tableData.length > 0 && filteredData.length === 0 && hasActiveFilters && (
                            <div className="flex justify-center mt-4">
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear Filters
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-6">
                        <p className="text-center text-muted-foreground">
                            Select an account to view Direct Mail analytics.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
