# Anti-Pattern · Premature Optimization (过早优化)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🟢 P2
> 来源: Phase-15+ 性能优化教训

---

## 1. 🚨 反模式

在 **没有性能数据** 的情况下,提前优化:
- ❌ 缓存一切 (缓存命中率 < 10%)
- ❌ 微优化 (节省 1ms 但增加 50% 复杂度)
- ❌ 复杂算法 (没人看得懂)
- ❌ 提前分库分表 (单库 100 万行不到)

**Donald Knuth**: "过早优化是万恶之源"

---

## 2. ❌ 反例

```typescript
// ❌ 过早优化: 简单查询硬塞缓存 + 多级 + 异步
async getUserName(userId: string): Promise<string> {
  // 1. L1 cache (Map)
  if (this.l1Cache.has(userId)) return this.l1Cache.get(userId)
  // 2. L2 Redis
  const l2 = await this.redis.get(`user:${userId}:name`)
  if (l2) {
    this.l1Cache.set(userId, l2)
    return l2
  }
  // 3. L3 DB
  const user = await this.userRepo.findOne(userId)
  // 4. 异步写入 L1 + L2
  setImmediate(() => {
    this.l1Cache.set(userId, user.name)
    this.redis.setex(`user:${userId}:name`, 300, user.name)
  })
  return user.name
}
// 实际: DB 查询 1ms → 多级缓存后 0.5ms,但代码 30 行
// 用户场景: 1 QPS → 不需要缓存
```

---

## 3. ✅ 正确做法: 测量 → 优化 → 验证

```typescript
// ✅ 第 1 步: 简单实现
async getUserName(userId: string): Promise<string> {
  const user = await this.userRepo.findOne(userId)
  return user.name
}

// ✅ 第 2 步: 测量 P95
// 假设 P95 = 50ms (慢) → 找慢的原因 (DB? 网络?)

// ✅ 第 3 步: 加索引 / 优化 SQL
// CREATE INDEX idx_user_id ON users(id)  -- P95 = 5ms

// ✅ 第 4 步: 如果还是慢,加缓存
@CacheAside({ ttl: 300, keyPrefix: 'user:name' })
async getUserName(userId: string): Promise<string> {
  return this.userRepo.findOne(userId).then(u => u.name)
}
```

---

## 4. 📐 优化前 checklist

- [ ] 已有性能 baseline (P50 / P95 / P99)
- [ ] 慢的具体原因 (DB / CPU / 网络)
- [ ] 优化后预期收益 (P95 降低多少)
- [ ] 优化后复杂度评估 (LOC / 可维护性)
- [ ] 优化有可回滚方案

**不满足任意一项 → 暂不优化**。

---

## 5. ✅ 正确做法: 优化前先测量

```typescript
// 性能埋点
async getUserName(userId: string): Promise<string> {
  const start = Date.now()
  try {
    const user = await this.userRepo.findOne(userId)
    return user.name
  } finally {
    this.metrics.histogram('getUserName.duration_ms', Date.now() - start)
  }
}
```

---

## 6. 🔗 关联

- [performance-optimization.md](../best-practices/performance-optimization.md) · 性能规范
- [monitoring-observability.md](../best-practices/monitoring-observability.md) · 监控
