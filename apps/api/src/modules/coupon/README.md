# 优惠券模块

> 模块路径: `apps/api/src/modules/coupon`  
> 更新: 2026-07-24 · Phase-17 · Pulse-68/70

---

## 业务概述

优惠券模块是 ShenJiYing 系统的**跨门店优惠券引擎** (E40 P0)，提供完整的优惠券生命周期管理，包括创建、查询、状态管理、跨门店核销和过期清理。采用 **TypeORM + PostgreSQL 持久化**存储，支持多租户隔离、事务性核销和幂等性保证。

**核心设计原则：**
- **Reserve-and-Rollback 模式**：核销流程采用"先校验-后事务-再确认"的三阶段设计
- **头部双守卫**：`lifecycle.assertWriteAllowed` + `quota.reserve` 双重保障
- **幂等核销**：通过 `idempotencyKey` 唯一索引防止同一订单重复核销
- **乐观锁**：通过条件更新 `redemptionCount` 字段防止并发超卖

**核心应用场景：**
- 门店运营：创建优惠券活动，支持全店/多店/单店范围
- 前台核销：跨门店验证优惠券有效性并完成扣减
- 后端清理：定期扫描过期优惠券自动标记
- 营销活动：未来扩展 AI 智能分发 (Pulse-69)

---

## 领域模型 / 核心实体

### CouponV2

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK) | 优惠券唯一 ID |
| `tenantId` | `string` | 租户 ID (唯一索引: tenantId + code) |
| `code` | `string` | 优惠券码 |
| `scope` | `jsonb` | 范围: `{ type, storeIds[], includeSubordinates }` |
| `redemptionRules` | `jsonb` | 核销规则: `{ minAmount?, applicableCategories?, excludeItems?, userSegments? }` |
| `value` | `decimal(10,2)` | 优惠面额 |
| `valueType` | `'fixed' \| 'percentage'` | 优惠类型 |
| `expiresAt` | `timestamp` | 过期时间 |
| `status` | `'active' \| 'paused' \| 'expired' \| 'exhausted'` | 状态 |
| `redemptionCount` | `int` | 已核销次数 |
| `maxRedemptions?` | `int` | 最大核销次数 |

#### 索引

| 索引 | 字段 | 说明 |
|------|------|------|
| `UK` | `[tenantId, code]` | 租户内优惠券码唯一 |
| `IDX` | `[tenantId, status]` | 按租户+状态筛选 |
| `IDX` | `[expiresAt]` | 过期清理扫描 |

### CouponScope

```ts
interface CouponScope {
  type: 'single-store' | 'multi-store' | 'tenant-wide'
  storeIds: string[]
  includeSubordinates: boolean
}
```

### CouponRedemptionLog

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` (PK) | 核销日志 ID |
| `couponId` | `string` | 关联优惠券 ID |
| `userId` | `string` | 核销用户 ID |
| `storeId` | `string` | 实际核销门店 ID |
| `orderId` | `string` | 关联订单 ID |
| `amount` | `decimal(10,2)` | 核销金额 |
| `idempotencyKey` | `string` (UK) | 幂等键 |
| `redeemedAt` | `timestamp` | 核销时间 |

---

## API 端点一览

> 路由前缀: `/api/v1/coupons`（全局前缀自动添加）  
> 全部端点受 `TenantGuard` 保护

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|------------|
| `POST` | `/coupons` | 创建优惠券 | `CreateCouponDto` |
| `GET` | `/coupons` | 查询列表 | `ListCouponDto` (page, pageSize, status, tenantId) |
| `GET` | `/coupons/:id` | 优惠券详情 | 路径参数 `id` |
| `PATCH` | `/coupons/:id/status` | 更新状态 | `{ status: 'active' \| 'paused' }` |
| `POST` | `/coupons/redeem` | 跨门店核销 | `RedeemCouponDto` |
| `POST` | `/coupons/batch-redeem` | 批量核销 | `{ redemptions: RedeemCouponDto[] }` |

### 核销流程 (Reserve-and-Rollback)

```
① lifecycle.assertWriteAllowed(tenantId)
② requireTenantContext() + assertStoreOwnership(storeId)
③ quota.check(tenantId, Coupon) → 不递增，只校验
④ idempotency 幂等检查 → 重复则直接返回历史结果
⑤ 查 coupon → 校验 code/status/expired
⑥ checkCrossStoreEligibility → 校验门店范围
⑦ 校验 minAmount / maxRedemptions / userSegments
⑧ 事务: coupon.redemptionCount++ + redemption_log.insert
⑨ quota.increment(tenantId, Coupon) → 只有业务成功才递增
⑩ 失败 → 回滚至 ⑤ 步，返回 error code
```

---

## 依赖模块

| 模块 | 用途 |
|------|------|
| `TypeORM` | 实体映射 + 事务 + 查询 |
| `CouponV2` 实体 | 优惠券数据表 |
| `CouponRedemptionLog` 实体 | 核销日志表 |
| `agent` | 租户守卫 (TenantGuard) |
| `tenant` (可选) | TenantLifecycleService, TenantQuotaService |
| `task-scheduler` | 调用 `CouponCleanupService` 执行过期清理 |

---

## 使用示例

### 创建优惠券

```ts
// POST /coupons
{
  "code": "CROSS-2026-50",
  "tenantId": "tenant-A",
  "scope": {
    "type": "multi-store",
    "storeIds": ["store-1", "store-2", "store-3"],
    "includeSubordinates": true
  },
  "redemptionRules": {
    "minAmount": 100,
    "applicableCategories": ["dining", "retail"],
    "userSegments": ["svip", "gold"]
  },
  "value": 50,
  "valueType": "fixed",
  "expiresAt": "2026-12-31T23:59:59Z",
  "maxRedemptions": 1000
}
```

### 跨门店核销

```ts
// POST /coupons/redeem
{
  "userId": "user-001",
  "couponCode": "CROSS-2026-50",
  "storeId": "store-2",
  "orderAmount": 200,
  "orderId": "order-abc-123",
  "idempotencyKey": "order-abc-123:CROSS-2026-50"
}
```

成功响应:
```json
{
  "success": true,
  "couponId": "coupon-001",
  "amount": 50,
  "redemptionId": "redemption-001"
}
```

### 过期清理

```ts
// 由 task-scheduler 定时调用
const couponCleanupService: CouponCleanupService
const cleaned = await couponCleanupService.scanExpiredCoupons('tenant-A')
// cleaned → 本次标记为 expired 的优惠券数量
```

---

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 数据库表名 | `string` | `coupon_v2` | TypeORM 实体表 |
| 日志表名 | `string` | `coupon_redemption_log` | 核销日志表 |
| 分页默认页大小 | `number` | 20 | `list()` 查询默认 |
| 过期清理定时 | — | 外部调度 | 由 task-scheduler 模块配置 cron |
| 租户配额 | `QuotaResourceKind` | `Coupon` | 通过 `TenantQuotaService` 动态配置 |

> **注意**: 
> - `CouponAllianceService` (联名券) 和 `CouponAiDistributeService` (AI 分发) 为预留模块，暂未实现核心逻辑
> - 核销流程中的租户生命周期和配额服务为可选的 `@Optional()` 注入，不强制依赖
