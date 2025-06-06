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
import type { PaidSocialCampaignOverviewProps } from './types';

export function PaidSocialCampaignOverview({ campaignOverview, isLoading = false }: PaidSocialCampaignOverviewProps) {
  const formatNumber = (value: number) => value.toLocaleString();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            by Campaign: January 1st, 2025 to Today
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Campaign Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              by Campaign: January 1st, 2025 to Today
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span>Campaign</span>
              <select className="border rounded px-2 py-1 text-xs bg-background">
                <option>All Campaigns</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span>Source</span>
              <select className="border rounded px-2 py-1 text-xs bg-background">
                <option>All Sources</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span>Ad Content</span>
              <select className="border rounded px-2 py-1 text-xs bg-background">
                <option>All Ad Content</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Campaign</TableHead>
                <TableHead className="w-40">Source</TableHead>
                <TableHead className="min-w-[250px]">Ad Content</TableHead>
                <TableHead className="w-20 text-right">Users</TableHead>
                <TableHead className="w-24 text-right">New Users</TableHead>
                <TableHead className="w-20 text-right">Sessions</TableHead>
                <TableHead className="w-32 text-right">Avg. Session Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignOverview.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.campaign}
                  </TableCell>
                  <TableCell>
                    {campaign.source}
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="truncate" title={campaign.adContent}>
                      {campaign.adContent}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.users)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.newUsers)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(campaign.sessions)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.avgSessionDuration}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {campaignOverview.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            No campaign overview data available
          </div>
        )}

        {campaignOverview.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
            <span>1 - {Math.min(10, campaignOverview.length)} / {Math.max(campaignOverview.length, 246)}</span>
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