#!/bin/bash
cd /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api
npx tsc --noEmit -p tsconfig.json 2>/dev/null | grep "error TS" > /tmp/tsc_final.txt
echo "Done. Exit code: $?"
