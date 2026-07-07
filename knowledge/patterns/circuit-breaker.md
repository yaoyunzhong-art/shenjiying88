# Pattern · Circuit Breaker (熔断器模式)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 适用: LLM Provider 调用 / 外部 API / 数据库连接 / 任何远程依赖
> 来源: Phase-19 ai-review (Claude/OpenAI fallback) + Phase-15e quota guard

---

## 1. 🎯 问题

远程依赖(LLM Provider / 第三方 API / 数据库)在故障时:
- ❌ 单次失败 → 持续重试 → 雪崩
- ❌ 同步等待超时 → 用户体验差
- ❌ 没有自动恢复 → 需人工介入

熔断器模式提供 3 状态自动切换:
- **CLOSED**:正常调用
- **OPEN**:短路返回 (避免雪崩)
- **HALF_OPEN**:试探恢复

---

## 2. 🏗️ 3 状态机

```
       success (连续 N 次)
   ┌──────────────────────────────────┐
   ↓                                  │
[CLOSED] ── failure (≥ threshold) ─→ [OPEN]
   ↑                                  │
   │ success                          │ timeout (≥ cooldown)
   │                                  ↓
   └──── [HALF_OPEN] ── failure ──────┘
                  ↓ success
                  └──→ CLOSED
```

**状态说明**:
| 状态 | 行为 | 触发条件 |
|---|---|---|
| CLOSED | 正常调用 + 计数失败 | 初始状态 |
| OPEN | 立即抛 CircuitBreakerError,不调用 | 失败 ≥ 阈值 (默认 5) |
| HALF_OPEN | 限制 1 个试探请求 | cooldown 到期 (默认 60s) |

---

## 3. 📐 实现

```typescript
// apps/api/src/common/circuit-breaker.ts
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  /** 失败阈值 (CLOSED → OPEN) */
  failureThreshold: number
  /** Cooldown 时长 (OPEN → HALF_OPEN) */
  cooldownMs: number
  /** HALF_OPEN 成功阈值 (HALF_OPEN → CLOSED) */
  halfOpenSuccessThreshold: number
  /** 超时 (单次调用) */
  timeoutMs: number
  /** 名称 (用于日志) */
  name: string
}

export const DEFAULT_CB_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  cooldownMs: 60_000,
  halfOpenSuccessThreshold: 2,
  timeoutMs: 30_000,
  name: 'default',
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly name: string, public readonly openedAt: Date) {
    super(`Circuit breaker '${name}' is OPEN since ${openedAt.toISOString()}`)
    this.name = 'CircuitBreakerOpenError'
  }
}

@Injectable()
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failureCount = 0
  private successCountInHalfOpen = 0
  private openedAt: Date | null = null
  private readonly logger = new Logger(CircuitBreaker.name)

  constructor(private readonly options: CircuitBreakerOptions = DEFAULT_CB_OPTIONS) {}

  /**
   * 执行受保护的调用
   *
   * @throws CircuitBreakerOpenError 熔断器 OPEN 时
   * @throws Error 调用失败 + 计数 +1
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 1. 检查状态 + 状态转换
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.transitionTo('HALF_OPEN')
        // 继续执行 (试探)
      } else {
        throw new CircuitBreakerOpenError(this.options.name, this.openedAt!)
      }
    }

    // 2. 执行 + 超时
    try {
      const result = await this.callWithTimeout(fn, this.options.timeoutMs)
      this.recordSuccess()
      return result
    } catch (err) {
      this.recordFailure()
      throw err
    }
  }

  private async callWithTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
      fn().then(
        (r) => { clearTimeout(timer); resolve(r) },
        (e) => { clearTimeout(timer); reject(e) }
      )
    })
  }

  private recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCountInHalfOpen++
      if (this.successCountInHalfOpen >= this.options.halfOpenSuccessThreshold) {
        this.transitionTo('CLOSED')
      }
    }
    // CLOSED 状态: 重置失败计数
    this.failureCount = 0
  }

  private recordFailure(): void {
    this.failureCount++
    if (this.state === 'HALF_OPEN') {
      // HALF_OPEN 试探失败 → 立即回 OPEN
      this.transitionTo('OPEN')
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.transitionTo('OPEN')
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return false
    return Date.now() - this.openedAt.getTime() >= this.options.cooldownMs
  }

  private transitionTo(next: CircuitState): void {
    const prev = this.state
    this.state = next
    if (next === 'OPEN') {
      this.openedAt = new Date()
    } else if (next === 'CLOSED') {
      this.failureCount = 0
      this.successCountInHalfOpen = 0
      this.openedAt = null
    } else if (next === 'HALF_OPEN') {
      this.successCountInHalfOpen = 0
    }
    this.logger.warn(`[CB:${this.options.name}] ${prev} → ${next}`)
  }

  getState(): CircuitState {
    return this.state
  }
}
```

---

