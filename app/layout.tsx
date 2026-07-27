import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { PageTransition } from "@/components/ui/PageTransition";
import { CookieBanner } from "@/components/cookie/CookieBanner";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { generateMetadata } from "@/lib/seo/metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  ...generateMetadata({
    title: "Relay - Rainbow Six Siege Strategy Platform",
    description:
      "Piattaforma per gestire lobby e strategie Rainbow Six Siege. Crea lobby, condividi strategie, collabora con il team.",
    image: "/og-default.png",
  }),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Relay",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      {/*
        Global fetch wrapper — must run BEFORE any other script.
        Adds retry on "Failed to fetch" / "NetworkError" caused by
        browser extensions that intercept window.fetch.
        Only retries GET requests (mutations are never retried).
      */}
      <Script src="/fetch-retry.js" strategy="beforeInteractive" />
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <Header />
          <AnalyticsProvider>
            <PageTransition>
              <main
                id="main"
                className="flex-1 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
                tabIndex={-1}
              >
                {children}
              </main>
            </PageTransition>
          </AnalyticsProvider>
          <BottomNav />
        </ThemeProvider>

        <CookieBanner />
      </body>
    </html>
  );
}
