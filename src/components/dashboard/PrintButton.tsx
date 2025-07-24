/**
 * @file src/components/dashboard/PrintButton.tsx
 * Print button component that opens a print-optimized version of the dashboard
 * in a new window and triggers the print dialog.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useCallback } from 'react';

interface PrintButtonProps {
  selectedPropertyId?: string | null;
}

/**
 * @component PrintButton
 * Button that opens a print-optimized version of the dashboard.
 * 
 * Features:
 * - Opens print route in new window with selected property ID
 * - Triggers browser print dialog automatically
 * - Handles window focus and cleanup
 * - Passes current property selection to print page
 */
export function PrintButton({ selectedPropertyId }: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    // Build the print URL with the selected property ID
    const printUrl = selectedPropertyId 
      ? `/client/dashboard/print?propertyId=${selectedPropertyId}`
      : '/client/dashboard/print';
    
    // Open the print-optimized dashboard in a new window
    const printWindow = window.open(printUrl, '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      // Wait for the content to load and data to be ready
      const checkAndPrint = () => {
        // Check if the document is fully loaded and content is ready
        if (printWindow.document.readyState === 'complete') {
          // Look for a loading indicator or data container to ensure content is ready
          const loadingIndicator = printWindow.document.querySelector('[data-testid="loading"]');
          const hasContent = printWindow.document.querySelector('[data-testid="analytics-content"]');
          
          // Also check for actual chart content to ensure data has loaded
          const hasCharts = printWindow.document.querySelector('.recharts-wrapper, canvas, svg');
          
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
  }, [selectedPropertyId]);

  return (
    <Button
      onClick={handlePrint}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
      disabled={!selectedPropertyId}
    >
      <Printer className="h-4 w-4" />
      Print Report
    </Button>
  );
} 