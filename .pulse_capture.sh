#!/bin/bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88

echo "=== TYPECHECK ==="
pnpm typecheck:all 2>&1 | tail -30
echo ""

echo "=== TEST ==="
# Run only non-api tests first to scope
pnpm --filter='!@m5/api' test 2>&1 | tail -30
echo ""
echo "EXIT_CODE=$?"
