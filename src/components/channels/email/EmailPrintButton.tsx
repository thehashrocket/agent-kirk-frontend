/**
 * @file src/components/channels/email/EmailPrintButton.tsx
 * Print button component for email analytics that opens a print-optimized version
 * in a new window and triggers the print dialog.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useCallback } from 'react';

interface EmailPrintButtonProps {
  selectedClientId?: string | null;
}

/**
 * @component EmailPrintButton
 * Button that opens a print-optimized version of the email analytics dashboard.
 * 
 * Features:
 * - Opens email print route in new window with selected client ID
 * - Triggers browser print dialog automatically
 * - Handles window focus and cleanup
 * - Passes current client selection to print page
 */
export function EmailPrintButton({ selectedClientId }: EmailPrintButtonProps) {
  const handlePrint = useCallback(() => {
    // Build the print URL with the selected client ID
    const printUrl = selectedClientId 
      ? `/analytics/channel/email/print?clientId=${selectedClientId}`
      : '/analytics/channel/email/print';
    
    // Open the print-optimized email dashboard in a new window
    const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      // Wait for the content to load and data to be ready
      const checkAndPrint = () => {
        // Check if the document is fully loaded and content is ready
        if (printWindow.document.readyState === 'complete') {
          // Look for a loading indicator or data container to ensure content is ready
          const loadingIndicator = printWindow.document.querySelector('[data-testid="loading"]');
          const hasContent = printWindow.document.querySelector('[data-testid="email-content"]');
          
          // Also check for actual chart content to ensure data has loaded
          const hasCharts = printWindow.document.querySelector('.recharts-wrapper, canvas, svg, .email-metrics');
          
          if (!loadingIndicator && hasContent && hasCharts) {
            // Content is ready, trigger print after a longer delay
            setTimeout(() => {
              printWindow.print();
            }, 2000); // Increased delay for charts to fully render
          } else {
            // Content not ready yet, check again with longer interval
            setTimeout(checkAndPrint, 1000); // Increased check interval
          }
        } else {
          // Document not ready, check again
          setTimeout(checkAndPrint, 500);
        }
      };
      
      // Start checking after initial load with longer initial delay
      printWindow.addEventListener('load', () => {
        setTimeout(checkAndPrint, 3000); // Increased initial delay
      });
    }
  }, [selectedClientId]);

  return (
    <Button
      onClick={handlePrint}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
      disabled={!selectedClientId}
    >
      <Printer className="h-4 w-4" />
      Print Email Report
    </Button>
  );
} 