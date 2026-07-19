# G8 Formal Readiness Blockers

- window_id: `formal-window-20260719-154427`
- env_file: `infra/k8s/templates/m5-public-endpoints.env.example`
- namespace: `m5`
- tls_manifest: `live-secret`
- readiness_log: `infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log`

## Blockers

 - DNS has no A record for api.m5-platform.com
 - DNS has no A record for admin.m5-platform.com
 - DNS has no A record for store.m5-platform.com
 - DNS has no A record for tob.m5-platform.com
 - Live TLS secret is missing: m5-tls

## Next Action

- Resolve all blockers above, then rerun `scripts/run-g8-formal-window-ready.sh` with the same `--window-id` or a new one.
- Do not run `--execute-apply` until this readiness gate passes.
