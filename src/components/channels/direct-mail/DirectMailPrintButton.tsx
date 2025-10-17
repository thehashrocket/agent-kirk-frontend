/**
 * @file src/components/channels/direct-mail/DirectMailPrintButton.tsx
 * Print button component for Direct Mail analytics that opens a print-optimized version
 * in a new window and triggers the print dialog.
 */

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useCallback } from 'react';

interface DirectMailPrintButtonProps {
    selectedAccountId?: string | null;
    clientId?: string | null;
}

export function DirectMailPrintButton({ selectedAccountId, clientId }: DirectMailPrintButtonProps) {
    const handlePrint = useCallback(() => {
        if (!selectedAccountId) {
            return;
        }

        const params = new URLSearchParams({
            accountId: selectedAccountId,
        });

        if (clientId) {
            params.append('clientId', clientId);
        }

        const printUrl = `/analytics/channel/direct/print?${params.toString()}`;

        const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800');

        if (printWindow) {
            const checkAndPrint = () => {
                if (printWindow.document.readyState === 'complete') {
                    const loadingIndicator = printWindow.document.querySelector('[data-testid="loading"]');
                    const hasContent = printWindow.document.querySelector('[data-testid="direct-mail-content"]');

                    if (!loadingIndicator && hasContent) {
                        setTimeout(() => {
                            printWindow.print();
                        }, 1500);
                    } else {
                        setTimeout(checkAndPrint, 800);
                    }
                } else {
                    setTimeout(checkAndPrint, 400);
                }
            };

            printWindow.addEventListener('load', () => {
                setTimeout(checkAndPrint, 1500);
            });
        }
    }, [selectedAccountId, clientId]);

    return (
        <Button
            onClick={handlePrint}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
            disabled={!selectedAccountId}
        >
            <Printer className="h-4 w-4" />
            Print Direct Mail Report
        </Button>
    );
}
