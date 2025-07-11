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
import { ExternalLink } from 'lucide-react';
import type { EmailCampaignActivityProps } from './types';

export function EmailCampaignActivity({ campaigns, isLoading = false }: EmailCampaignActivityProps) {
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last 12 Calendar Months, Year Over Year Comparison
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
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
        <CardTitle>Campaign Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Last 12 Calendar Months, Year Over Year Comparison
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Campaign Name</TableHead>
                <TableHead className="w-24 text-right">Delivered</TableHead>
                <TableHead className="w-16 text-right">Opens</TableHead>
                <TableHead className="w-16 text-right">Clicks</TableHead>
                <TableHead className="w-16 text-right">Bounces</TableHead>
                <TableHead className="w-20 text-right">Unsubscribes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.campaignId}>
                  <TableCell className="font-medium max-w-[200px] truncate">{campaign.campaignName}</TableCell>
                  <TableCell className="text-right font-mono">{campaign.delivered.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{campaign.opens.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{campaign.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{campaign.bounces.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{campaign.unsubscribes.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {campaigns.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
            <span>1 - 10 / {campaigns.length}</span>
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