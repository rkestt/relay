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
    ],
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    scrollRestoration: true,
  },
};

const config = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'r6hub',
  project: process.env.SENTRY_PROJECT || 'r6hub',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: { disable: true },
  // Next 16 / Sentry: options moved under webpack (deprecation-free)
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
export default config;
