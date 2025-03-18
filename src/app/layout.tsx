import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kirk Frontend",
  description: "Kirk Frontend Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
