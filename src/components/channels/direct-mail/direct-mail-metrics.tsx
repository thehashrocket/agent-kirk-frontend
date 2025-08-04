'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { normalizeNames } from '@/lib/utils/normalize-names';

interface DirectMailMetricsProps {
    selectedAccountId?: string | null;
    onAccountChange?: (accountId: string | null) => void;
}

export default function DirectMailMetrics({ selectedAccountId, onAccountChange }: DirectMailMetricsProps) {
    const [data, setData] = useState(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    return (
        <Card>
            <CardContent>

            </CardContent>
        </Card>
    );
}