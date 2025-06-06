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
                <TableHead className="w-24">Delivered</TableHead>
                <TableHead className="w-20">Week Day</TableHead>
                <TableHead className="min-w-[300px]">Campaign Subject Line</TableHead>
                <TableHead className="w-32">Link</TableHead>
                <TableHead className="w-24 text-right">Successful Deliveries</TableHead>
                <TableHead className="w-16 text-right">Opens</TableHead>
                <TableHead className="w-20 text-right">Open Rate</TableHead>
                <TableHead className="w-16 text-right">Clicks</TableHead>
                <TableHead className="w-16 text-right">CTR%</TableHead>
                <TableHead className="w-20 text-right">Unsubscribes</TableHead>
                <TableHead className="w-16 text-right">Bounces</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.delivered}
                  </TableCell>
                  <TableCell>{campaign.weekDay}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate" title={campaign.subject}>
                      {campaign.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={campaign.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <span className="truncate max-w-[100px]">
                        {campaign.link.replace('https://', '')}
                      </span>
                      <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.successfulDeliveries.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.opens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(campaign.openRate)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.clicks.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercentage(campaign.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.unsubscribes}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {campaign.bounces}
                  </TableCell>
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