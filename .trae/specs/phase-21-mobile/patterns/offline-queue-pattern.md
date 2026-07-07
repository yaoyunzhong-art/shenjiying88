# Pattern · 离线写入队列 (Offline Queue)

## 场景
移动端网络不稳定,需要离线写入排队 + 在线自动 flush + 失败重试。

## 实现
```typescript
export class OfflineQueue {
  private readonly queue: QueuedOperation[] = [];
  private flushInProgress = false;

  enqueue<TBody>(input: { endpoint: string; method: string; body?: TBody; idempotencyKey: string }): QueuedOperation<TBody> {
    const op: QueuedOperation<TBody> = {
      id: uuidv4(),
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.queue.push(op);
    if (navigator.onLine) this.flush();
    return op;
  }

  async flush(): Promise<FlushResult> {
    if (this.flushInProgress) return { flushed: 0, failed: 0 };
    this.flushInProgress = true;
    let flushed = 0, failed = 0;
    for (const op of this.queue.filter((o) => o.status === 'pending')) {
      op.status = 'in-flight';
      try {
        await this.execute(op);
        op.status = 'completed';
        flushed++;
      } catch (e) {
        op.attempts++;
        op.status = op.attempts >= 5 ? 'dead-letter' : 'failed';
        if (op.status === 'failed') {
          await sleep(Math.min(2 ** op.attempts * 1000, 30000)); // 指数退避
        } else {
          failed++;
        }
      }
    }
    this.flushInProgress = false;
    return { flushed, failed };
  }
}
```

## 关键点
- **idempotencyKey**: 服务端幂等保证,避免重复扣款
- **指数退避**: 1s→2s→4s→...→30s 上限
- **dead-letter**: 5 次失败入死信,手动 review
- **FIFO 顺序**: 队列按 enqueue 顺序处理,保证因果一致

## 适用
- 移动端写操作 (订单创建、表单提交)
- 表单暂存 (用户半填状态)
- 离线消息发送 (聊天、通知)
