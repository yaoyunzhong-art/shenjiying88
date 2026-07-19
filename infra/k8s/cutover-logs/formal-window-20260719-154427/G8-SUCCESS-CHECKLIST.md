# G8 Success Checklist

- purpose: `define the exact next steps after readiness turns green`
- precondition: `pnpm g8:recheck` or `pnpm g8:ready` has passed with no DNS/TLS blockers
- entry: [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md)

## Go Criteria

- `api/admin/store/tob.sportsant.net` all resolve to production NLB IPs
- live `m5-tls` exists, or a formal TLS manifest is already rendered and ready
- readiness no longer emits `READINESS-BLOCKERS.md` failure content
- release env and public endpoint env are confirmed for the formal window
- certificate coverage follows [TLS-RECOMMENDATION.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TLS-RECOMMENDATION.md)

## Formal Window Commands

### 1. Default Formal Window

```bash
pnpm g8:formal
```

### 2. Formal Window With PEM

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example \
  --cert-file /secure/path/fullchain.pem \
  --key-file /secure/path/privkey.pem \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs \
  --execute-apply \
  --execute-rollback
```

### 3. Latest Window Status

```bash
pnpm g8:status
```

### 4. Closeout Summary

```bash
pnpm g8:closeout
```

## Success Evidence

- `00-formal-ready.log`
- `01-preflight.log`
- `02-server-dry-run.log`
- `03-apply.log`
- `04-verify.log`
- `05-rollback.log`
- `SUMMARY.md`

## Pass Means

- apply finished without cutover failure
- verify finished without public endpoint verification failure
- rollback log exists when rollback evidence is required
- all logs are attached back to G8 acceptance and resign bundle entry

## Fail Means

- if formal readiness fails again, go back to [TODAY-ACTION-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TODAY-ACTION-BOARD.md)
- if apply fails, preserve `03-apply.log` and stop before retrying
- if verify fails, preserve `04-verify.log` and decide rollback based on window policy
- after any recheck or formal run, generate the latest status page with `pnpm g8:status`
- after formal apply or verify completes, generate closeout summary with `pnpm g8:closeout`

## Closeout

- update [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)
- update [V7.2-RESIGN-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/V7.2-RESIGN-CHECKLIST.md)
- update [WEEKLY-RYG-STATUS-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/WEEKLY-RYG-STATUS-BOARD.md)
- update [2026-07-19-v72-resign-bundle.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-v72-resign-bundle.md)
