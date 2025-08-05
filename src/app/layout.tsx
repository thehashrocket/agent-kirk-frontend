import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/app/providers";
import Script from "next/script";

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
      <Script
        src="https://www.bugherd.com/sidebarv2.js?apikey=hvzbbkqgumxrgii49nojqq"
        strategy="afterInteractive"
      />
      <body className="font-bliss">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 pb-16">
                {children}
              </main>
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
