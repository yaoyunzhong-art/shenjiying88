# Prod Cutover Window Summary

- window_id: `g8-pre-window-20260719-115939`
- env_file: `infra/k8s/templates/m5-public-endpoints.env.example`
- release_env_file: `infra/k8s/templates/m5-release-images.env.example`
- namespace: `m5`
- allow_missing_tls: `true`
- execute_apply: `false`
- execute_rollback: `false`

## Logs

- `01-preflight.log`
- `02-server-dry-run.log`
- `04-verify.log`

## Rendered Dirs

- `infra/k8s/cutover-logs/g8-pre-window-20260719-115939/rendered-preflight`
- `infra/k8s/cutover-logs/g8-pre-window-20260719-115939/rendered-server-dry-run`

## Next Step

- This window only produced non-mutating evidence. Re-run with `--execute-apply` during the formal cutover window.
- Rollback was not executed in this run. Re-run with `--execute-rollback` if rollback evidence is required.
