import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers";
import Navbar from "../components/Navbar/Nav";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { initializeCronJobs } from "../lib/cron-scheduler";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendlyAI - Smart Expense Tracking",
  description: "AI-powered expense tracking and financial insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize CRON jobs on server startup
  if (typeof window === 'undefined') {
    initializeCronJobs();
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <Suspense fallback={null}>
            <main className="">
              {children}
            </main>
          </Suspense>
          <Analytics/>
        </Providers>
      </body>
    </html>
  );
}
