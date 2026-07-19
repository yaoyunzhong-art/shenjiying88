# 外部阻塞责任板

> 更新时间: 2026-07-19
> 目标: 将 `DNS / TLS / 正式域名` 等外部依赖收口为可追责、可升级、可复签的阻塞板

## 当前阻塞

| Blocker ID | 阻塞项 | 状态 | 当前事实 | 负责人 | 协同 | 证据物 | 下一步 | SLA | 超时升级 |
|------------|:------:|:----:|----------|--------|------|--------|--------|-----|----------|
| EXT-001 | DNS 托管归属 | 🔴 | 当前账号未发现 `m5-platform.com` 托管，正式 DNS 记录无从下发 | E49 | E41 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) / [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) | 确认真实 DNS 提供方并开放 `m5-platform.com` 托管权限 | 24h | E41 |
| EXT-002 | 正式域名拍板 | 🔴 | `storefront / tob` 正式 host 未最终定版，当前仅有 `store/tob.m5-platform.com` 占位口径 | E46 | E49 | [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) / [WEEKLY-RYG-STATUS-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/WEEKLY-RYG-STATUS-BOARD.md) | 战略/业务在 12h 内拍板正式 host，并回写 `m5-public-endpoints.env` | 12h | E18 |
| EXT-003 | TLS 证书 | 🔴 | live 仍是假证书，当前未拿到真实证书 PEM，无法生成 `m5-tls.yaml` | E49 | E46 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 获取 `fullchain.pem / privkey.pem` 或 cert-manager 产出的正式证书物料 | 24h | E18 |
| EXT-004 | `m5-tls` Secret | 🔴 | `preflight-prod-formal-window.sh` 已证实集群内不存在 `m5-tls`，真实窗口被门禁阻断 | E49 | E52 | [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 拿到正式证书后生成 `infra/k8s/rendered-public/m5-tls.yaml` 并挂载到集群 | 12h | E52 |
| EXT-005 | 正式 DNS 记录 | 🔴 | `api/admin/store/tob.m5-platform.com` 四个正式域名均无 A 记录，未指向 `121.41.69.154 / 120.26.66.40` | E41 | E49 | [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 为四个正式域名创建 A 记录并指向生产 NLB 双 IP | 24h | E18 |
| EXT-006 | `G1/G8` 正式窗口门禁 | 🔴 | 形式化门禁已失败: `DNS 无 A 记录 + m5-tls 缺失 + m5-tls.yaml 不存在`，禁止真实 `apply` | E49 | E18 + E41 + E52 | [2026-07-19-g1-release-bundle-confirmation.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g1-release-bundle-confirmation.md) / [2026-07-19-g8-cutover-drill-acceptance.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g8-cutover-drill-acceptance.md) | 仅在 `DNS + TLS + m5-tls Secret/manifest` 三项全绿后才允许发起真实窗口 | 6h | E18 |

## 结论

- `DNS + TLS` 已被正式升格为 `G1/G8` 的外部硬阻塞
- 每项均已补充责任、证据、下一步、时限与超时升级路径
- 在 `EXT-006` 解除前，禁止将 `G1` 误报为可发起复签，禁止将 `G8` 误报为可执行真实 `apply`
