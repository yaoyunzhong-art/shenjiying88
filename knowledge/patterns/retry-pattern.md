# Pattern · Retry with Exponential Backoff (指数退避重试)

> 创建: 2026-06-26 · Pulse-68 Day 2 大批量扩充
> 适用: 任何远程调用 (LLM / DB / HTTP / 第三方 API)
> 来源: knowledge/anti-patterns/synchronous-llm-call.md + Phase-19 ai-review

---

## 1. 🎯 问题

远程调用常因瞬时故障失败:
- ❌ 网络抖动 (TCP 重传)
- ❌ Provider 限流 (429)
- ❌ DB 临时不可用 (主从切换)
- ❌ LLM Provider 高峰

简单 `try { await } catch { throw }` 导致:
- 失败立即抛错,用户体验差
- 重试 = 雪崩 (1 个慢调用 × 1000 重试 × 60s = 全站挂)

---

## 2. ✅ 标准策略: 指数退避 + 抖动

```typescript
// apps/api/src/common/retry.ts
export interface RetryOptions {
  maxAttempts: number           // 总尝试次数 (含首次)
  initialDelayMs: number        // 首次延迟
  maxDelayMs: number            // 延迟上限
  backoffMultiplier: number     // 指数倍数 (默认 2)
  jitter: boolean               // 抖动 (避免雪崩)
  retryableErrors: Array<new (...args: any[]) => Error>  // 可重试错误类型
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [],  // 全部错误默认重试
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }

  let lastError: Error | undefined
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err as Error

      // 检查是否可重试
      if (opts.retryableErrors.length > 0) {
        const isRetryable = opts.retryableErrors.some(E => err instanceof E)
        if (!isRetryable) throw err
      }

      if (attempt >= opts.maxAttempts) throw err

      // 计算延迟
      const baseDelay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      )
      const delayMs = opts.jitter
        ? baseDelay * (0.5 + Math.random() * 0.5)  // 50-100% 抖动
        : baseDelay

      onRetry?.(attempt, lastError, delayMs)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }

  throw lastError!
}
```

---

## 3. 🎯 应用: LLM Provider

```typescript
const response = await retryWithBackoff(
  () => this.claudeProvider.generate(request),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10_000,
    jitter: true,
    retryableErrors: [LLMUnavailableError, NetworkError],
  },
  (attempt, err, delay) => {
    this.logger.warn(`[LLM] retry ${attempt}: ${err.message}, delay ${delay}ms`)
  }
)
```

---

## 4. 📊 不同场景配置表

| 场景 | maxAttempts | initialDelay | maxDelay | 说明 |
|---|---|---|---|---|
| LLM Provider | 3 | 1s | 10s | 容忍慢响应 |
| 数据库连接 | 5 | 100ms | 5s | 快速试探 |
| 支付 API | 2 | 500ms | 2s | 不容忍重复扣款 |
| 邮件发送 | 5 | 5s | 60s | 后台任务,容忍重试 |
| HTTP 同步请求 | 3 | 500ms | 5s | 用户体验 |

---

## 5. ❌ 反模式

- ❌ 固定延迟重试 (雪崩)
- ❌ 无上限重试 (永久 hang)
- ❌ 重试非可重试错误 (扣款两次)
- ❌ 无 jitter 同步重试 (雪崩)
- ❌ 在 Controller 同步重试 (用户等待)

---

## 6. 🔗 关联

- [circuit-breaker.md](./circuit-breaker.md) · 熔断器 (避免持续重试)
- [throttling-pattern.md](./throttling-pattern.md) · 限流
