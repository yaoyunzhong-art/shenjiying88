# G8 Recheck Summary

- window_id: `formal-window-20260720-010301`
- readiness_status: `passed`
- refresh_acr_regcred: `true`
- dns_log: [10-dns-recheck.log](file://infra/k8s/cutover-logs/formal-window-20260720-010301/10-dns-recheck.log)
- tls_log: [11-tls-secret-recheck.log](file://infra/k8s/cutover-logs/formal-window-20260720-010301/11-tls-secret-recheck.log)
- readiness_log: [00-formal-ready.log](file://infra/k8s/cutover-logs/formal-window-20260720-010301/00-formal-ready.log)
- blocker_report: [READINESS-BLOCKERS.md](file://infra/k8s/cutover-logs/formal-window-20260720-010301/READINESS-BLOCKERS.md)

## Next Step

- Readiness is green. You can proceed to the formal window command from `run-g8-formal-window-ready.sh --execute-apply --execute-rollback`.
