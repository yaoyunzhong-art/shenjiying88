# 🎯 E2E链分级方案 (L0/L1/L2)

> 审计编号: G3-E13 收银审计
> 创建: 2026-07-21
> 状态: ✅ 已定稿
> 铁律: 圈梁第五道箍 — 知识赋能 (manual降级)

---

## 1. 分级总表

| 级 | 数量 | 内容 | 验收频率 | 失败阻断 |
|:--|:----:|:-----|:--------:|:--------:|
| **L0** | 5条 | 收银/支付/退款/对账/租户登录 (生命线) | 每次 PR 前 | ✅ 阻断发布 |
| **L1** | 20条 | 核心业务链（日常交易、会员、营销、库存、报表） | 每日 | ⚠️ 需人工确认 |
| **L2** | 47条 | 全量链（含L0+L1+所有扩展链） | 每周 | ℹ️ 记录观察 |

### 总量
- 现有 E2E 测试文件: **47 个** (cross-module-e2e-*.test.ts)
- L0: 5 条
- L1: 15 条 (L0 之外的次核心链)
- L2: 27 条 (其余)
- 总覆盖链: 47 条

---

## 2. L0 — 生命线 (5条，每次PR前)

> **判定规则**: 涉及收银核心链路、支付网关、退款、日清对账、租户隔离的 E2E 链。阻断级别 — 失败则不可发布。

| # | 文件名 | 标题 | it数 | 原由 |
|:-:|:-------|:-----|:----:|:-----|
| 1 | `cross-module-e2e-8-reservation-queue-cashier` | 预约→排队→收银→完成 全链路 | 7 | 核心收银通路 |
| 2 | `cross-module-e2e-13-daily-settlement` | 日清结算: 1天营业周期端到端 | 5 | 对账 — G3审计核心 |
| 3 | `cross-module-e2e-24-member-coupon-payment-loyalty` | 会员→优惠券→支付→积分/储值 | 6 | 支付链路全闭环 |
| 4 | `cross-module-e2e-45-finance-transactions` | 财务对账→交易管理 全链路 | 12 | 交易对账 — G3审计焦点 |
| 5 | `cross-module-e2e-50-tenant-rls-auth` | 多租户全链 (RLS+AuthGuard) | 9 | 租户登录+数据隔离 |
| | **小计** | | **39** | |

### L0 测试原则
- ✅ 正例覆盖: 收银成功、支付成功、退款成功、日清对平、租户正常登录
- ✅ 反例覆盖: 支付失败、退款拒绝、日清异常(DISPUTED)、租户数据越权
- ✅ 边界覆盖: 并发支付、日清跨租户隔离、余额为零时退款
- ❌ 禁止: `as any` / `describe.skip` / `it.only`
- 🚨 失败时自动阻断 CI pipeline (`--bail 1`)

---

## 3. L1 — 核心业务链 (15条，每日)

> **判定规则**: 日常交易、会员生命周期、营销活动、库存管理、报表、治理审批等核心业务模块链。

| # | 文件名 | 标题 | it数 |
|:-:|:-------|:-----|:----:|
| 6 | `cross-module-e2e-1-admin-to-consumer` | 管理端创建→API→B端→C端消费 | 5 |
| 7 | `cross-module-e2e-2-sdk-to-api` | SDK调用→domain→API返回 | 6 |
| 8 | `cross-module-e2e-3-governance-chain` | 身份认证→治理审批→运行时回调 | 11 |
| 9 | `cross-module-e2e-4-multi-client-consistency` | 多端一致性验证 | 10 |
| 10 | `cross-module-e2e-5-campaign-loyalty-analytics` | Campaign→Loyalty→Analytics闭环 | 8 |
| 11 | `cross-module-e2e-9-inventory-finance` | 采购→入库→应付账款 | 10 |
| 12 | `cross-module-e2e-10-ai-recommend-loyalty-campaign-cashier` | AI推荐→会员→营销→收银联动 | 8 |
| 13 | `cross-module-e2e-19-multi-tenant-isolation` | 多租户隔离 | 6 |
| 14 | `cross-module-e2e-23-tenant-market-bootstrap-portal` | 租户初始化→市场配置→Portal引导 | 6 |
| 15 | `cross-module-e2e-25-sdk-domain-api-contract` | SDK→Domain→API→多端合同一致性 | 8 |
| 16 | `cross-module-e2e-36-tenant-isolation-governance` | 跨租户数据隔离+治理审计 | 10 |
| 17 | `cross-module-e2e-41-member-coupon-payment-loyalty` | 会员→优惠券→支付→忠诚度(扩展) | 10 |
| 18 | `cross-module-e2e-42-sdk-domain-api-storefront` | SDK→Domain→API→Storefront | 14 |
| 19 | `cross-module-e2e-44-brand-logistics` | 品牌运营→后勤全链路 | 13 |
| 20 | `cross-module-e2e-46-brand-storefront` | 品牌运营+商城全链 | 6 |
| | **小计** | | **131** |

