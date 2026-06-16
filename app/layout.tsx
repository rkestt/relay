import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserMenu from "@/components/auth/UserMenu";
import { PageTransition } from "@/components/ui/PageTransition";
import { CookieBanner } from "@/components/cookie/CookieBanner";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { LogPanel } from "@/components/debug/LogPanel";
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
    title: "r6hub - Rainbow Six Siege Strategy Platform",
    description:
      "Piattaforma per gestire lobby e strategie Rainbow Six Siege. Crea lobby, condividi strategie, collabora con il team.",
    image: "/og-default.png",
  }),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "r6hub",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <UserMenu />
        <AnalyticsProvider>
          <PageTransition>{children}</PageTransition>
        </AnalyticsProvider>
        <CookieBanner />
        <LogPanel />
      </body>
    </html>
  );
}
