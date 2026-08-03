# Cutover Log Plan

Formal production window logs should be generated under:

```text
infra/k8s/cutover-logs/<window-id>/
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
  --env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/public-endpoints.env \
  --release-env-file infra/k8s/cutover-logs/g8-pre-window-20260719-115345/cutover-bundle/release-images.env \

  --window-id formal-window-20260719-115346 \
  --log-root infra/k8s/cutover-logs \
  --execute-apply
```
