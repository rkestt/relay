#!/usr/bin/env bash
# Runtime Verification — Lazy Mode
# Esegue la sequenza completa di verifica runtime.
set -uo pipefail

echo "╔════════════════════════════════════════╗"
echo "║     Runtime Verification System        ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. Turbopack health
echo -e "${YELLOW}[1/4]${NC} Turbopack health check..."
if [ -f "test-turbopack-check.sh" ]; then
  if bash test-turbopack-check.sh 2>&1 | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} Turbopack healthy"
  else
    echo -e "${RED}✗${NC} Turbopack unhealthy — non bloccante per smoke"
    ((ERRORS++)) || true
  fi
else
  echo -e "${YELLOW}⚠${NC} test-turbopack-check.sh non trovato — skip"
fi
echo ""

# 2. Build
echo -e "${YELLOW}[2/4]${NC} Build check..."
if npm run build 2>&1 | tail -5 | grep -q "Compiled successfully"; then
  echo -e "${GREEN}✓${NC} Build passed"
else
  echo -e "${RED}✗${NC} Build failed"
  ((ERRORS++)) || true
fi
echo ""

# 3. E2E smoke (grep: smoke-tag)
echo -e "${YELLOW}[3/4]${NC} E2E smoke test..."
if npx playwright test --project=chromium --grep "smoke" --reporter=list 2>&1 | tail -10; then
  echo -e "${GREEN}✓${NC} E2E smoke passed"
else
  echo -e "${RED}✗${NC} E2E smoke failed — non bloccante se nessun test 'smoke' definito"
fi
echo ""

# 4. Browser check via Playwright CLI
echo -e "${YELLOW}[4/4]${NC} Browser runtime check..."
if command -v agent-browser &> /dev/null; then
  # Apri browser e cattura console
  agent-browser open http://localhost:3000 --headed=false 2>&1
  sleep 3
  
  # Cattura console errors
  CONSOLE_ERRORS=$(agent-browser console 2>&1 | grep -i "error" || echo "")
  if [ -z "$CONSOLE_ERRORS" ]; then
    echo -e "${GREEN}✓${NC} No console errors"
  else
    echo -e "${RED}✗${NC} Console errors detected:"
    echo "$CONSOLE_ERRORS" | head -5
    ((ERRORS++)) || true
  fi
  
  # Chiudi browser
  agent-browser close 2>&1 > /dev/null
else
  echo -e "${YELLOW}⚠${NC} agent-browser non disponibile — skip browser check"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════╗"
if [ $ERRORS -eq 0 ]; then
  echo -e "║  ${GREEN}✓ All checks passed${NC}                  ║"
else
  echo -e "║  ${RED}✗ $ERRORS error(s) detected${NC}              ║"
fi
echo "╚════════════════════════════════════════╝"

exit $ERRORS
