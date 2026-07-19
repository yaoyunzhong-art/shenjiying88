# Cutover Log Plan

Formal production window logs should be generated under:

```text
infra/k8s/cutover-logs/<window-id>/
  00-formal-ready.log
  01-preflight.log
  02-server-dry-run.log
  03-apply.log
  04-verify.log
  05-rollback.log
  SUMMARY.md
```

Recommended command:

```bash
bash scripts/run-prod-cutover-window.sh \
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115939/cutover-bundle/public-endpoints.env \
  --release-env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115939/cutover-bundle/release-images.env \

  --window-id formal-window-20260719-115939 \
  --log-root infra/k8s/cutover-logs \
  --execute-apply
```

- `00-formal-ready.log`: only generated when `--execute-apply` runs through the formal gate
