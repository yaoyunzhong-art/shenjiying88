# Cutover Log Plan

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

- : 只在正式窗口  时生成
- : 集群预检与渲染 dry-run
- : Ingress / ConfigMap server dry-run
- : 正式 apply 窗口日志
- : DNS / TLS / health 校验
- : 正式回滚日志
- : 窗口摘要与日志入口

## Evidence Rule

- 仅运行 readiness 时，至少归档 `01-preflight.log`、`02-server-dry-run.log`、`04-verify.log`
- 进入正式窗口时，必须归档完整 `00~05` 日志并保留 `SUMMARY.md`
- 若 `00-formal-ready.log` 不存在，说明并未真正通过正式窗口门禁，不得将该次运行计为 G8 完成
- 若 `05-rollback.log` 不存在，说明 rollback 证据未完成，G8 仍只能记为待补证据
