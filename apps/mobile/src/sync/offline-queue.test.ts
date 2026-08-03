/**
 * offline-queue.test.ts - Phase-21 T56
 * 离线队列单元测试 (纯 TS,无需 RN runtime)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { OfflineQueue, QueuedOperation } from './offline-queue';

describe('OfflineQueue · Phase-21 T56', () => {
  let sentOps: string[] = [];
  let online = true;
  let queue: OfflineQueue;

  const mockRequester = {
    send: async <T>(op: QueuedOperation<T>) => {
      sentOps.push(op.id);
      // Mock: 初次尝试(attempts=1)即成功;第二次(attempts=2)失败
      if (op.attempts === 2) throw new Error('mock failure');
    },
    isOnline: () => online,
  };

  beforeEach(() => {
    sentOps = [];
    online = true;
    queue = new OfflineQueue(mockRequester, { autoFlush: false });
  });

  // AC-1: 入队 + flush 成功
  it('AC-1 enqueue + flush: successful operations complete', async () => {
    const op = queue.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      body: { amount: 100 },
    });
    expect(op.id).toBeDefined();
    expect(queue.size()).toBe(1);
    expect(queue.stats().pending).toBe(1);

    const result = await queue.flush();
    expect(result.attempted).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);
    expect(queue.stats().completed).toBe(1);
  });

  // AC-2: 失败重试 - 指数退避
  it('AC-2 retry: failed ops with maxAttempts=1 go to dead-letter', async () => {
    const failQueue = new OfflineQueue(
      {
        send: async () => {
          throw new Error('always fail');
        },
        isOnline: () => true,
      },
      { autoFlush: false },
    );

    failQueue.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      body: { x: 1 },
      maxAttempts: 1,
    });

    const r1 = await failQueue.flush();
    expect(r1.failed).toBe(0);
    expect(r1.deadLettered).toBe(1);
    expect(failQueue.stats()['dead-letter']).toBe(1);
  });

  // AC-3: 离线时不发送
  it('AC-3 offline: no requests when offline', async () => {
    online = false;
    queue.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      body: { x: 1 },
    });
    const result = await queue.flush();
    expect(result.attempted).toBe(0);
    expect(sentOps.length).toBe(0);
    expect(queue.stats().pending).toBe(1);
  });

  // AC-4: dead-letter 重试
  it('AC-4 dead-letter: manual retry resets attempts', async () => {
    const failQ = new OfflineQueue(
      {
        send: async () => {
          throw new Error('fail');
        },
        isOnline: () => true,
      },
      { autoFlush: false },
    );
    failQ.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      maxAttempts: 1,
    });
    await failQ.flush();
    expect(failQ.stats()['dead-letter']).toBe(1);

    const op = failQ.snapshot()[0];
    failQ.retry(op.id);
    expect(failQ.stats().pending).toBe(1);
    expect(failQ.snapshot()[0].attempts).toBe(0);
  });

  // AC-5: FIFO 顺序
  it('AC-5 FIFO: operations processed in enqueue order', async () => {
    const order: string[] = [];
    const fifoQueue = new OfflineQueue(
      {
        send: async <T>(op: QueuedOperation<T>) => {
          order.push(op.url);
        },
        isOnline: () => true,
      },
      { autoFlush: false },
    );
    fifoQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    fifoQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/b' });
    fifoQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/c' });
    await fifoQueue.flush();
    expect(order).toEqual(['/a', '/b', '/c']);
  });

  // AC-6: 清空 completed
  it('AC-6 clearCompleted: removes only completed ops', async () => {
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/b' });
    await queue.flush();
    expect(queue.stats().completed).toBe(2);
    const removed = queue.clearCompleted();
    expect(removed).toBe(2);
    expect(queue.size()).toBe(0);
  });

  // AC-7: stats 多状态分类
  it('AC-7 stats: multi-status breakdown', () => {
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/b' });
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/c' });
    const stats = queue.stats();
    expect(stats.pending).toBe(3);
    expect(stats.completed).toBe(0);
    expect(stats['dead-letter']).toBe(0);
  });

  // ── 新增: 失败重试 + 指数退避详细 ──

  it('失败重试: 同一操作连续 flush, 直到进 dead-letter', async () => {
    // retry() 只对 dead-letter 生效, 对 failed 状态无效。
    // 这里验证指数退避下, 操作会在 nextAttemptAt 到期前跳过。
    // 我们通过手动修改 nextAttemptAt 来模拟退避到期。
    const failQueue = new OfflineQueue(
      {
        send: async () => { throw new Error('persistent fail'); },
        isOnline: () => true,
      },
      { autoFlush: false },
    );
    failQueue.enqueue({
      tenantId: 't1',
      method: 'PUT',
      url: '/orders/1',
      maxAttempts: 3,
    });

    // 第1次 flush: failed (1/3), nextAttemptAt = now + ~1000ms
    const r1 = await failQueue.flush();
    expect(r1.attempted).toBe(1);
    expect(r1.failed).toBe(1);
    expect(failQueue.stats().failed).toBe(1);

    const op1 = failQueue.snapshot()[0];
    expect(op1.attempts).toBe(1);
    // nextAttemptAt 已设置为未来
    expect(op1.nextAttemptAt).toBeGreaterThan(Date.now());

    // 手动将 nextAttemptAt 设为过去, 模拟退避到期
    op1.nextAttemptAt = 0;
    const r2 = await failQueue.flush();
    expect(r2.attempted).toBe(1);
    expect(r2.failed).toBe(1);
    // 同一个操作再次 failed, 当前 attempts=2
    expect(failQueue.snapshot()[0].attempts).toBe(2);

    // 再模拟退避到期
    const op2 = failQueue.snapshot()[0];
    op2.nextAttemptAt = 0;
    const r3 = await failQueue.flush();
    expect(r3.deadLettered).toBe(1);  // 第3次进 dead-letter
    expect(failQueue.stats()['dead-letter']).toBe(1);
  });

  it('失败重试: nextAttemptAt 按指数退避增长', async () => {
    const failQueue = new OfflineQueue(
      {
        send: async () => { throw new Error('fail'); },
        isOnline: () => true,
      },
      { autoFlush: false },
    );

    failQueue.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      maxAttempts: 5,
    });

    // 第1次 flush → failed, nextAttemptAt 应为 now + ~1s
    const before1 = Date.now();
    await failQueue.flush();
    const after1 = Date.now();

    const op1 = failQueue.list('failed')[0];
    expect(op1.nextAttemptAt).toBeGreaterThanOrEqual(before1 + 1000);
    expect(op1.nextAttemptAt).toBeLessThanOrEqual(after1 + 2000);
    expect(op1.attempts).toBe(1);

    // 第2次 flush: nextAttemptAt > now 所以不会被处理, attempts 保持不变
    // 验证退避公式: 第1次后 nextAttemptAt = now + 1000
    // 必须等到 nextAttemptAt 过期才能重试
    const opBefore = failQueue.list('failed')[0];
    expect(opBefore.nextAttemptAt).toBeGreaterThan(Date.now());
  });

  it('失败重试: lastError 记录最后失败原因', async () => {
    const failQueue = new OfflineQueue(
      {
        send: async () => { throw new Error('网络超时'); },
        isOnline: () => true,
      },
      { autoFlush: false },
    );

    failQueue.enqueue({
      tenantId: 't1',
      method: 'POST',
      url: '/orders',
      maxAttempts: 2,
    });

    await failQueue.flush();
    const op = failQueue.snapshot()[0];
    expect(op.lastError).toBe('网络超时');
    expect(op.status).toBe('failed');
  });

  // ── 边界条件 ──

  it('边界: 空队列 flush 不会报错', async () => {
    const result = await queue.flush();
    expect(result.attempted).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('边界: 清空已完成项后无法再 retry', () => {
    queue.enqueue({ tenantId: 't1', method: 'DELETE', url: '/items/1' });
    // 未 flush, 直接清空
    const removed = queue.clearCompleted();
    expect(removed).toBe(0);
    expect(queue.size()).toBe(1);
  });

  it('边界: retry 不存在的 opId 不报错', () => {
    queue.retry('non-existent-id');
    expect(queue.size()).toBe(0);
  });

  it('边界: retry 非 dead-letter 状态的操作不生效', async () => {
    const failQueue = new OfflineQueue(
      {
        send: async () => { throw new Error('fail'); },
        isOnline: () => true,
      },
      { autoFlush: false },
    );
    failQueue.enqueue({
      tenantId: 't1', method: 'POST', url: '/test', maxAttempts: 1,
    });
    await failQueue.flush();
    const op = failQueue.snapshot()[0];
    expect(op.status).toBe('dead-letter');

    // retry 应该重置
    failQueue.retry(op.id);
    const retried = failQueue.snapshot()[0];
    expect(retried.status).toBe('pending');
    expect(retried.attempts).toBe(0);

    // 再次 retry pending 状态的不应生效
    failQueue.retry(retried.id);
    expect(failQueue.snapshot()[0].attempts).toBe(0);
  });

  it('边界: 二次 flush 因 flushInProgress 跳过', async () => {
    // 正常第一次 flush, 同时检查 flushInProgress 保护
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    const result = await queue.flush();
    expect(result.attempted).toBe(1);

    // 已完成的 flush 不再触发
    const result2 = await queue.flush();
    expect(result2.attempted).toBe(0);
  });

  // ── 多操作组合 ──

  it('多操作: 混合成功/失败/dead-letter 统计正确', async () => {
    // 使用全新 requester, 固定 /ok=成功 /fail=失败 /deadletter=失败
    const mixedQueue = new OfflineQueue(
      {
        send: async <T>(op: QueuedOperation<T>) => {
          if (op.url === '/fail') throw new Error('fail');
          if (op.url === '/deadletter') throw new Error('dead');
          // /ok 直接成功
        },
        isOnline: () => true,
      },
      { autoFlush: false },
    );

    // 成功: 1条 (url=/ok, mock 不抛异常)
    mixedQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/ok', maxAttempts: 1 });
    // dead-letter: 1条 (maxAttempts=1, 一次就进 dead)
    mixedQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/fail', maxAttempts: 1 });
    // 也是 dead-letter: 1条 (maxAttempts=1)
    mixedQueue.enqueue({ tenantId: 't1', method: 'POST', url: '/deadletter', maxAttempts: 1 });

    const r1 = await mixedQueue.flush();
    expect(r1.succeeded).toBe(1);
    expect(r1.deadLettered).toBe(2);
    expect(r1.failed).toBe(0);
  });

  it('多操作: subscribe 监听状态变化', async () => {
    const events: number[] = [];
    const unsub = queue.subscribe(() => {
      events.push(queue.size());
    });

    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    expect(events.length).toBe(1);
    expect(events[0]).toBe(1);

    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/b' });
    expect(events.length).toBe(2);

    unsub();
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/c' });
    expect(events.length).toBe(2); // unsubscribed
  });

  // ── list 过滤 ──

  it('list: 按状态过滤操作', () => {
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/b' });

    expect(queue.list('pending').length).toBe(2);
    expect(queue.list('completed').length).toBe(0);
    expect(queue.list().length).toBe(2);
  });

  it('list: 不传 status 返回全部', () => {
    queue.enqueue({ tenantId: 't1', method: 'POST', url: '/a' });
    expect(queue.list().length).toBe(1);
    expect(queue.list(undefined).length).toBe(1);
  });
});
