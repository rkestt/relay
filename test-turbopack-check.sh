#!/bin/bash
# Quick Turbopack health check script
# Run before E2E tests to catch cache corruption early

echo "🔍 Checking Turbopack health..."

# Check if dev server is running
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200\|307"; then
  echo "❌ Dev server not responding"
  echo "Fix: npm run dev"
  exit 1
fi

# Check for 500 errors (Turbopack compilation failure)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$STATUS" = "500" ]; then
  echo "❌ Turbopack compilation failed (HTTP 500)"
  echo ""
  echo "Fix:"
  echo "  1. pkill -f 'next-server'"
  echo "  2. rm -rf .next"
  echo "  3. npm run dev"
  exit 1
fi

# Check health endpoint
HEALTH=$(curl -s http://localhost:3000/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH" = "unhealthy" ]; then
  echo "⚠️  Health endpoint reports unhealthy (may be DB issue in local dev)"
fi

echo "✅ Turbopack healthy"
exit 0
