import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserMenu from "@/components/auth/UserMenu";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { WipBanner } from "@/components/ui/WipBanner";
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
    image: "/logo/export/relay-og-1200x630.png",
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
      <head>
        {/*
          Global fetch wrapper — must run BEFORE any other script.
          Adds retry on "Failed to fetch" / "NetworkError" caused by
          browser extensions that intercept window.fetch.
          Only retries GET requests (mutations are never retried).
        */}
        <Script id="fetch-retry" strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!window.fetch)return;var _o=window.fetch.bind(window);function _w(i,it){it=it||{};var m=(it.method||'GET').toUpperCase();var g=m==='GET';function a(n){return _o(i,it).catch(function(e){if(!g||n>=2||!(e instanceof TypeError))throw e;var x=e.message||'';if(x.indexOf('Failed to fetch')<0&&x.indexOf('NetworkError')<0)throw e;return new Promise(function(r){setTimeout(function(){try{r(a(n+1))}catch(_){r(_o(i,it))}},200*Math.pow(2,n))})})}return a(0)}try{Object.defineProperty(window,'fetch',{value:_w,writable:true,configurable:true})}catch(e){window.fetch=_w}var _k=window.fetch;setInterval(function(){if(window.fetch!==_k){try{Object.defineProperty(window,'fetch',{value:_w,writable:true,configurable:true})}catch(e){window.fetch=_w}}},1000)})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <WipBanner />
        <UserMenu />
        <OnboardingGate>
          <AnalyticsProvider>
            <PageTransition>{children}</PageTransition>
          </AnalyticsProvider>
        </OnboardingGate>
        <CookieBanner />
      </body>
    </html>
  );
}
