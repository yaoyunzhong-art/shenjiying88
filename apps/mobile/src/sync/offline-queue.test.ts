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
  it('AC-2 retry: failed ops scheduled for next attempt', async () => {
    // 设置总是失败
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
      maxAttempts: 1, // 只尝试一次就进 dead-letter
    });

    // 第一次 flush: 尝试失败后进 dead-letter
    const r1 = await failQueue.flush();
    expect(r1.failed).toBe(0);
    expect(r1.deadLettered).toBe(1);
    expect(failQueue.stats().failed).toBe(0);
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
});