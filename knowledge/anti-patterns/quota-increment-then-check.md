# Anti-Pattern · quota-increment-then-check (并发漂移)

> 创建日期: 2026-06-25
> 来源: Phase-15 早期实现
> 危害: quota 计数超过实际资源数

## 错误表现
```typescript
// ❌ 错误
async createResource(input: Input) {
  const current = await this.quotaService.get(tenantId, Resource);
  if (current >= max) {
    throw new QuotaExceededException();
  }
  await this.repository.create(input);
  await this.quotaService.increment(tenantId, Resource, 1);  // 并发场景下可能超
}
```

## 为什么错
1. **check + increment 非原子**: 两个并发请求都过 check,然后都 increment,导致 quota 超 max
2. **race condition**: 并发场景无法防御
3. **不可重入**: 如果 repository.create 失败,increment 不回滚

## 正确做法
[reserve-rollback pattern](../patterns/reserve-rollback.md):
```typescript
// ✅ 正确
const result = await this.quotaService.reserve(tenantId, Resource, 1);
if (!result.allowed) {
  throw new QuotaExceededException(result);
}
try {
  await this.repository.create(input);
} catch (error) {
  await this.quotaService.decrement(tenantId, Resource, 1);
  throw error;
}
```

## 关键要点
1. **原子 reserve**: 内部用乐观锁或 DB transaction
2. **失败回滚**: catch 中 decrement
3. **成功无需 commit**: reserve 已永久占用

## 关联文档
- [patterns/reserve-rollback.md](../patterns/reserve-rollback.md) · 正确模式
- [patterns/quota-guard.md](../patterns/quota-guard.md) · 上层守卫
- [lessons-learned/phase-15.md](../lessons-learned/phase-15.md) Lesson 2