# Anti-Pattern: Quota Double Increment

> ❌ 错误做法

```typescript
// ❌ 错误:reserve 已 increment,业务成功又 increment
const reserveResult = quota.reserve(tenantId, QuotaResourceKind.Coupon);
// reserve 内部已调用 increment!
if (!reserveResult.allowed) return error;
// ...
if (success) {
  quota.increment(tenantId, QuotaResourceKind.Coupon, 1);  // 双重 increment!
}
```

## 为什么错

`TenantQuotaService.reserve()` 实现:
```typescript
reserve(tenantId, kind) {
  const result = this.check(tenantId, kind);
  if (result.allowed) this.increment(tenantId, kind);  // 这里已经 +1
  return result;
}
```

所以 `reserve` = `check + increment`。再调 `increment` 就变成 +2。

## 后果

- 业务成功: quota 多 +1,看起来还能用,但实际超出配额 (慢泄漏)
- 业务失败: quota +1 后没回滚,资源永远被占用

## ✅ 正确做法

```typescript
// 方案 1: 用 check 不用 reserve
const checkResult = quota.check(tenantId, QuotaResourceKind.Coupon);
if (!checkResult.allowed) throw CouponBusinessError('QUOTA_EXCEEDED');
// 业务成功后
if (success) quota.increment(...);

// 方案 2: 用 reserve + 失败时 decrement (但需要在每个 catch 都 decrement)
const r = quota.reserve(tenantId, QuotaResourceKind.Coupon);
if (!r.allowed) throw ...;
try {
  // business
} catch {
  quota.decrement(...);
}
```

## 教训

- 阅读 reserve / increment / decrement 的实现,理解它们的副作用
- 单测 AC-4 暴露了这个 bug,7/7 PASS 后修复

---

> 来源: Phase-17 Pulse-68 · T2 测试驱动修复
> 相关 commit: 84afd6bda
