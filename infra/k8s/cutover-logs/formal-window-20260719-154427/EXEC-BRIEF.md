# G8 Exec Brief

- window_id: `formal-window-20260719-154427`
- verdict: `Do not apply`
- source_log: [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
- blocker_report: [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)

## Status

- Four formal hosts have no A record
- Live `m5-tls` secret is missing
- `storefront / tob` final host decision is still pending

## Risk

- Real `apply` would violate the current gate
- Public traffic and TLS would fail even if deployment is attempted

## Fastest Path

1. Finalize `storefront / tob` hosts
2. Create four A records to `121.41.69.154 / 120.26.66.40`
3. Deliver formal TLS and create `m5-tls`
4. Rerun readiness
5. Only then enter real apply/rollback window
