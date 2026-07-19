# 2026-07-19 · G8 外部催办模板

> 目标: 为 `G8` 外部阻塞项提供可直接复制发送的催办模板
> 适用范围: `DNS owner`、`证书/安全 owner`、`业务/战略 owner`
> 依据证据: `formal-window-20260719-154427`

---

## 统一背景

- 最新正式窗口 readiness 实跑已失败
- 窗口号: `formal-window-20260719-154427`
- 日志证据:
  - [00-formal-ready.log](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/00-formal-ready.log)
  - [READINESS-BLOCKERS.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/infra/k8s/cutover-logs/formal-window-20260719-154427/READINESS-BLOCKERS.md)
- 当前明确阻塞:
  - `api/admin/store/tob.m5-platform.com` 四个正式域名均无 A 记录
  - live `m5-tls` secret 缺失
- 当前结论:
  - 在阻塞解除前，禁止发起真实 `apply`

---

## 模板一：发给 DNS Owner

```text
【G8 正式窗口阻塞催办｜DNS】

当前正式窗口 readiness 已在窗口 formal-window-20260719-154427 实跑失败，真实证据如下：
- 00-formal-ready.log
- READINESS-BLOCKERS.md

当前 DNS 侧阻塞已被实锤：
- api.m5-platform.com 无 A 记录
- admin.m5-platform.com 无 A 记录
- store.m5-platform.com 无 A 记录
- tob.m5-platform.com 无 A 记录

请在 24h 内完成以下动作：
1. 确认 m5-platform.com 的真实 DNS 托管位置
2. 为 api/admin/store/tob.m5-platform.com 创建 A 记录
3. 指向生产 NLB 双 IP：
   - 121.41.69.154
   - 120.26.66.40

完成标准：
- dig +short A 四个 host 均返回上述生产 IP
- G8 readiness 重跑时，DNS 项全部消失

当前在 DNS 未就位前，禁止发起 G8 真实 apply。
```

---

## 模板二：发给证书 / 安全 Owner

```text
【G8 正式窗口阻塞催办｜TLS / m5-tls】

当前正式窗口 readiness 已在窗口 formal-window-20260719-154427 实跑失败，真实证据如下：
- 00-formal-ready.log
- READINESS-BLOCKERS.md

当前 TLS 侧阻塞已被实锤：
- live m5-tls secret 缺失
- 当前公网入口仍是假证书链路，尚未具备正式切流条件

请在 24h 内完成以下动作（二选一即可）：
1. 提供正式证书物料：
   - fullchain.pem
   - privkey.pem
2. 直接在 m5 namespace 下发 live m5-tls secret

完成标准：
- kubectl -n m5 get secret m5-tls 成功
或
- 可生成并应用 infra/k8s/rendered-public/m5-tls.yaml

在 m5-tls 未到位前，禁止发起 G8 真实 apply。
```

---

## 模板三：发给业务 / 战略 Owner

```text
【G8 正式窗口阻塞催办｜正式域名拍板】

当前 G8 进入正式窗口前，外部公网资产仍未闭环。
最新正式窗口 readiness 实跑窗口号：
- formal-window-20260719-154427

除 DNS / TLS 外，当前仍有一项上游阻塞：
- storefront / tob 正式 host 尚未最终拍板

请在 12h 内明确以下信息：
1. storefront 正式域名
2. tob 正式域名

完成后请立即回写：
- infra/k8s/templates/m5-public-endpoints.env.example

完成标准：
- 正式 host 不再使用占位口径
- DNS 记录和证书 SAN 可以按最终 host 一次性落地

在 host 未拍板前，DNS 与证书都无法彻底闭环，因此 G8 不能进入真实 apply。
```

---

## 使用建议

- DNS 模板发给 `E41`
- 证书模板发给 `E52 / E46`
- 业务拍板模板发给 `E18 / E46`
- 若 12h / 24h 超时未响应，直接按 [EXTERNAL-BLOCKERS-OWNER-BOARD.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/EXTERNAL-BLOCKERS-OWNER-BOARD.md) 的升级路径升级
