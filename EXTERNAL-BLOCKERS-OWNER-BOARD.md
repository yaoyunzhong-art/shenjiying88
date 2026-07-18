# 外部阻塞责任板

> 更新时间: 2026-07-19
> 目标: 将 `DNS / TLS / 正式域名` 等外部依赖收口为可追责、可升级、可复签的阻塞板

## 当前阻塞

| Blocker ID | 阻塞项 | 状态 | 当前事实 | 负责人 | 协同 | 证据物 | SLA | 超时升级 |
|------------|:------:|:----:|----------|--------|------|--------|-----|----------|
| EXT-001 | DNS 托管归属 | 🔴 | 当前账号未发现 `m5-platform.com` 托管 | E49 | E41 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) | 24h | E41 |
| EXT-002 | 正式域名拍板 | 🔴 | `storefront / tob` 正式 host 未最终定版 | E46 | E49 | [WEEKLY-RYG-STATUS-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/WEEKLY-RYG-STATUS-BOARD.md) | 12h | E18 |
| EXT-003 | TLS 证书 | 🔴 | live 仍是假证书，待申请真实证书并校验 SAN | E49 | E46 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) | 24h | E18 |
| EXT-004 | `m5-tls` Secret | 🔴 | 集群内仍未挂载正式证书 secret | E49 | E52 | [PROD-INGRESS-CUTOVER-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-INGRESS-CUTOVER-20260718.md) | 12h | E52 |
| EXT-005 | 正式 DNS 记录 | 🔴 | 尚未创建指向生产入口的公网记录 | E41 | E49 | [PROD-DNS-CERT-ASSET-AUDIT-20260718.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/PROD-DNS-CERT-ASSET-AUDIT-20260718.md) | 24h | E18 |

## 结论

- 外部阻塞已责任人化
- 每项均有证据物与升级路径
- 当前仍属复签前外部待办，不可视为正式生产已落地
