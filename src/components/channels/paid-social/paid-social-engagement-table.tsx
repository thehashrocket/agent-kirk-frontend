import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PaidSocialEngagementTableProps } from './types';

export function PaidSocialEngagementTable({ engagementData, isLoading = false }: PaidSocialEngagementTableProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook & Instagram Ads Engagement</CardTitle>
          <p className="text-sm text-muted-foreground">
            by Campaign Start Date: January 1st, 2025 to Today
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facebook & Instagram Ads Engagement</CardTitle>
        <p className="text-sm text-muted-foreground">
          by Campaign Start Date: January 1st, 2025 to Today
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Campaign Name</TableHead>
                <TableHead className="w-24">Start Date</TableHead>
                <TableHead className="w-24">End Date</TableHead>
                <TableHead className="w-20 text-right">Reach</TableHead>
                <TableHead className="w-24 text-right">Impressions</TableHead>
                <TableHead className="w-24 text-right">Engagement</TableHead>
                <TableHead className="w-20 text-right">Link Clicks</TableHead>
                <TableHead className="w-20 text-right">Link CTR%</TableHead>
                <TableHead className="w-24 text-right">Cost / Link Click</TableHead>
                <TableHead className="w-16 text-right">LPVs</TableHead>
                <TableHead className="w-20 text-right">Cost / LPV</TableHead>
                <TableHead className="w-24 text-right">Amount Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engagementData.map((engagement) => (
                <TableRow key={engagement.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-[200px] truncate" title={engagement.campaignName}>
                      {engagement.campaignName}
                    </div>
                  </TableCell>
                  <TableCell>{engagement.startDate}</TableCell>
                  <TableCell>{engagement.endDate || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(engagement.reach)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(engagement.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(engagement.engagement)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(engagement.linkClicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(engagement.linkCtr)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(engagement.costPerLinkClick)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(engagement.lpvs)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(engagement.costPerLpv)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(engagement.amountSpent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {engagementData.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            No engagement data available
          </div>
        )}

        {engagementData.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
            <span>1 - {Math.min(10, engagementData.length)} / {engagementData.length}</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border rounded hover:bg-accent">
                ←
              </button>
              <button className="px-3 py-1 border rounded hover:bg-accent">
                →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 