### L1 测试原则
- ✅ 核心业务正例 × 反例覆盖
- ✅ 跨模块数据流验证
- ⚠️ 允许每日定时执行，不强制阻断PR
- ❌ 禁止: `describe.skip` / `it.only`

---

## 4. L2 — 全量链 (27条，每周)

> **判定规则**: 所有非 L0/L1 的 E2E 链，含观测、边缘计算、AI工作流、多区域容灾、CDN缓存、内容审核、联邦学习、许可证安全等扩展场景。

| # | 文件名 | 标题 | it数 |
|:-:|:-------|:-----|:----:|
| 21 | `cross-module-e2e-11-inventory-notification-operations` | 库存预警→运营通知联动 | 8 |
| 22 | `cross-module-e2e-12-concurrent-pressure` | 并发压测: 预约争抢/支付回调幂等/库存race | 4 |
| 23 | `cross-module-e2e-14-observability-metrics` | Observability: Prometheus /metrics + HTTP拦截器 | 8 |
| 24 | `cross-module-e2e-15-tournament-insight-notification` | 赛事管理→AI经营洞察→通知派发 | 4 |
| 25 | `cross-module-e2e-16-observability-pipeline` | Observability管道: Logger→Tracing→Metrics | 7 |
| 26 | `cross-module-e2e-17-reservation-notification-metrics` | 预约→通知→Metrics指标追踪 | 5 |
| 27 | `cross-module-e2e-20-champion-referral-knowledge` | Champion→Referral→Knowledge全链路 | 6 |
| 28 | `cross-module-e2e-21-anomaly-auto-rollback-timeseries` | Anomaly→AutoRollback→TimeSeries | 7 |
| 29 | `cross-module-e2e-22-marketing-leads-referral` | Marketing→Leads→Referral营销转化 | 9 |
| 30 | `cross-module-e2e-26-marketing-analytics-snapshot` | Marketing→Analytics Snapshot闭环 | 2 |
| 31 | `cross-module-e2e-27-member-payment-analytics` | Member Payment→Analytics Snapshot闭环 | 2 |
| 32 | `cross-module-e2e-28-campaign-analytics-snapshot` | Campaign Evaluate→Analytics Snapshot | 2 |
| 33 | `cross-module-e2e-29-iot-edge-realtime-lineage` | IoT→Edge→Realtime→Lineage数据管道 | 21 |
| 34 | `cross-module-e2e-30-multi-region-failover-rollback` | 多云区域容灾·健康监测·自动回滚 | 19 |
| 35 | `cross-module-e2e-31-content-brand-i18n-multimedia` | 内容管理·品牌定制·国际化·多媒体 | 22 |
| 36 | `cross-module-e2e-32-nest-testing-module-integration` | Nest TestingModule: IoT→Edge→Realtime→Lineage | 9 |
| 37 | `cross-module-e2e-33-ai-content-review-workflow` | AI辅助内容审核工作流 | 11 |
| 38 | `cross-module-e2e-34-fault-injection-graceful-degradation` | 故障注入+降级恢复+审计追溯 | 9 |
| 39 | `cross-module-e2e-35-nest-upgrade-multi-region-content` | Nest升级·MultiRegion→Health→AutoRollback | 13 |
| 40 | `cross-module-e2e-37-cdn-cache-invalidation-workflow` | 边缘缓存+CDN失效工作流 | 12 |
| 41 | `cross-module-e2e-38-ai-cs-session-push-member` | AI客服→会话→推送→会员反馈 | 12 |
| 42 | `cross-module-e2e-39-federated-learning-edge-image-recognition` | 联邦学习→边缘AI→图像识别→设备适配 | 11 |
| 43 | `cross-module-e2e-40-license-security-audit-workbench` | 许可证→安全审计→操作追溯→工作台权限 | 12 |
| 44 | `cross-module-e2e-43-content-review-notification-multiclient` | 内容→AI审核→通知→多端消费 | 11 |
| 45 | `cross-module-e2e-47-logistics-inventory` | 后勤+库存全链 | 7 |
| 46 | `cross-module-e2e-48-brand-finance` | 品牌+财务全链 | 8 |
| 47 | `cross-module-e2e-49-logistics-finance` | 后勤+财务全链 | 8 |
| | **小计** | | **239** |

