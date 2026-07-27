// @ts-check

import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    scrollRestoration: true,
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
};

const config = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'r6hub',
  project: process.env.SENTRY_PROJECT || 'r6hub',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: { disable: true },
  disableLogger: true,
  automaticVercelMonitors: true,
});
export default config;