## 4. 🎯 在 LLM Provider 中的应用

```typescript
// apps/api/src/modules/ai-review/llm/llm.circuit-breaker.ts
@Injectable()
export class ClaudeCircuitBreaker extends CircuitBreaker {
  constructor() {
    super({
      name: 'claude',
      failureThreshold: 3,    // 3 次失败即熔断
      cooldownMs: 30_000,    // 30s 后试探
      halfOpenSuccessThreshold: 1,
      timeoutMs: 60_000,     // Claude 单次最长 60s
    })
  }
}

// 在 ClaudeProvider 中使用
@Injectable()
export class ClaudeProvider implements ILLMProvider {
  constructor(
    private readonly cb: ClaudeCircuitBreaker,
    @Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>
  ) {}

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.cb.execute(async () => {
      // 真实 SDK 调用
      const client = new Anthropic({ apiKey: this.cfg.claude.apiKey })
      return await client.messages.create({...})
    })
  }
}

// 在 LLMProviderFactory 中
@Injectable()
export class LLMProviderFactory {
  async getAvailable(chain: LlmProvider[]): Promise<ILLMProvider> {
    for (const name of chain) {
      const provider = this.providers.get(name)
      if (!provider) continue

      // 检查熔断器状态
      const cb = this.circuitBreakers.get(name)
      if (cb && cb.getState() === 'OPEN') {
        this.logger.warn(`[LLM] skip ${name} (circuit OPEN)`)
        continue
      }

      try {
        return provider
      } catch {
        continue
      }
    }
    throw new LLMUnavailableError(chain[0] ?? 'claude', 'all providers unavailable')
  }
}
```

---

## 5. ✅ 适用场景

- ✅ **LLM Provider 调用**:Claude 故障 → 自动切换 OpenAI
- ✅ **第三方 API**:支付 / 短信 / 邮件服务故障
- ✅ **数据库连接**:主库故障 → 降级读从库
- ✅ **远程服务**:微服务间调用
- ✅ **缓存查询**:Redis 故障 → 直连 DB (有降级)

**不适用场景**:
- ❌ 本地内存操作 (无远程依赖)
- ❌ 用户态同步逻辑 (无 I/O)
- ❌ 一次性脚本 (无持续状态)

---

## 6. 📊 配置调优

| 场景 | failureThreshold | cooldownMs | timeoutMs | 说明 |
|---|---|---|---|---|
| LLM Provider (慢) | 3 | 60s | 60s | 容忍偶发超时 |
| 数据库连接 | 5 | 30s | 5s | 快速失败 + 频繁试探 |
| 支付 API (关键) | 10 | 300s | 10s | 高容忍 (避免误熔断) |
| 短信发送 (非关键) | 3 | 60s | 5s | 快速失败 |

---

## 7. 📈 可观测性

```typescript
// 必须监控的指标
metrics.gauge('circuit_breaker.state', { name: cb.options.name, state: cb.getState() })
metrics.counter('circuit_breaker.failures', { name: cb.options.name })
metrics.counter('circuit_breaker.short_circuits', { name: cb.options.name })
metrics.histogram('circuit_breaker.recovery_time_ms', { name: cb.options.name })
```

**告警规则**:
- 熔断器 OPEN > 5min → P2 告警
- 熔断器频繁 (1h 内 ≥3 次) → P1 告警
- 熔断器恢复后立即再 OPEN → P0 告警 (下游持续故障)

---

## 8. 🧪 测试策略

```typescript
// 单元测试: 状态机
describe('CircuitBreaker', () => {
  it('CLOSED → OPEN after threshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, ... })
    const failing = () => Promise.reject(new Error('fail'))

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(failing)).rejects.toThrow()
    }
    expect(cb.getState()).toBe('OPEN')
  })

  it('OPEN → HALF_OPEN after cooldown', async () => {
    // ... 等待 cooldown ...
    expect(cb.getState()).toBe('HALF_OPEN')
  })

  it('HALF_OPEN → CLOSED after success threshold', async () => {
    // ... 多次成功调用 ...
    expect(cb.getState()).toBe('CLOSED')
  })

  it('HALF_OPEN → OPEN on any failure', async () => {
    // ... 试探调用失败 ...
    expect(cb.getState()).toBe('OPEN')
  })
})
```

---

## 9. 🔗 关联文档

- [knowledge/patterns/event-driven-architecture.md](./event-driven-architecture.md) · 事件驱动 (Retry 用)
- [knowledge/best-practices/llm-integration.md](../best-practices/llm-integration.md) · LLM 集成
- [knowledge/anti-patterns/synchronous-llm-call.md](../anti-patterns/synchronous-llm-call.md) · 反模式
- [apps/api/src/modules/ai-review/](../../apps/api/src/modules/ai-review/) · 实现

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 强制: 所有远程依赖必须经过 CircuitBreaker (Phase-19 起强制)
> 评审: Champion (待 R8 通过)
