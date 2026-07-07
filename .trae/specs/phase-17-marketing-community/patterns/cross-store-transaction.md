# Pattern: Cross-Store Transaction

> 适用场景: 跨门店优惠券核销、跨门店积分通兑、跨门店库存调拨

## 核心问题

单一门店事务简单 (本地 DB transaction 即可)。跨门店时:
1. 多个门店的数据可能跨库 (生产多 store_id 可能 sharding)
2. quota 计数需要跨门店累计
3. 失败回滚要 atomic

## 模式

### 步骤 1: 头部守卫 (dual-guard)
```
lifecycle.assertCanWriteResource(tenantId, 'Coupon')  // tenant-level
quota.check(tenantId, QuotaResourceKind.Coupon)         // resource-level
```

### 步骤 2: 幂等检查
```
existing = redemptionRepo.findOne({ idempotencyKey })
if (existing) return success: existing.redemptionId
```

### 步骤 3: 业务校验 (chain-of-responsibility)
```
coupon = couponRepo.findOne({ tenantId, code, status: 'active' })
if (!coupon) throw CouponBusinessError('COUPON_NOT_FOUND')
if (coupon.expiresAt < now) throw CouponBusinessError('COUPON_EXPIRED')
if (!checkScope(coupon, storeId)) throw CouponBusinessError('STORE_NOT_IN_SCOPE')
// ... 其他校验
```

### 步骤 4: 事务提交
```
await dataSource.transaction(async manager => {
  // CAS 防止并发:用 (id, version) 条件 update
  result = await couponRepo.update({ id, redemptionCount: coupon.redemptionCount }, { redemptionCount: +1 })
  if (result.affected === 0) throw 'Concurrent conflict'
  await redemptionRepo.insert({ ... })
})
```

### 步骤 5: 业务成功后才递增 quota
```
quota.increment(tenantId, QuotaResourceKind.Coupon, 1)
```

### 步骤 6: catch 块统一处理
```
} catch (err) {
  // quota 未递增,无需 decrement
  if (err instanceof CouponBusinessError) return { success: false, error: { code: err.code } }
  return { success: false, error: { code: 'INTERNAL', message: err.message } }
}
```

## 关键原则

1. **check vs reserve**: 用 `check()` 不 `reserve()` 避免双重 increment
2. **throw not return**: 业务失败 throw,统一走 catch,确保 quota 一致性
3. **CAS 防止并发**: 用 `update where id=X and redemptionCount=Y`,affected=0 表示冲突
4. **idempotency 兜底**: unique index on idempotencyKey + 提前检查双重防护

## 性能

- 单次 redeem p95 ~ 21ms (100 并发模拟)
- 生产目标 < 200ms (含 DB IO + Redis cache)
- Redis cache 热点 coupon → 命中后走 in-memory 校验

## 测试覆盖

- AC-1: single→multi 迁移
- AC-2: 同租户 3 门店联动
- AC-3: 跨租户隔离
- AC-4: 事务回滚 (quota 不挂账)
- AC-5: 幂等性

---

> 来源: Phase-17 Pulse-68 · 7/7 e2e PASS
> 关联: DR-004, lessons-learned/phase-17.md
