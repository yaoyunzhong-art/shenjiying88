# 2026-07-19 · G8 正式窗口执行包

> 目标: 把 `G8` 正式窗口前的仓库内准备项一次性收口为可执行包
> 范围: `run-g8-formal-window-ready.sh`、`run-prod-cutover-window.sh`、cutover bundle、正式窗口日志目录
> 结论: `🟡 仓库内执行包已就位；当前仅剩 DNS/TLS/正式域名外部材料未到位`

---

## 已收口项

1. 正式窗口统一入口已固定为 `scripts/run-g8-formal-window-ready.sh`
2. 正式窗口门禁已固定为 `scripts/preflight-prod-formal-window.sh`
3. 正式窗口日志目录已固定为 `infra/k8s/cutover-logs/<window-id>/`
4. cutover bundle 已自动产出命令清单、日志计划和正式窗口 checklist
5. `run-prod-cutover-window.sh` 已固化 `00~05` 日志命名与 `SUMMARY.md` 归档规则
6. `preflight-prod-formal-window.sh` 已升级为全量扫描模式，单次执行即可汇总 `4 个 DNS + TLS` 全部阻塞项
7. `run-g8-formal-window-ready.sh` 在 readiness 失败时会自动生成 `00-formal-ready.log` 和 `READINESS-BLOCKERS.md`
8. `build-g8-short-escalation-messages.sh` 可基于最新 `READINESS-BLOCKERS.md` 自动生成三份短消息催办稿

---

## 仍缺外部材料

| Blocker | 当前缺口 | 完成标准 |
|--------|----------|----------|
| `EXT-001` | `m5-platform.com` DNS 托管权限未确认 | 能下发正式 DNS 记录 |
| `EXT-002` | `storefront / tob` 正式 host 未拍板 | `m5-public-endpoints.env` 回写最终 host |
| `EXT-003` | 正式 TLS PEM 未到位 | 拿到 `fullchain.pem / privkey.pem` 或等价正式证书来源 |
| `EXT-004` | 集群内不存在 live `m5-tls` | `kubectl -n m5 get secret m5-tls` 成功，或生成 `m5-tls.yaml` |
| `EXT-005` | 四个正式域名无 A 记录 | `api/admin/store/tob` 全部指向生产 NLB 双 IP |
| `EXT-006` | 正式窗口门禁仍失败 | readiness gate 全绿，允许真实 `apply` |

---

## 执行顺序

### 1. 先做 readiness

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs
```

### 2. 有 PEM 时直接走正式窗口

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

### 3. 没 PEM 但 live secret 已就位

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs \
  --execute-apply \
  --execute-rollback
```

---

## 证据标准

- 预跑证据至少包含 `01-preflight.log`、`02-server-dry-run.log`、`04-verify.log`
- readiness 阻塞时，必须保留 `00-formal-ready.log` 与 `READINESS-BLOCKERS.md`
- readiness 阻塞后，可追加生成 `DNS-SHORT-MESSAGE.txt`、`TLS-SHORT-MESSAGE.txt`、`HOST-DECISION-SHORT-MESSAGE.txt`
- 正式窗口证据必须包含 `00-formal-ready.log`、`03-apply.log`、`05-rollback.log`
- 最终证据目录必须只认一个 `infra/k8s/cutover-logs/<window-id>/`
- `SUMMARY.md` 必须回写最终执行参数、日志入口和下一步结论

---

## 产物入口

- 正式窗口入口: [run-g8-formal-window-ready.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-g8-formal-window-ready.sh)
- 窗口执行器: [run-prod-cutover-window.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-prod-cutover-window.sh)
- 正式窗口门禁: [preflight-prod-formal-window.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/preflight-prod-formal-window.sh)
- 外部阻塞板: [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)
- G8 演练证据: [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md)

---

## 当前判断

- `G8` 现在缺的不是脚本入口，而是外部 DNS/TLS 物料
- 在 `EXT-001 ~ EXT-006` 全绿前，禁止把本执行包误判为“已完成正式窗口”
- 一旦 DNS/TLS 到位，本执行包就是正式窗口的直接操作底稿
