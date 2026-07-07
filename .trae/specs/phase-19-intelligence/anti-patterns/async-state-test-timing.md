# Anti-pattern · 异步状态机测试时序

> 创建: 2026-06-26 (Phase-19 T27)
> 严重度: 🔴 高
> 关联: [lessons-learned/phase-19.md](../lessons-learned/phase-19.md) §痛点 1

## 现象

```typescript
// ❌ 反例 - 同步断言异步状态
it('auto-execute completes', async () => {
  const record = service.trigger(...);
  expect(record.status).toBe('PENDING'); // ❌ 已经是 SNAPSHOTTING
  await sleep(100);
  expect(service.getRecord(record.id).status).toBe('COMPLETED');
});
```

实际发生:
- trigger() 返回 record 时,异步执行已经开始
- 同步断言 PENDING 失败 (实际 SNAPSHOTTING)
- e2e 测试 flaky

## 根因

异步状态机的"中间状态"非常短暂 (10-50ms)。
同步断言试图捕捉这些状态是徒劳的。

## 解法 · 断言最终状态 + 合理等待

```typescript
// ✅ 正例 - 跳过中间状态,直接断言最终
it('auto-execute completes', async () => {
  const record = service.trigger(...);
  expect(record.id).toBeDefined(); // 仅断言 id 存在
  
  // 等待异步执行 (snapshot 10ms + rollback 20ms + verify 10ms + buffer)
  await new Promise(r => setTimeout(r, 150));
  
  const updated = service.getRecord(record.id);
  expect(updated?.status).toBe('COMPLETED');
  expect(updated?.history.length).toBeGreaterThanOrEqual(4);
});
```

## 根治 (Phase-20)

引入 `awaitFinalState(service, id, expectedStatus, timeoutMs)` helper:
```typescript
export async function awaitFinalState<T>(
  service: { getRecord: (id: string) => T | undefined },
  id: string,
  predicate: (record: T) => boolean,
  timeoutMs = 5000,
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const record = service.getRecord(id);
    if (record && predicate(record)) return record;
    await new Promise(r => setTimeout(r, 10));
  }
  throw new Error(`Timeout waiting for state after ${timeoutMs}ms`);
}
```

## 经验

> **异步状态机测试:跳过中间状态,断言最终状态。**
> **Phase-20 引入 awaitFinalState helper 标准化。**
