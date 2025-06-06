import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className,
  isLoading = false,
  variant = 'default'
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <CardContent className="p-0 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          {subtitle && <Skeleton className="h-3 w-24" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'p-4 transition-colors hover:bg-accent/50',
      variant === 'primary' && 'border-primary/20 bg-primary/5',
      variant === 'secondary' && 'border-secondary/20 bg-secondary/5',
      className
    )}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 