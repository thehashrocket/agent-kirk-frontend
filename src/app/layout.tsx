import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "@/app/providers";
import QueryProvider from '@/providers/query-provider';

export const metadata: Metadata = {
  title: "Agent Kirk - AI Analytics Assistant",
  description: "Your AI-powered analytics assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-bliss">
        <QueryProvider>
          <Providers>
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex-1 flex">
                <Sidebar />
                <main className="flex-1 lg:pl-64">
                  {children}
                </main>
              </div>
            </div>
          </Providers>
        </QueryProvider>
      </body>
    </html>
  );
}
