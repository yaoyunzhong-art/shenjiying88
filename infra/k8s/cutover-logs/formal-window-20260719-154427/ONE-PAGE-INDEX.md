# G8 Resign Entry Index

- window_id: `formal-window-20260719-154427`
- verdict: `Blocked`
- summary: `Do not apply until sportsant.net readiness turns green and live TLS is ready`

## Resign Entry

- [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)
- [2026-07-19-g1-release-bundle-confirmation.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md)
- [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)
- [2026-07-19-g8-formal-window-execution-package.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-formal-window-execution-package.md)
- [V7.2-RESIGN-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/V7.2-RESIGN-CHECKLIST.md)
- [WEEKLY-RYG-STATUS-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/WEEKLY-RYG-STATUS-BOARD.md)
- [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)

## Core Evidence

- [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
- [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)
- [WINDOW-STATUS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/WINDOW-STATUS.md)
- [CLOSEOUT-SUMMARY.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/CLOSEOUT-SUMMARY.md)

## Decision View

- [EXEC-BRIEF.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/EXEC-BRIEF.md)
- [FINAL-WAR-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/FINAL-WAR-BOARD.md)
- [TODAY-ACTION-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TODAY-ACTION-BOARD.md)
- [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md)
- [TLS-RECOMMENDATION.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TLS-RECOMMENDATION.md)

## Ops Tools

- [package.json](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/package.json)
- [run-g8-recheck.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-g8-recheck.sh)
- [g8-window-status.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g8-window-status.sh)
- [g8-closeout.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g8-closeout.sh)

## Escalation View

- [ESCALATION-SHORT-MESSAGES.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ESCALATION-SHORT-MESSAGES.md)
- [DNS-SHORT-MESSAGE.txt](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/DNS-SHORT-MESSAGE.txt)
- [TLS-SHORT-MESSAGE.txt](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TLS-SHORT-MESSAGE.txt)
- [HOST-DECISION-SHORT-MESSAGE.txt](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/HOST-DECISION-SHORT-MESSAGE.txt)

## Current Blockers

- Historical failed window used old `m5-platform.com` hosts and is no longer the target production domain
- `sportsant.net` enterprise domain and `api/admin/store/tob.sportsant.net` hosts are now confirmed
- Live `m5-tls` secret is still missing
- New readiness must be rerun against `sportsant.net`

## Fastest Path

1. Keep `sportsant.net` as the only enterprise production domain
2. Deliver formal TLS and create `m5-tls`
3. Rerun readiness against `api/admin/store/tob.sportsant.net`
4. Only then enter real apply/rollback window

## Use This Page

1. Open `Resign Entry` for management and review materials
2. Open `Core Evidence` for the actual failed readiness proof
3. Open `Decision View` for the boss summary
4. Open `Escalation View` for outward messaging
5. Run `pnpm g8:recheck` after any DNS/TLS/host update
6. Re-run `pnpm g8:ready` only after all blockers are cleared
7. Run `pnpm g8:formal` only after readiness is green and follow [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md)
8. Run `pnpm g8:status` after any recheck or formal run to inspect the latest window state
9. Run `pnpm g8:closeout` after formal logs are complete to generate writeback summary
