# G8 Recheck Summary

- window_id: `formal-window-20260719-182455`
- readiness_status: `blocked`
- dns_log: [10-dns-recheck.log](file://infra/k8s/cutover-logs/formal-window-20260719-182455/10-dns-recheck.log)
- tls_log: [11-tls-secret-recheck.log](file://infra/k8s/cutover-logs/formal-window-20260719-182455/11-tls-secret-recheck.log)
- readiness_log: [00-formal-ready.log](file://infra/k8s/cutover-logs/formal-window-20260719-182455/00-formal-ready.log)
- blocker_report: [READINESS-BLOCKERS.md](file://infra/k8s/cutover-logs/formal-window-20260719-182455/READINESS-BLOCKERS.md)

## Next Step

- Readiness is still blocked. Fix DNS/TLS/host issues first, then rerun this script.
