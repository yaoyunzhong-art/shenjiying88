# Anti-Pattern v4 · residual-pending-state (订单/任务残留 PENDING 状态)

> 创建日期: 2026-06-27
> 来源: Phase-35 收银订单状态机 + Pulse-Nightly-03 debt P0-001 教训
> 危害等级: 🟠 高 (业务脏数据 + 财务对账失败)
> 关联: R-04 7 维度复盘 + R-06 反模式库 v4

---

## 错误表现

订单/任务在以下场景留下 PENDING 状态,永远不流转:

```typescript
// ❌ 场景 1: 支付回调未到达
const order = await createOrder({ status: 'PENDING', amount: 100 });
await charge(order); // 假设第三方支付异步,本地立刻返回 PENDING
// 30 分钟后回调未到 → order.status = 'PENDING' 残留
// 财务对账时: 100 元在哪?

// ❌ 场景 2: 异常分支未流转
async function processTask(task: Task) {
  if (task.type === 'A') {
    return await processA(task); // ✅ PAID/COMPLETED
  }
  // ❌ 漏掉 else 分支,task.status 保持 PENDING
}

// ❌ 场景 3: 定时任务崩溃
cron.schedule('0 0 * * *', async () => {
  await reconcileOrders(); // 中途抛错 → 部分订单卡 PENDING
});
```

## 为什么错

1. **状态机不闭合**: PENDING 没有出口条件
2. **超时未处理**: 支付/任务有 timeout,但 PENDING 不会变 TIMEOUT
3. **异常吞错**: catch 后没回滚状态
4. **缺乏清理任务**: 没有 daily cleanup 把 PENDING 超时转 CANCELLED

## 正确做法 1: 状态机严格闭合

```typescript
type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'TIMEOUT' | 'REFUNDED';

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'CANCELLED', 'TIMEOUT'],
    PAID: ['REFUNDED'],
    CANCELLED: [],
    TIMEOUT: [],
    REFUNDED: []
  };
  return allowed[from].includes(to);
}

// ❌ 漏掉 PENDING → TIMEOUT 转移 → 状态机不闭合
// ✅ 加上后,PENDING 订单在 30min 超时自动转 TIMEOUT
```

## 正确做法 2: 超时清理 cron

```typescript
// scripts/cleanup-pending-orders.ts (每日 02:00)
cron.schedule('0 2 * * *', async () => {
  const stuck = await db.orders.find({
    status: 'PENDING',
    createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // 30 分钟前
  });

  for (const order of stuck) {
    await db.orders.update(order.id, { status: 'TIMEOUT', timeoutAt: new Date() });
    logger.warn({ event: 'order_timeout', orderId: order.id });
  }
});
```

## 正确做法 3: 异常回滚状态

```typescript
async function processTask(task: Task) {
  try {
    if (task.type === 'A') return await processA(task);
    if (task.type === 'B') return await processB(task);
    throw new Error(`Unknown task type: ${task.type}`);
  } catch (e) {
    // ✅ 显式回滚状态
    await db.tasks.update(task.id, { status: 'FAILED', error: e.message });
    throw e;
  }
}
```

## 测试要点 (R-02 Layer 1)

```typescript
// E2E: 验证所有 PENDING 都有出口
test('all PENDING orders have exit condition', async () => {
  const pending = await db.orders.find({ status: 'PENDING' });
  for (const o of pending) {
    const age = Date.now() - new Date(o.createdAt).getTime();
    expect(age).toBeLessThan(30 * 60 * 1000); // 不能超过 30 分钟
  }
});
```

## 监控指标 (R-07 KPI)

- **PENDING 订单数**: 应 < 5 (实时)
- **PENDING 超时率**: 应 < 0.1% (日清)
- **状态机闭合度**: 100% (无孤立节点)

## 关联债务

- debt P0-001: @m5/api app-journey timeout → 订单可能卡 PENDING
- debt EF-003: Phase-35 收银状态机待补 TIMEOUT 转换

## 关联专家

- E10 郑财务 · E13 李收银 · E11 钱店长 · E18 刘总助

## 关联文档

- [best-practices/error-handling.md](../best-practices/error-handling.md)
- [patterns/saga-pattern.md](../patterns/saga-pattern.md)