---

## 5. 执行策略

### 5.1 PR前 — L0 自动触发

```bash
# 只跑L0 5条生命线
npx vitest run --config vitest.config.ts apps/api/src/modules/cross-module/cross-module-e2e-8* apps/api/src/modules/cross-module/cross-module-e2e-13* apps/api/src/modules/cross-module/cross-module-e2e-24* apps/api/src/modules/cross-module/cross-module-e2e-45* apps/api/src/modules/cross-module/cross-module-e2e-50*
```

### 5.2 每日 — L0 + L1 (20条)

```bash
# 核心链每日验证
npx vitest run --config vitest.config.ts apps/api/src/modules/cross-module/cross-module-e2e-{[18],13,24,45,50,[2359],4,5,10,19,23,25,36,41,42,44,46}*
```

### 5.3 每周 — 全量 L2 (47条)

```bash
# 全量回归
npx vitest run --config vitest.config.ts apps/api/src/modules/cross-module/
```

### 5.4 脚本执行

```bash
# 指定级别运行
bash scripts/e2e-tier-check.sh --tier L0   # 生命线
bash scripts/e2e-tier-check.sh --tier L1   # 核心链
bash scripts/e2e-tier-check.sh --tier L2   # 全量
bash scripts/e2e-tier-check.sh --list      # 仅列出分级明细
bash scripts/e2e-tier-check.sh --verify    # 校验分级一致性
```

---

## 6. 圈梁五道箍合规

| # | 箍 | 状态 | 说明 |
|:-:|:---|:----:|:-----|
| ① | TSC通过 | ✅ | E2E 链测试文件已有 TSC 覆盖 |
| ② | 测试存在 | ✅ | 47 个测试文件，~409 个 it 用例 |
| ③ | 圈梁表更新 | ✅ | 本表为最新圈梁表记录 |
| ④ | PRD标记 | ✅ | G3 审计已确认分级必要性 |
| ⑤ | 知识赋能 | ✅ | 本文档完成 manual 降级记录 |

---

## 7. 附录

### 7.1 分级关键词匹配规则

脚本使用关键词自动判定分级:

```yaml
L0_keywords:
  - 收银 cashier
  - 支付 payment
  - 退款 refund
  - 对账 reconciliation settlement
  - 租户 tenant rls auth

L1_keywords:
  - 会员 member coupon loyalty points
  - 营销 campaign marketing referral
  - 库存 inventory logistics procurement
  - 治理 governance approval
  - 品牌 brand
  - SDK domain api contract
  - 管理端 admin consumer
  - 多端一致性 multi-client consistency
```

### 7.2 文件列表 (47链)

