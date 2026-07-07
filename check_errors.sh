#!/bin/bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api
npx tsc --noEmit -p tsconfig.json 2>&1 | grep "error TS" > /Users/yaoyunzhong/.openclaw/workspace/tsc_only.txt
echo "Error count: $(wc -l < /Users/yaoyunzhong/.openclaw/workspace/tsc_only.txt)"
cat /Users/yaoyunzhong/.openclaw/workspace/tsc_only.txt
