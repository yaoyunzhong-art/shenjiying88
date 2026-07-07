# Cross-Store Quota Guard · 跨门店 Quota 守卫模式

> 创建: 2026-06-26 01:35 CST · Pulse-68 等待期
> 模式类别: 🛡️ 守卫 / Quota
> 来源: Phase-17 T2 跨门店优惠券 (E40 P0)
> 状态: **DRAFT · Pulse-68 实施后验证**

---

## 🎯 问题

跨门店优惠券核销场景:
- 同一张优惠券需要在 store-1/store-2/store-3 任一门店核销
- 跨租户隔离: tenant-A 的券不能在 tenant-B 的 store-4 核销
- 事务一致性: 部分失败回滚
- 幂等性: 同一订单重复核销只扣减 1 次

之前的 quota guard ([quota-guard.md](./quota-guard.md)) 只处理单门店 / 单租户场景。

---

## 🏗️ 架构扩展

### 双守卫模式 + scope 扩展

```
[Request]
   ↓
1. lifecycle.assertCanWriteResource(tenantId, 'Coupon')  // 租户活跃
   ↓
2. quota.reserve(tenantId, 'Coupon', 1)                  // 预占
   ↓
3. business check:                                         // 业务校验
   - scope.storeIds.includes(storeId)?
   - orderAmount >= minAmount?
   - userSegments.includes(userSegment)?
   ↓
4. idempotency check:                                      // 幂等
   - findOne({ idempotencyKey })
   - 如果已存在 → 直接返回之前的 result
   ↓
5. 事务: coupon.update + redemption_log.insert
   ↓
6. quota.increment(tenantId, 'Coupon', 1)                 // 提交
   ↓
[Success Response]

失败路径:
   ↓ (任意步骤失败)
9. quota.decrement(tenantId, 'Coupon', 1)                  // 回滚
   ↓
   throw QuotaExceededException / BusinessException
```

---

## 💻 实现要点

### 1. scope 数据模型

```typescript
@Index(['tenantId', 'code'], { unique: true })
class CouponV2 {
  @Column({ type: 'jsonb' })
  scope: {
    type: 'single-store' | 'multi-store' | 'tenant-wide';
    storeIds: string[];           // 支持多门店
    includeSubordinates: boolean; // 是否包含子门店
  };
}
```

### 2. checkCrossStoreEligibility

```typescript
checkCrossStoreEligibility(
  coupon: CouponV2,
  storeId: string,
): CrossStoreEligibility {
  const { scope } = coupon;

  // tenant-wide: 任何门店
  if (scope.type === 'tenant-wide') {
    return { eligible: true, matchedScope: 'tenant-wide' };
  }

  // single-store / multi-store: 必须在 storeIds 列表
  if (scope.storeIds.includes(storeId)) {
    return { eligible: true, matchedScope: scope.type, matchedStoreIds: [storeId] };
  }

  // includeSubordinates: 查询子门店
  if (scope.includeSubordinates) {
    const childStores = await this.storeRepo.find({ parentId: { In: scope.storeIds } });
    if (childStores.some(s => s.id === storeId)) {
      return { eligible: true, matchedScope: scope.type };
    }
  }

  return {
    eligible: false,
    reason: `storeId ${storeId} not in scope`,
    matchedStoreIds: scope.storeIds,
  };
}
```

### 3. 幂等性: idempotencyKey

```typescript
@Entity('coupon_redemption_log')
@Index(['idempotencyKey'], { unique: true })
class CouponRedemptionLog {
  @Column() idempotencyKey: string;  // format: `${orderId}:${couponCode}`
}

// 核销前先查
const existing = await redemptionRepo.findOne({
  where: { idempotencyKey: req.idempotencyKey },
});
if (existing) {
  // 幂等命中: 返回之前的 result
  return { success: true, couponId: existing.couponId, amount: existing.amount, redemptionId: existing.id };
}
```

### 4. 事务一致性 (TypeORM)

```typescript
await this.dataSource.transaction(async (manager) => {
  // 1. 更新 coupon
  await manager.update(CouponV2, couponId, {
    redemptionCount: () => 'redemption_count + 1',
  });

  // 2. 写日志
  await manager.insert(CouponRedemptionLog, {
    couponId,
    userId,
    storeId,
    orderId,
    amount,
    idempotencyKey,
  });
});
```

---

## ⚠️ 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 跨门店事务死锁 | 数据不一致 | 短事务 + 幂等键 + 超时回滚 |
| scope.storeIds 过长 | 性能 | max 100 + 分页 + 缓存 |
| 子门店层级过深 | 递归查询慢 | max depth 3 + cache |
| 幂等键冲突 | 误判 | orderId + couponCode 组合足够唯一 |
| 并发核销 | oversell | optimistic locking + Redis 原子扣减 |

---

## 🧪 测试场景

### 单元测试
- ✅ T1: single-store 匹配
- ✅ T2: single-store 不匹配
- ✅ T3: multi-store 任一门店
- ✅ T4: tenant-wide 任何门店
- ⏳ T5: includeSubordinates 子门店
- ⏳ T6: 幂等键命中

### E2E 测试 (5 场景)
- ✅ E2E-1: single → multi 迁移
- ✅ E2E-2: 同一租户 3 门店联动
- ✅ E2E-3: 跨租户隔离
- ✅ E2E-4: 事务回滚
- ✅ E2E-5: 幂等不重复扣减

### 性能测试
- ⏳ 100 并发核销 < 200ms (p95)
- ⏳ 1000 并发 idempotencyKey 命中 < 50ms

---

## 🔗 关联

- [patterns/quota-guard.md](./quota-guard.md) · 基础 quota guard 模式
- [patterns/reserve-rollback.md](./reserve-rollback.md) · 回滚模式
- [patterns/optional-di.md](./optional-di.md) · NestJS DI 避免循环依赖
- [../lessons-learned/phase-15.md](../lessons-learned/phase-15.md) · Phase-15 经验
- [../decision-records/DR-001-multi-tenant-guard.md](../decision-records/DR-001-multi-tenant-guard.md) · 多租户守卫
- [../../.trae/specs/phase-17-marketing-community/spec.md](../../.trae/specs/phase-17-marketing-community/spec.md) §1.1 · Phase-17 Spec

---

> 由 Pulse-68 等待期 Day 1 起草
> Pulse-68 实施后填写实际验证结果