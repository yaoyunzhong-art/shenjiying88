# G8 Window Status

- window_id: `formal-window-20260719-154427`
- overall_status: `blocked`
- readiness_status: `blocked`
- formal_status: `not_started`
- verify_status: `not_started`
- rollback_status: `not_requested`

## Artifacts

- [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
- [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)

## Next Action

- Window is still blocked. Resolve DNS, TLS, and host-decision blockers first.
- After any update, rerun `pnpm g8:recheck`.
- If readiness turns green, move to [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md) and then run `pnpm g8:formal`.
