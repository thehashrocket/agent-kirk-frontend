/**
 * @file src/app/client/dashboard/print/layout.tsx
 * Custom layout for print pages that excludes navigation elements.
 * Provides a clean, full-width layout optimized for printing.
 */

import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Dashboard Report - Agent Kirk",
  description: "Printable analytics dashboard report",
};

/**
 * Print Layout Component
 * 
 * Provides a minimal layout for print pages without header, sidebar,
 * or other navigation elements. Optimized for printing and PDF generation.
 * This layout completely replaces the root layout for print pages.
 * 
 * @param children - Child components to render
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-bliss">
        <Providers>
          <div className="min-h-screen w-full bg-white print:bg-white">
            {/* Print-specific: No header, sidebar, or navigation elements */}
            <main className="w-full">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
} 