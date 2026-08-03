# 2026-07-19 · G8 外部阻塞报告

> 目标: 将 `G8` readiness 的外部阻塞项收口为单份可催办、可升级、可回写的报告
> 范围: `sportsant.net 企业域名 / DNS / TLS / m5-tls`
> 结论: `🔴 当前仍不允许正式 apply；需先解除外部公网资产阻塞`

---

## 当前已确认事实

1. 企业级部署正式根域已确认使用 `sportsant.net`
2. 当前阿里云 DNS 账号已确认托管 `sportsant.net`
3. 当前 Ingress 仍返回 `Kubernetes Ingress Controller Fake Certificate`
4. 集群内不存在 live `m5-tls` secret
5. `run-g8-formal-window-ready.sh` 已可自动生成 readiness 日志与阻塞报告

## 最新实跑结果

- 实跑窗口: `formal-window-20260719-154427`
- readiness 日志: [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
- blocker 报告: [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)
- 历史窗口阻塞项:
  - `api.m5-platform.com` 无 A 记录
  - `admin.m5-platform.com` 无 A 记录
  - `store.m5-platform.com` 无 A 记录
  - `tob.m5-platform.com` 无 A 记录
  - live `m5-tls` secret 缺失
- 当前新增事实:
  - 阿里云 DNS 控制台已确认 `api/admin/store/tob.sportsant.net` 共 8 条 A 记录均已启用
  - 四个主机记录均指向 `120.26.66.40` 与 `121.41.69.154`
  - 正式 host 已固定为 `api/admin/store/tob.sportsant.net`

证据来源:

- [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md)
- [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md)
- [2026-07-19-g8-formal-window-execution-package.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-formal-window-execution-package.md)

---

## 阻塞项总表

| 阻塞项 | 当前事实 | 完成标准 | 责任方向 |
|--------|----------|----------|----------|
| DNS 托管归属 | 已确认当前账号托管 `sportsant.net` | 保持企业部署域名口径不回退 | 域名/DNS 管理方 |
| 正式域名拍板 | 正式 host 已固定为 `api/admin/store/tob.sportsant.net` | 继续以最终 host 申请/校验证书 SAN | 业务/战略 owner |
| 正式 DNS 记录 | 阿里云控制台已配置完成，待新版 readiness 外部复检 | 四个正式域名在门禁中不再触发 DNS blocker | DNS 管理方 |
| TLS 证书 | 尚无可直接用于正式公网 host 的证书物料 | 拿到 `fullchain.pem / privkey.pem` 或等价正式 secret 来源 | 证书/安全 owner |
| `m5-tls` secret | 集群内不存在 live secret | `kubectl -n m5 get secret m5-tls` 成功或生成 `m5-tls.yaml` | 运维 owner |

---

## 自动化产物位置

- readiness 日志: `infra/k8s/cutover-logs/<window-id>/00-formal-ready.log`
- readiness 阻塞报告: `infra/k8s/cutover-logs/<window-id>/READINESS-BLOCKERS.md`
- 正式窗口执行包: [2026-07-19-g8-formal-window-execution-package.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-formal-window-execution-package.md)
- 外部催办模板: [2026-07-19-g8-external-escalation-templates.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-external-escalation-templates.md)
- 老板汇报版: [2026-07-19-g8-exec-brief.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-exec-brief.md)
- 短消息生成脚本: [build-g8-short-escalation-messages.sh](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/build-g8-short-escalation-messages.sh)
- 短消息产物: `infra/k8s/cutover-logs/<window-id>/DNS-SHORT-MESSAGE.txt` / `TLS-SHORT-MESSAGE.txt` / `HOST-DECISION-SHORT-MESSAGE.txt` / `ESCALATION-SHORT-MESSAGES.md`
- 复签入口页: [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md)

---

## 外部催办口令

### DNS 侧

- 请确认 `sportsant.net` 解析记录持续由当前阿里云账号维护
- 请以以下四个正式 host 为准做新版 readiness 复检:
  - `api.sportsant.net`
  - `admin.sportsant.net`
  - `store.sportsant.net`
  - `tob.sportsant.net`

### 证书侧

- 请提供覆盖最终 SAN 列表的正式证书
- 交付形式二选一:
  - `fullchain.pem + privkey.pem`
  - 可直接挂载到 `m5` namespace 的 live `m5-tls` secret

### 业务拍板侧

- 正式域名已确认 `sportsant.net`
- 当前需要继续保证所有部署、证书和验证脚本只认 `sportsant.net`

---

## 绿灯标准

- `READINESS-BLOCKERS.md` 不再出现任何 blocker 条目
- `scripts/run-g8-formal-window-ready.sh` readiness 通过
- 之后才能进入 `--execute-apply --execute-rollback` 的正式窗口

---

## 当前判断

- 现在的主阻塞已经不是仓库内脚本能力
- 当前只剩外部公网资产未到位
- 一旦外部项全绿，`G8` 就可以直接进入正式窗口证据补齐
