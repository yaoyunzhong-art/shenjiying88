# Anti-Pattern v4 · async-try-catch-pattern (async 函数中 try-catch 误用)

> 创建日期: 2026-06-27
> 来源: Phase-33 EventStore 异步持久化 + Phase-35 收银异步流程
> 危害等级: 🟡 中 (静默吞错 + 性能下降)
> 关联: R-02 三层测试 + R-04 测试维度

---

## 错误表现 1: 包裹整个 async 函数

```typescript
// ❌ 错误: 整个函数包 try-catch,反而吞掉真实错误
async function processOrder(order: Order) {
  try {
    const validated = await validate(order);
    const paid = await charge(validated);
    const saved = await save(paid);
    return saved;
  } catch (e) {
    console.error('processOrder failed:', e); // ❌ 吞掉,业务不知道
    return null; // ❌ 调用方拿到 null,不知道是哪种错
  }
}
```

## 错误表现 2: await 后没有 catch

```typescript
// ❌ 错误: await 后未处理 reject
async function syncToCloud(data: Data) {
  await cloud.upload(data); // ❌ reject 直接抛到上层,无 context
  await metrics.record('sync'); // ❌ 上一步挂了这步不跑
}
```

## 为什么错

1. **静默吞错**: 调用方不知道失败原因,难以排查
2. **丢失上下文**: `console.error` 没 stack trace
3. **无法监控**: 错误没回流到告警系统
4. **无法重试**: 业务层拿不到 retry 信号

## 正确做法 1: 局部 try-catch + 错误传播

```typescript
async function processOrder(order: Order) {
  const validated = await validate(order); // 上抛
  try {
    const paid = await charge(validated);
    return await save(paid);
  } catch (e) {
    // 只捕获预期错误 (支付/持久化失败)
    logger.error({ event: 'process_order_fail', orderId: order.id, err: e });
    throw new OrderProcessingError('支付或持久化失败', { cause: e });
  }
}
```

## 正确做法 2: Result 类型 (Rust 风格)

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function processOrder(order: Order): Promise<Result<Order, OrderError>> {
  try {
    const validated = await validate(order);
    const paid = await charge(validated);
    const saved = await save(paid);
    return { ok: true, value: saved };
  } catch (e) {
    return { ok: false, error: new OrderError(e) };
  }
}

// 调用方:
const result = await processOrder(order);
if (!result.ok) {
  // 明确处理错误
  return retryQueue.push(order, result.error);
}
```

## 正确做法 3: Promise.allSettled 替代 Promise.all

```typescript
// ❌ 错误: 一个失败全部中断
const results = await Promise.all([fetchA(), fetchB(), fetchC()]);

// ✅ 正确: 全部完成,失败单独处理
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
for (const r of results) {
  if (r.status === 'rejected') {
    logger.warn({ event: 'fetch_fail', reason: r.reason });
  }
}
```

## 测试要点 (R-02 三层测试)

- **Layer 1 (程序员)**: 单元测试覆盖 happy path + 1 错误路径
- **Layer 2 (产品)**: 集成测试覆盖 3 错误路径 (支付失败/持久化失败/网络超时)
- **Layer 3 (使用者)**: 走查真实场景 (订单提交后断网)

## 关联专家

- E1 陈架构 · E9 吴AI · E10 郑财务

## 关联文档

- [best-practices/error-handling.md](../best-practices/error-handling.md) — 错误处理规范
- [patterns/saga-pattern.md](../patterns/saga-pattern.md) — 分布式事务