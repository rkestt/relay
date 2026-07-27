# Turbopack Cache Corruption - Troubleshooting Guide

## Problem
Turbopack (Next.js 16 bundler) cache corruption causes:
- HTTP 500 errors in browser
- "Internal Server Error" pages
- "2 Issues" indicator in Next.js dev overlay
- Intermittent test failures

## Root Cause
Turbopack's internal SST files in `.next/dev/cache/turbopack/` get corrupted.
This is a known issue with Next.js 16's Turbopack implementation.

## Quick Fix
```bash
# Kill all Next.js processes
pkill -f "next-server"

# Clear corrupted cache
rm -rf .next

# Restart dev server
npm run dev
```

## Prevention
Enable Turbopack FileSystem Cache in `next.config.ts`:
```typescript
const nextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
};
```

## Detection in Tests
Run pre-flight check before E2E tests:
```bash
npm run test:e2e
```

The `globalSetup.ts` automatically checks Turbopack health and fails fast
with clear instructions if corruption is detected.

## Manual Health Check
```bash
# Quick check
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health

# Should return 200 (healthy) or 503 (unhealthy but running)
# If 500: Turbopack compilation failed
```

## Browser Extensions (Optional)
- **React Developer Tools**: Inspect component tree
- **Redux DevTools**: State inspection (if using Redux)
- **Next.js DevTools**: Built-in error overlay (already enabled)

## Resources
- [Next.js Turbopack Docs](https://nextjs.org/docs/app/api-reference/turbopack)
- [Turbopack FileSystem Cache](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache)
- [Vercel Community: Cache Issues](https://community.vercel.com/t/turbopack-internal-error-corrupted-build-cache-unfixable/30069)

## When to Worry
- Single occurrence: Clear cache, restart (normal)
- Repeated corruption: File issue on [Next.js GitHub](https://github.com/vercel/next.js/issues)
- Production builds: Use `next build --webpack` to disable Turbopack

## CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Check Turbopack health
  run: |
    curl -f http://localhost:3000/api/health || {
      echo "Turbopack unhealthy"
      exit 1
    }
```
