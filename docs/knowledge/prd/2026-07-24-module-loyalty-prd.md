---
module: loyalty
date: 2026-07-24
status: 已评审
author: 树哥A
tags: [prd, loyalty, 圈梁五道箍]
---

# 会员忠诚度 (Loyalty) — PRD 文档

## 1. 背景

### 1.1 业务背景

神机营 SaaS 零售平台的会员运营体系需要一套完整的忠诚度管理功能，包括：**积分体系**、**优惠券体系**、**盲盒抽奖体系**。管理员可创建营销计划，会员在线下消费时可获得积分、优惠券、盲盒奖励，提升复购率和用户粘性。

场景串联：顾客结账 → 订单结算 → 自动发放积分 + 使用优惠券 + 抽取盲盒 → 更新会员忠诚度概览。

### 1.2 痛点

1. 积分、优惠券、盲盒三套体系独立实现，缺乏统一结算入口
2. 盲盒概率需要合规披露（抽卡类消费合规需求）
3. 盲盒抽取需防超卖（库存原子扣减），且需要审计链保障公平性
4. 多租户场景下，各加盟商的优惠券/盲盒计划完全隔离

### 1.3 目标

- 统一的会员忠诚度管理后端，支持积分、优惠券、盲盒三大类营销计划
- 盲盒抽取支持概率披露 + 链式审计日志 + 保底箱机制
- 优惠券固定金额/百分比折扣，支持多维度限制（总量、每人限领）
- 结算链路串联消费订单 → 忠诚度奖励发放
- Redis LUA 原子配额扣减，支持 InMemory 降级回退

---

## 2. 功能需求

### 2.1 积分账本 (Points Ledger)

| ID | 功能 | 描述 |
|----|------|------|
| F-01 | 积分流水查询 | `GET /loyalty/points-ledger` → 查询某租户全部积分流水 |

### 2.2 优惠券计划 (Coupon Plans)

| ID | 功能 | 描述 |
|----|------|------|
| F-02 | 创建优惠券计划 | `POST /loyalty/coupon-plans` → 注册一个新优惠券计划（code/title/discountType/discountValue/配额/有效期） |
| F-03 | 优惠券计划列表 | `GET /loyalty/coupon-plans` → 查询当前租户所有计划 |
| F-04 | 优惠券计划详情 | `GET /loyalty/coupon-plans/:planId` → 单个计划完整信息 |
| F-05 | 计划启停 | `PATCH /loyalty/coupon-plans/:planId/status` → Draft/Active/Paused/Expired |
| F-06 | 发放优惠券 | `POST /loyalty/coupon-plans/:planId/issue` → 向指定 memberId 发放优惠券（扣减 quota） |

### 2.3 优惠券核销 (Coupon Redemption)

| ID | 功能 | 描述 |
|----|------|------|
| F-07 | 核销记录查询 | `GET /loyalty/coupon-redemptions` → 查询核销记录 |

### 2.4 盲盒计划 (Blindbox Plans)

| ID | 功能 | 描述 |
|----|------|------|
| F-08 | 创建盲盒计划 | `POST /loyalty/blindbox-plans` → 注册盲盒计划（title/unitPrice/奖励池权重/保底箱/有效期） |
| F-09 | 盲盒计划列表 | `GET /loyalty/blindbox-plans` → 当前租户所有盲盒计划 |
| F-10 | 盲盒计划详情 | `GET /loyalty/blindbox-plans/:planId` |
| F-11 | 概率披露 | `GET /loyalty/blindbox-plans/:planId/probability` → 标准概率展示 + 近期抽取记录 |
| F-12 | 计划启停 | `PATCH /loyalty/blindbox-plans/:planId/status` |
| F-13 | 盲盒抽取 | `POST /loyalty/blindbox-plans/:planId/issue` → 会员抽盒（原子扣减配额） |

### 2.5 盲盒审计 (Blindbox Audit)

| ID | 功能 | 描述 |
|----|------|------|
| F-14 | 抽取记录 | `GET /loyalty/blindbox-draw-records` → 分页查询抽取审计日志 |
| F-15 | 完整性校验 | `GET /loyalty/blindbox-draw-records/integrity` → 链式哈希审计 |
| F-16 | 成员概览 | `GET /loyalty/blindbox-members/:memberId/overview` → 累计抽取次数/保底命中 |

### 2.6 订单结算 (Order Settlement)

| ID | 功能 | 描述 |
|----|------|------|
| F-17 | 结算记录查询 | `GET /loyalty/settlements` → 订单结算记录（积分 + 优惠券 + 盲盒） |

---

