'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, TrendingUp, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
                            Showing {data.tableData.length} campaigns from {data.dateRange.from} to {data.dateRange.to}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Campaign Name</TableHead>
                                        <TableHead>Send Date</TableHead>
                                        <TableHead>Last Scan Date</TableHead>
                                        <TableHead className="text-right">Total Sent</TableHead>
                                        <TableHead className="text-right">Scanned</TableHead>
                                        <TableHead className="text-right">Delivered</TableHead>
                                        <TableHead className="text-right">% On Time</TableHead>
                                        <TableHead className="text-right">% Delivered</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.tableData.map((row, index) => (
                                        <TableRow key={`${row.campaignName}-${index}`}>
                                            <TableCell className="font-medium">{row.campaignName}</TableCell>
                                            <TableCell>{row.sendDate}</TableCell>
                                            <TableCell>{row.lastScanDate}</TableCell>
                                            <TableCell className="text-right">{formatNumber(row.totalSent)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(row.scanned)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(row.delivered)}</TableCell>
                                            <TableCell className="text-right">{formatPercentage(row.percentOnTime)}</TableCell>
                                            <TableCell className="text-right">{formatPercentage(row.percentDelivered)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : selectedAccountId ? (
                <Card>
                    <CardContent className="py-6">
                        <p className="text-center text-muted-foreground">
                            No Direct Mail campaigns found for the selected date range.
                        </p>
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
