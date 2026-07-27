#!/usr/bin/env bash
# Run e2e tests with error capture
set -euo pipefail

SCREENSHOTS_DIR="e2e/screenshots"

echo "=== Relay E2E Test Suite ==="
echo ""

# Ensure screenshots dir exists
mkdir -p "$SCREENSHOTS_DIR"

# Run Playwright tests with verbose output
echo "Running Playwright tests..."
npx playwright test --reporter=list 2>&1 | tee "$SCREENSHOTS_DIR/test-output.txt"
EXIT_CODE=$?

echo ""
echo "=== Results ==="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed"
else
  echo "❌ Some tests failed (exit code: $EXIT_CODE)"
  # Show failures summary
  grep -E "^\s+(✗|×|FAIL)" "$SCREENSHOTS_DIR/test-output.txt" || true
  grep -E "(failed|FAIL)" "$SCREENSHOTS_DIR/test-output.txt" || true
fi

exit $EXIT_CODE
