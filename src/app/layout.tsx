import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Providers } from "@/app/providers";

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
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1">
                  {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
