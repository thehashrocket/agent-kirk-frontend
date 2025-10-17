/**
 * @file src/app/client/dashboard/print/layout.tsx
 * Custom layout for print pages that excludes navigation elements.
 * Provides a clean, full-width layout optimized for printing.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Report - Agent Kirk",
  description: "Printable analytics dashboard report",
};

/**
 * Print Layout Component
 *
 * Provides a minimal layout for print pages without header, sidebar,
 * or other navigation elements. Optimized for printing and PDF generation
 * while reusing the shared root layout shell.
 *
 * @param children - Child components to render
 */
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-white print:bg-white relative">
      {/* Main content - watermark is now handled by CSS body::before pseudo-element */}
      <main className="w-full relative z-10 print-content">{children}</main>
    </div>
  );
}
