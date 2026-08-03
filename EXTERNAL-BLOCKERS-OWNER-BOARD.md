# 外部阻塞责任板

> 更新时间: 2026-07-19
> 目标: 将 `DNS / TLS / 正式域名` 等外部依赖收口为可追责、可升级、可复签的阻塞板

## 当前阻塞

| Blocker ID | 阻塞项 | 状态 | 当前事实 | 负责人 | 协同 | 证据物 | 下一步 | SLA | 超时升级 |
|------------|:------:|:----:|----------|--------|------|--------|--------|-----|----------|
| EXT-001 | DNS 托管归属 | 🟢 | 当前阿里云账号已确认托管 `sportsant.net`，可直接管理企业部署解析记录 | E49 | E41 | 阿里云 DNS 控制台实核 / [m5-public-endpoints.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example) | 持续以 `sportsant.net` 作为正式公网根域 | done | - |
| EXT-002 | 正式域名拍板 | 🟢 | 企业级部署正式域名已确认 `sportsant.net`，正式 host 固定为 `api/admin/store/tob.sportsant.net` 并已回写 env | E46 | E49 | 用户确认口径 / [m5-public-endpoints.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example) | 继续按已定 host 申请/校验证书 SAN | done | - |
| EXT-003 | TLS 证书 | 🔴 | live 仍是假证书，当前未拿到真实证书 PEM，无法生成 `m5-tls.yaml` | E49 | E46 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 获取 `fullchain.pem / privkey.pem` 或 cert-manager 产出的正式证书物料 | 24h | E18 |
| EXT-004 | `m5-tls` Secret | 🔴 | 最新实跑 `formal-window-20260719-154427` 已再次证实集群内不存在 `m5-tls`，真实窗口被门禁阻断 | E49 | E52 | [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) / [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md) | 拿到正式证书后生成 `infra/k8s/rendered-public/m5-tls.yaml` 并挂载到集群 | 12h | E52 |
| EXT-005 | 正式 DNS 记录 | 🟡 | 阿里云 DNS 控制台已确认 `api/admin/store/tob.sportsant.net` 共 8 条 A 记录均已启用并指向 `121.41.69.154 / 120.26.66.40`，待新版 readiness 复检外部解析生效 | E41 | E49 | 阿里云 DNS 控制台实核 / [m5-public-endpoints.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example) / [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md) | 以 `sportsant.net` 口径重跑 readiness，确认 DNS blocker 已消失 | 6h | E18 |
| EXT-006 | `G1/G8` 正式窗口门禁 | 🔴 | 历史门禁窗口 `formal-window-20260719-154427` 仍基于旧 `m5-platform.com` 失败；现已切到 `sportsant.net` 企业口径，待新版 readiness 证明 DNS 已绿且 `m5-tls` 到位前仍禁止真实 `apply` | E49 | E18 + E41 + E52 | [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md) / [m5-public-endpoints.env.example](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/templates/m5-public-endpoints.env.example) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 仅在 `sportsant.net DNS + TLS + m5-tls Secret/manifest` 三项全绿后才允许发起真实窗口 | 6h | E18 |

## 结论

- `DNS + TLS` 已被正式升格为 `G1/G8` 的外部硬阻塞
- 每项均已补充责任、证据、下一步、时限与超时升级路径
- `G1/G8` 外部门禁统一入口见 [ONE-PAGE-INDEX.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/ONE-PAGE-INDEX.md)
- `G8` 最终作战面板见 [FINAL-WAR-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/FINAL-WAR-BOARD.md)
- `G8` 外部阻塞催办总览见 [2026-07-19-g8-external-blocker-report.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-external-blocker-report.md)
- 可直接发送的对外催办模板见 [2026-07-19-g8-external-escalation-templates.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-external-escalation-templates.md)
- 在 `EXT-006` 解除前，禁止将 `G1` 误报为可发起复签，禁止将 `G8` 误报为可执行真实 `apply`