## 3. 非功能需求

| ID | 维度 | 要求 |
|----|------|------|
| NFR-01 | 配额原子性 | Redis LUA 脚本保证 quota 扣减原子性（并发安全） |
| NFR-02 | 降级策略 | Redis 不可用时自动回退到 InMemory 模式 |
| NFR-03 | 审计不可篡改 | 每个审计日志包含前一条的哈希，形成链式校验 |
| NFR-04 | 概率合规 | 概率披露接口返回真实权重与计算概率 |
| NFR-05 | 响应时间（抽取） | P95 < 200ms |
| NFR-06 | 多租户隔离 | 各租户计划/发放/审计完全隔离 |
| NFR-07 | 配额不可超卖 | 发放时严格校验 remainingQuota > 0 |

---

## 4. 数据模型概要

### 4.1 CouponPlan

| 字段 | 类型 | 说明 |
|------|------|------|
| planId | string | 计划唯一 ID |
| code | string | 优惠券码 |
| title | string | 标题 |
| description | string? | 描述 |
| discountType | CouponDiscountType | FIXED_AMOUNT \| PERCENTAGE |
| discountValue | number | 优惠金额/百分比 |
| minOrderAmount | number? | 最低消费门槛 |
| totalQuota | number | 总配额 |
| remainingQuota | number | 剩余配额 |
| perMemberLimit | number | 每人限领次数 |
| validFrom | string | 有效期开始 |
| validUntil | string | 有效期结束 |
| status | LoyaltyPlanStatus | Draft/Active/Paused/Expired |

### 4.2 BlindboxPlan

| 字段 | 类型 | 说明 |
|------|------|------|
| planId | string | 计划 ID |
| title | string | 标题 |
| unitPrice | number | 单价（积分） |
| totalQuota | number | 总库存 |
| remainingQuota | number | 剩余库存 |
| rewardPool | BlindboxRewardEntry[] | 奖励池（SKU + 权重 + 等级） |
| probabilityDisclosure | BlindboxProbabilityDisclosureEntry[] | 概率披露 |
| caseGuarantee | BlindboxCaseGuarantee? | 保底箱配置（caseSize + guaranteedTier） |
| validFrom / validUntil | string | 有效期 |
| status | LoyaltyPlanStatus | 状态 |

### 4.3 BlindboxRewardEntry

| 字段 | 类型 | 说明 |
|------|------|------|
| sku | string | 商品 SKU |
| weight | number | 权重 |
| label | string | 显示标签 |
| tier | BlindboxRewardTier | STANDARD / HOT / HIDDEN / SUPER_HIDDEN |

### 4.4 BlindboxDrawAuditLog

| 字段 | 类型 | 说明 |
|------|------|------|
| auditLogId | string | 审计日志 ID |
| sequence | number | 序号（递增） |
| memberId | string | 会员 ID |
| planId | string | 盲盒计划 ID |
| quantity | number | 抽取数量 |
| quotaBefore / quotaAfter | number | 扣减前后剩余配额 |
| auditHash | string | 本链节点哈希 |
| previousAuditLogId | string? | 上一条审计日志 ID |
| previousHash | string? | 上一条哈希值 |
| rewards | BlindboxRewardResult[] | 抽中奖励 |
| createdAt | string | 创建时间 |

### 4.5 PointsLedgerEntry

| 字段 | 类型 | 说明 |
|------|------|------|
| entryId | string | 流水 ID |
| memberId | string | 会员 ID |
| orderId | string | 订单 ID |
| paymentId | string | 支付 ID |
| points | number | 积分变化（正/负） |
| reason | string | 变更原因 |
| createdAt | string | 时间 |

### 4.6 LoyaltyOrderSettlement

| 字段 | 类型 | 说明 |
|------|------|------|
| settlementId | string | 结算 ID |
| orderId | string | 订单 ID |
| paymentId | string | 支付 ID |
| memberId | string | 会员 ID |
| status | LoyaltySettlementStatus | Succeeded / Failed |
| awardedPoints | number | 奖励积分 |
| couponCode | string? | 使用的优惠券码 |
| blindboxPlanId | string? | 抽取的盲盒计划 |

---

## 5. 依赖关系

- **RedisService**: 配额原子扣减（LUA 脚本），降级到 InMemory
- **MemberService**: 会员基础信息服务
- **MarketingMetricsService**: 营销效果指标（可选注入）
- **CashierEntity/TransactionsEntity**: 消费订单与支付数据结构（结算时引用）
- **TenantGuard**: 多租户 RLS
- **存储**: 当前使用内存 Map，后续可迁移到 PostgreSQL
