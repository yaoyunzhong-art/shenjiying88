# G8 Short Escalation Messages

- window_id: `formal-window-20260719-154427`
- source_log: [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
- blocker_report: [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)

## DNS

```text
【G8阻塞催办｜DNS】
最新正式窗口 readiness 已在 formal-window-20260719-154427 失败。
DNS 实测阻塞如下：
- DNS has no A record for api.m5-platform.com
- DNS has no A record for admin.m5-platform.com
- DNS has no A record for store.m5-platform.com
- DNS has no A record for tob.m5-platform.com
请在 24h 内确认 m5-platform.com 托管位置，并为 api/admin/store/tob 四个 host 创建 A 记录。
目标 IP：121.41.69.154 / 120.26.66.40
完成标准：四个 host 的 dig +short A 均返回生产 NLB IP，之后重跑 G8 readiness。
```

## TLS

```text
【G8阻塞催办｜TLS / m5-tls】
最新正式窗口 readiness 已在 formal-window-20260719-154427 失败。
TLS 实测阻塞如下：
- Live TLS secret is missing: m5-tls
请在 24h 内二选一完成：
1. 提供正式证书 fullchain.pem + privkey.pem
2. 直接在 m5 namespace 下发 live m5-tls secret
完成标准：kubectl -n m5 get secret m5-tls 成功，之后重跑 G8 readiness。
在 m5-tls 未到位前，禁止发起 G8 真实 apply。
```

## Host Decision

```text
【G8阻塞催办｜正式域名拍板】
当前 G8 进入正式窗口前，业务侧仍需拍板 storefront / tob 正式 host。
最新正式窗口号：formal-window-20260719-154427
请在 12h 内确认 storefront 与 tob 的最终正式域名。
确认后请立即回写 infra/k8s/templates/m5-public-endpoints.env.example
完成标准：正式 host 不再使用占位口径，DNS 与证书 SAN 可按最终口径一次性落地。
在 host 未拍板前，DNS 与证书都无法彻底闭环，因此 G8 不能进入真实 apply。
```
