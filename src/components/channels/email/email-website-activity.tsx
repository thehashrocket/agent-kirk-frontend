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
import type { EmailWebsiteActivityProps } from './types';

export function EmailWebsiteActivity({ activities, isLoading = false }: EmailWebsiteActivityProps) {
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Campaign Website Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current Period
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
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
        <CardTitle>Email Campaign Website Activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current Period
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Campaign</TableHead>
                <TableHead className="w-24">Source</TableHead>
                <TableHead className="w-20">Medium</TableHead>
                <TableHead className="min-w-[200px]">Ad Content</TableHead>
                <TableHead className="w-16 text-right">Users</TableHead>
                <TableHead className="w-20 text-right">New Users</TableHead>
                <TableHead className="w-20 text-right">Sessions</TableHead>
                <TableHead className="w-32 text-right">Avg Session Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.campaign}
                  </TableCell>
                  <TableCell>{activity.source}</TableCell>
                  <TableCell>{activity.medium}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={activity.adContent}>
                      {activity.adContent}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {activity.users}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {activity.newUsers}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {activity.sessions}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {activity.avgSessionDuration}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {activities.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 pt-4 border-t">
            <span>1 - 10 / {activities.length}</span>
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