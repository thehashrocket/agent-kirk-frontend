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
import type { PaidSearchCampaignsTableProps } from './types';

export function PaidSearchCampaignsTable({ campaigns, isLoading = false }: PaidSearchCampaignsTableProps) {
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatNumber = (value: number) => value.toLocaleString();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kickaroos All Campaigns Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Google Ads Numbers | All Time
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
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
        <CardTitle>Kickaroos All Campaigns Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Google Ads Numbers | All Time
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px]">Campaign</TableHead>
                <TableHead className="w-20 text-right">Clicks</TableHead>
                <TableHead className="w-16 text-right">CTR%</TableHead>
                <TableHead className="w-24 text-right">Avg CPC</TableHead>
                <TableHead className="w-24 text-right">Conversions</TableHead>
                <TableHead className="w-24 text-right">Phone Calls</TableHead>
                <TableHead className="w-32 text-right">Cost / Conv.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="max-w-[250px] truncate" title={campaign.name}>
                      {campaign.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.clicks)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(campaign.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(campaign.avgCpc)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.conversions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.phoneCalls)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(campaign.costPerConversion)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {campaigns.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            No campaign data available
          </div>
        )}

        {campaigns.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
            <span>1 - {campaigns.length} / {campaigns.length}</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border rounded hover:bg-accent" disabled>
                ←
              </button>
              <button className="px-3 py-1 border rounded hover:bg-accent" disabled>
                →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 