| # | 文件名 | 级 | it数 |
|:-:|:-------|:--:|:----:|
| 1 | `cross-module-e2e-1-admin-to-consumer` | L1 | 5 |
| 2 | `cross-module-e2e-2-sdk-to-api` | L1 | 6 |
| 3 | `cross-module-e2e-3-governance-chain` | L1 | 11 |
| 4 | `cross-module-e2e-4-multi-client-consistency` | L1 | 10 |
| 5 | `cross-module-e2e-5-campaign-loyalty-analytics` | L1 | 8 |
| 6 | `cross-module-e2e-8-reservation-queue-cashier` | **L0** | 7 |
| 7 | `cross-module-e2e-9-inventory-finance` | L1 | 10 |
| 8 | `cross-module-e2e-10-ai-recommend-loyalty-campaign-cashier` | L1 | 8 |
| 9 | `cross-module-e2e-11-inventory-notification-operations` | L2 | 8 |
| 10 | `cross-module-e2e-12-concurrent-pressure` | L2 | 4 |
| 11 | `cross-module-e2e-13-daily-settlement` | **L0** | 5 |
| 12 | `cross-module-e2e-14-observability-metrics` | L2 | 8 |
| 13 | `cross-module-e2e-15-tournament-insight-notification` | L2 | 4 |
| 14 | `cross-module-e2e-16-observability-pipeline` | L2 | 7 |
| 15 | `cross-module-e2e-17-reservation-notification-metrics` | L2 | 5 |
| 16 | `cross-module-e2e-19-multi-tenant-isolation` | L1 | 6 |
| 17 | `cross-module-e2e-20-champion-referral-knowledge` | L2 | 6 |
| 18 | `cross-module-e2e-21-anomaly-auto-rollback-timeseries` | L2 | 7 |
| 19 | `cross-module-e2e-22-marketing-leads-referral` | L2 | 9 |
| 20 | `cross-module-e2e-23-tenant-market-bootstrap-portal` | L1 | 6 |
| 21 | `cross-module-e2e-24-member-coupon-payment-loyalty` | **L0** | 6 |
| 22 | `cross-module-e2e-25-sdk-domain-api-contract` | L1 | 8 |
| 23 | `cross-module-e2e-26-marketing-analytics-snapshot` | L2 | 2 |
| 24 | `cross-module-e2e-27-member-payment-analytics` | L2 | 2 |
| 25 | `cross-module-e2e-28-campaign-analytics-snapshot` | L2 | 2 |
| 26 | `cross-module-e2e-29-iot-edge-realtime-lineage` | L2 | 21 |
| 27 | `cross-module-e2e-30-multi-region-failover-rollback` | L2 | 19 |
| 28 | `cross-module-e2e-31-content-brand-i18n-multimedia` | L2 | 22 |
| 29 | `cross-module-e2e-32-nest-testing-module-integration` | L2 | 9 |
| 30 | `cross-module-e2e-33-ai-content-review-workflow` | L2 | 11 |
| 31 | `cross-module-e2e-34-fault-injection-graceful-degradation` | L2 | 9 |
| 32 | `cross-module-e2e-35-nest-upgrade-multi-region-content` | L2 | 13 |
| 33 | `cross-module-e2e-36-tenant-isolation-governance` | L1 | 10 |
| 34 | `cross-module-e2e-37-cdn-cache-invalidation-workflow` | L2 | 12 |
| 35 | `cross-module-e2e-38-ai-cs-session-push-member` | L2 | 12 |
| 36 | `cross-module-e2e-39-federated-learning-edge-image-recognition` | L2 | 11 |
| 37 | `cross-module-e2e-40-license-security-audit-workbench` | L2 | 12 |
| 38 | `cross-module-e2e-41-member-coupon-payment-loyalty` | L1 | 10 |
| 39 | `cross-module-e2e-42-sdk-domain-api-storefront` | L1 | 14 |
| 40 | `cross-module-e2e-43-content-review-notification-multiclient` | L2 | 11 |
| 41 | `cross-module-e2e-44-brand-logistics` | L1 | 13 |
| 42 | `cross-module-e2e-45-finance-transactions` | **L0** | 12 |
| 43 | `cross-module-e2e-46-brand-storefront` | L1 | 6 |
| 44 | `cross-module-e2e-47-logistics-inventory` | L2 | 7 |
| 45 | `cross-module-e2e-48-brand-finance` | L2 | 8 |
| 46 | `cross-module-e2e-49-logistics-finance` | L2 | 8 |
| 47 | `cross-module-e2e-50-tenant-rls-auth` | **L0** | 9 |

### 7.3 变更记录

| 日期 | 版本 | 变更 |
|:----|:----|:-----|
| 2026-07-21 | v1.0 | 初版创建，基于G3审计要求建立L0/L1/L2分级 |

---

> 📌 **圈梁第五道箍 • 知识赋能**: 本文档为 G3 收银审计(E13) & 树哥 E2E 链分级设计的知识输出。参见 `scripts/e2e-tier-check.sh` 自动化配套脚本。
