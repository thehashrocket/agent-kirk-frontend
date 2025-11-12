import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/app/providers";
import Script from "next/script";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Agent Kirk - AI Analytics Assistant",
  description: "Your AI-powered analytics assistant",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const requestPath =
    headerList.get("x-invoke-path") ??
    headerList.get("x-matched-path") ??
    headerList.get("next-url") ??
    "";
  const isPrintPage = /(?:^|\/)print(?:\/|$)/.test(requestPath);

  return (
    <html lang="en">
      {/* Only load the Script when in the staging environment */}
      {process.env.APP_ENV === "staging" && (
        <Script
          id="bugherd-script"
          src="https://www.bugherd.com/sidebarv2.js?apikey=hvzbbkqgumxrgii49nojqq"
          strategy="afterInteractive"
        />
      )}
      <body
        className="font-bliss"
        data-print-page={isPrintPage ? "true" : undefined}
      >
        <Providers>
          {isPrintPage ? (
            <div className="min-h-screen flex flex-col">
              <div role="main" className="flex-1">
                {children}
              </div>
            </div>
          ) : (
            <div className="min-h-screen flex flex-col">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <div role="main" className="flex-1 pb-16">
                  {children}
                </div>
              </div>
              <Footer />
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
