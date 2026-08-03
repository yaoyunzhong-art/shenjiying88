# G8 Final War Board

- window_id: `formal-window-20260719-154427`
- status: `Blocked`
- command_owner: `E49`
- single_entry: [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md)
- today_board: [TODAY-ACTION-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/TODAY-ACTION-BOARD.md)
- one_click_recheck: [run-g8-recheck.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/run-g8-recheck.sh)
- success_entry: [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md)

## Current Blockers

| Blocker | Owner | Done Means Green | After Green |
|--------|-------|------------------|-------------|
| `EXT-001` DNS 托管归属 | `E41` | 已确认当前阿里云账号托管 `sportsant.net` 并可直接管理正式记录 | 继续维持企业部署域名口径 |
| `EXT-002` 正式 host 拍板 | `E18 / E46` | `storefront / tob` 正式 host 已最终拍板为 `api/admin/store/tob.sportsant.net` 并回写 env | 继续申请/校验证书 SAN 与 DNS |
| `EXT-003` TLS 证书 | `E46 / E49` | 已拿到正式 `fullchain.pem / privkey.pem` 或等价 live secret 来源 | 继续生成/挂载 `m5-tls` |
| `EXT-004` live `m5-tls` | `E52` | `kubectl -n m5 get secret m5-tls` 成功 | 继续重跑 readiness |
| `EXT-005` 四个正式域名 A 记录 | `E41` | 阿里云控制台中 `api/admin/store/tob.sportsant.net` 均已配置到 `121.41.69.154 / 120.26.66.40`，并在新版 readiness 中不再报 DNS blocker | 继续重跑 readiness |
| `EXT-006` 正式窗口门禁 | `E49` | readiness 全绿，无 DNS/TLS 阻塞输出 | 才允许进入真实 `apply / rollback` |

## Green Standard

- 四个正式 host 都有正确 A 记录
- live `m5-tls` 已存在，或可稳定渲染并应用正式 TLS manifest
- `storefront / tob` host 已最终定版
- `run-g8-formal-window-ready.sh` 返回通过，不再生成新的阻塞失败结果

## Run Commands

### 1. Readiness Recheck

```bash
bash scripts/run-g8-formal-window-ready.sh \
  --env-file infra/k8s/templates/m5-public-endpoints.env.example \
  --release-env-file infra/k8s/templates/m5-release-images.env.example \
  --window-id formal-window-$(date +%Y%m%d-%H%M%S) \
  --log-root infra/k8s/cutover-logs
```

### 2. Formal Window

```bash
pnpm g8:formal
```

## Rule

- Before `EXT-006` turns green, do not report `G1` as ready for resign.
- Before `EXT-006` turns green, do not run real `apply`.
- After `EXT-006` turns green, follow [G8-SUCCESS-CHECKLIST.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/G8-SUCCESS-CHECKLIST.md).
