// @ts-check

import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
export default config;
