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
import type { PaidSearchFacebookCampaignsProps } from './types';

export function PaidSearchFacebookCampaigns({ facebookCampaigns, isLoading = false }: PaidSearchFacebookCampaignsProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, yearIndex) => (
          <Card key={yearIndex}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Sort campaigns by year (descending)
  const sortedCampaigns = [...facebookCampaigns].sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-6">
      {sortedCampaigns.map((yearData) => (
        <Card key={yearData.year}>
          <CardHeader>
            <CardTitle>Kickaroos {yearData.year} Facebook Campaigns Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Facebook Ads Numbers | {yearData.year}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Ad Set Name</TableHead>
                    <TableHead className="w-24 text-right">Amount Spent</TableHead>
                    <TableHead className="w-20 text-right">Link Clicks</TableHead>
                    <TableHead className="w-16 text-right">CTR (All)</TableHead>
                    <TableHead className="w-16 text-right">CPC (All)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearData.campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-[200px] truncate" title={campaign.name}>
                          {campaign.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(campaign.amountSpent)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(campaign.linkClicks)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPercentage(campaign.ctr)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(campaign.cpc)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Grand Total Row */}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Grand Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(yearData.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(yearData.totalLinkClicks)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPercentage(yearData.avgCtr)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(yearData.avgCpc)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {yearData.campaigns.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No Facebook campaign data available for {yearData.year}
              </div>
            )}

            {/* Summary Stats */}
            {yearData.campaigns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Campaigns</p>
                  <p className="text-lg font-semibold">{yearData.campaigns.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-semibold">{formatCurrency(yearData.totalSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Link Clicks</p>
                  <p className="text-lg font-semibold">{formatNumber(yearData.totalLinkClicks)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg CTR</p>
                  <p className="text-lg font-semibold">{formatPercentage(yearData.avgCtr)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {facebookCampaigns.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            No Facebook campaign data available
          </CardContent>
        </Card>
      )}
    </div>
  );
} 