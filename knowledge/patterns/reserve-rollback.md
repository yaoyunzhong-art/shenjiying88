# Pattern · reserve-rollback (资源预留与回滚)

> 创建日期: 2026-06-25
> 来源: Phase-15E registerPersistent
> 验证: 8 个 service 全部使用

## 适用场景
需要在"原子操作"中预留资源(quota/lock/token),失败时回滚。

## 三步模式

### Step 1 · reserve (原子预留)
```typescript
const result = await quotaService.reserve(tenantId, Resource, count);
if (!result.allowed) {
  throw new QuotaExceededException(result);
}
```

### Step 2 · 业务执行
```typescript
const entity = await this.repository.create(input);
```

### Step 3 · 异常回滚 / 成功保留
```typescript
} catch (error) {
  await quotaService.decrement(tenantId, Resource, count);
  throw error;
}
// 成功路径:reserve 已占用,无需 commit
```

## 关键要点
1. **reserve 返回布尔**: 不抛异常,需要检查 `.allowed`
2. **catch 必须 decrement**: 业务失败时回滚
3. **成功路径无需 commit**: reserve 已永久占用
4. **decrement 必须幂等**: 网络重试不会重复执行

## 适用扩展
- 数据库行锁 (`SELECT FOR UPDATE` + 失败释放)
- 分布式锁 (`SETNX` + `DEL`)
- 优惠券预扣 (`hold` + `consume` 或 `release`)

## 关联文档
- [quota-guard.md](quota-guard.md) · 上层守卫模式
- [lessons-learned/phase-15.md](../lessons-learned/phase-15.md) · Phase-15 经验