# 乐观锁模式 (optimistic-lock-pattern)

> **核心问题**: 分布式系统/多实例部署中, 共享资源的并发更新必须保证一致性。悲观锁 (DB 行锁) 性能差, 乐观锁 (version 字段) 是更优解。
>
> **反模式 v4 防御**: version + 冲突检测 + 客户端 retry

---

## 8 大反模式

### 反模式 1: 无版本控制直接 update

```typescript
// ❌ 错误: 后写覆盖前写 (Lost Update)
async updateOrder(id, patch) {
  await db.order.update(id, patch)  // 谁后写谁赢
}

// ✅ 正确: 乐观锁 version 校验
async updateOrder(id, expectedVersion, patch) {
  const order = await db.order.get(id)
  if (order.version !== expectedVersion) {
    throw new ConflictException('version_conflict')
  }
  await db.order.update(id, { ...patch, version: order.version + 1 })
}
```

### 反模式 2: 客户端传 version 但服务端不校验

```typescript
// ❌ 错误: 信任客户端 version
async update(id, version, patch) {
  await db.update(id, { ...patch, version: version + 1 })  // 直接用, 不校验
}

// ✅ 正确: 服务端必须校验
async update(id, expectedVersion, patch) {
  const current = await db.get(id)
  if (current.version !== expectedVersion) {
    throw new ConflictException({
      error: 'version_conflict',
      current: current.version,
      provided: expectedVersion
    })
  }
}
```

### 反模式 3: 用时间戳作为 version

```typescript
// ❌ 错误: 时间戳精度不够 (毫秒也可能冲突)
const order = { updatedAt: Date.now() }

// ✅ 正确: 单调递增整数 (DB sequence / 计数器)
const order = { version: 1, updatedAt: '2026-06-28T...' }
// version 必须用原子计数器, 不能用时间戳
```

### 反模式 4: 冲突后不通知客户端重试

```typescript
// ❌ 错误: 抛错就完事, 客户端不知道该怎么做
throw new ConflictException('version_conflict')

// ✅ 正确: 返回足够信息让客户端决定 retry / merge
throw new ConflictException({
  error: 'version_conflict',
  current: 5,
  provided: 3,
  currentEntity: await db.get(id),  // 返回最新实体, 客户端可 merge
  retryable: true
})
```

### 反模式 5: 嵌套实体无独立 version

```typescript
// ❌ 错误: 父表有 version, 子表没有 (子表更新冲突无法检测)
const order = { version: 3, items: [{ id: 'i1', qty: 5 }] }

// ✅ 正确: 子表也独立 version
const order = { version: 3, items: [{ id: 'i1', qty: 5, version: 1 }] }
```

### 反模式 6: 批量更新无 version 校验

```typescript
// ❌ 错误: 批量更新跳过 version 检查
async bulkUpdate(ids, patch) {
  await db.bulkUpdate(ids, patch)  // 部分可能冲突
}

// ✅ 正确: 批量 update 也要带 version (每行独立)
async bulkUpdate(updates: Array<{ id, version, patch }>) {
  for (const u of updates) {
    await this.update(u.id, u.version, u.patch)  // 逐个校验
  }
}
```

### 反模式 7: 冲突后用 last-writer-wins 覆盖

```typescript
// ❌ 错误: 冲突时仍覆盖 (前写丢失)
async update(id, version, patch) {
  const current = await db.get(id)
  if (current.version !== version) {
    // 不抛错, 直接覆盖 ← 反模式!
    return db.update(id, patch)
  }
}

// ✅ 正确: 冲突必须抛错
if (current.version !== version) {
  throw new ConflictException('version_conflict')
}
```

### 反模式 8: 长事务占用 version

```typescript
// ❌ 错误: 事务开始就锁定 version, 长时间占用
async longProcess(id) {
  const order = await db.get(id)
  order.version++  // 立即占用
  await sleep(10000)  // 长事务
  await db.update(id, order)
}

// ✅ 正确: 仅在提交时增加 version
async longProcess(id) {
  const data = await compute()  // 不持锁
  // 最后才提交
  await db.update(id, { patch, version: currentVersion + 1 })
}
```

---

## 乐观锁实施清单 (8 项)

| # | 检查项 | 通过标准 |
|---|--------|----------|
| 1 | version 字段 | 每个可更新实体必有 version (整数, 单调递增) |
| 2 | 服务端校验 | 每次 update 都校验 version 一致性 |
| 3 | 原子递增 | 更新成功 version += 1 (DB 原子) |
| 4 | 冲突返回 | 冲突时返回 current + provided + retryable |
| 5 | 客户端 retry | 客户端收到 conflict 后自动 retry (3 次) |
| 6 | 子实体独立 | 嵌套子实体各自有 version |
| 7 | 时间戳分离 | version ≠ updatedAt, 各自独立 |
| 8 | 监控告警 | version_conflict 频繁时告警 (可能需要悲观锁) |

---

## 客户端 Retry 策略

```typescript
async function updateWithRetry(id, expectedVersion, patch, maxRetries = 3) {
  let currentVersion = expectedVersion
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await api.update(id, currentVersion, patch)
    } catch (err) {
      if (err.code !== 'version_conflict' || i === maxRetries - 1) throw err
      // 获取最新 version + 当前 entity, 重新合并 patch
      const latest = await api.getById(id)
      currentVersion = latest.version
      // 业务合并策略: 取最新值 + 用户改动 (应用层 merge)
      patch = mergePatch(latest, patch)
    }
  }
}
```

---

## 何时切换到悲观锁

乐观锁不适用场景 (需要悲观锁):

1. **冲突率 > 5%**: 频繁冲突导致 retry 多, 体验差
2. **库存扣减**: 秒杀场景, 1000 并发抢 100 库存, 乐观锁冲突率高
3. **金融交易**: 不允许 retry (重复扣款风险)
4. **分布式锁**: Redis Redlock / Zookeeper 临时节点

---

## DR-36 决策 3 落地

- 决策 3: 编辑用乐观锁 (version 字段)
- Phase-35 订单: `Order.version` (OrderService.updateWithVersion)
- Phase-37 库存: `InventoryItem.version` (InventoryService.update)
- Phase-46 真实 DB: Prisma `@version` 或手写 `WHERE version = ?`

---

> 🛡️ **反模式 v4 防御**: 乐观锁 = 性能 + 一致性 双赢。冲突抛错 + 客户端 retry 是标准模式, 不要因为"实现复杂"就退化到无版本控制。