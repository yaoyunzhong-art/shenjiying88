# 反模式: AI Provider Fallback (多 Provider 降级)

> **T171 / Phase-41 / DR-41-A**
> 创建: 2026-06-28
> 适用: 所有 AI/LLM 集成 / 多 Provider 抽象 / 服务降级

## 概述

AI 服务调用面临 **5 大陷阱**:
1. 单点故障: 主 Provider 挂掉, 整个 AI 服务不可用
2. 限流崩溃: OpenAI 60 req/min 触发 429 后无降级
3. 余额耗尽: 账户欠费, API 返回 402
4. 网络超时: 跨境延迟 30s+, 用户体验崩塌
5. 隐私合规: 用户数据走错 Provider (违反 GDPR)

**多 Provider 抽象 + 自动降级是 SaaS AI 服务的护城河。**

---

## 5 个反模式 (Anti-Patterns)

### AP-1: 单 Provider, 无降级

**反模式 (❌)**
```typescript
async complete(messages: any[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages })
  })
  if (!res.ok) throw new Error('OpenAI failed')
  return (await res.json()).choices[0].message.content
}
```

**问题**:
- OpenAI 挂了 → AI 客服整个挂 (P0 故障)
- 跨境延迟 30s → 用户流失
- 限流 429 → 全站故障
- 单点依赖, 议价能力 0

**正解 (✅)**
```typescript
// Provider 抽象接口
interface AIProvider {
  readonly name: ProviderType
  readonly priority: number   // 越小优先级越高
  isAvailable(): Promise<boolean>
  complete(req: AIProviderRequest): Promise<AIProviderResponse>
}

// FallbackService: 自动降级
async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
  const errors = []
  for (const provider of this.providers.sort((a, b) => a.priority - b.priority)) {
    if (!await provider.isAvailable()) continue
    try {
      return await provider.complete(req)
    } catch (e) {
      errors.push({ provider: provider.name, error: e.message })
    }
  }
  throw new Error(`All providers failed: ${JSON.stringify(errors)}`)
}
```

---

### AP-2: 无 Provider 健康检查, 故障时仍调用

**反模式 (❌)**
```typescript
async complete(req: AIProviderRequest) {
  // ❌ 不检查 Provider 状态, 直接调用
  return await this.openai.complete(req)
}
```

**问题**:
- OpenAI 已挂, 调用返回 503
- 用户等待 5s 超时后才看到错误
- 全链路时间浪费在失败请求上

**正解 (✅)**
```typescript
async isAvailable(): Promise<boolean> {
  // 检查限流
  if (this.requestCount >= this.RATE_LIMIT) return false
  // 检查健康状态
  if (!this.healthy) return false
  // 检查余额 (生产环境)
  // const balance = await this.checkBalance()
  // if (balance < 100) return false
  return true
}

// FallbackService 调用前先验证
if (!await provider.isAvailable()) {
  errors.push({ provider: provider.name, error: 'not available' })
  continue
}
```

---

### AP-3: 无超时控制, 请求挂死

**反模式 (❌)**
```typescript
// ❌ 默认 fetch 无超时 (浏览器 ~5min, Node ~10min)
const res = await fetch('https://api.openai.com/v1/chat/completions', {...})
```

**问题**:
- OpenAI 海外延迟高峰 30s+
- 单个请求拖垮整个服务器
- 用户看到白屏, 无法转人工

**正解 (✅)**
```typescript
async function tryWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    fn().then(
      v => { clearTimeout(timer); resolve(v) },
      e => { clearTimeout(timer); reject(e) }
    )
  })
}

// 5s 超时
const result = await this.tryWithTimeout(() => provider.complete(req), 5000)
```

---

### AP-4: 限流硬编码, 不区分 Provider

**反模式 (❌)**
```typescript
// ❌ 所有 Provider 用同一个限流
const RATE_LIMIT = 60
if (this.requestCount >= RATE_LIMIT) throw new Error('Rate limited')
```

**问题**:
- OpenAI 60/min, DeepSeek 100/min, 不应统一
- 不区分窗口期, 滑动窗口才公平

**正解 (✅)**
```typescript
class OpenAIProvider {
  private readonly RATE_LIMIT = 60  // OpenAI 实际限制
  private readonly WINDOW_MS = 60_000
}

class DeepSeekProvider {
  private readonly RATE_LIMIT = 100  // DeepSeek 更宽松
  private readonly WINDOW_MS = 60_000
}

// 滑动窗口
async isAvailable(): Promise<boolean> {
  if (Date.now() - this.windowStart > this.WINDOW_MS) {
    this.requestCount = 0
    this.windowStart = Date.now()
  }
  return this.requestCount < this.RATE_LIMIT
}
```

---

### AP-5: 无重试机制, 偶发故障直接失败

**反模式 (❌)**
```typescript
// ❌ 单次失败立即抛错
try {
  return await provider.complete(req)
} catch (e) {
  throw e  // 没有重试
}
```

**问题**:
- OpenAI 偶发 503/504, 是其 SLA 的一部分
- 单次失败转人工, 用户体验差
- 真实可用率 < 99.5%

**正解 (✅)**
```typescript
async complete(req: AIProviderRequest): Promise<AIProviderResponse> {
  const MAX_RETRIES = 2
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await provider.complete(req)
    } catch (e) {
      if (attempt === MAX_RETRIES - 1) throw e  // 最后一次才降级
      await this.sleep(attempt * 500)  // 指数退避
    }
  }
}
```

---

## 检查清单 (Checklist)

| # | 反模式 | 检测方法 | 通过标准 |
|---|--------|---------|---------|
| 1 | 单 Provider | 配置文件检查多 provider | 至少 2 个 Provider (主+备) |
| 2 | 无健康检查 | 测试 provider 故障 | 立即降级到备用 |
| 3 | 无超时 | 测试慢响应 | 5s 后超时 + 降级 |
| 4 | 限流硬编码 | 代码审查 | 每 Provider 独立限流配置 |
| 5 | 无重试 | 测试偶发 503 | 至少 2 次重试后降级 |

---

## 推荐 Provider 矩阵

| Provider | 优先级 | 限流 (req/min) | 超时 (ms) | 适用场景 |
|----------|:------:|:--------------:|:---------:|---------|
| OpenAI | 1 | 60 | 5000 | 海外 + 高质量 |
| DeepSeek | 2 | 100 | 5000 | 国内 + 降本 |
| Claude | 3 | 50 | 8000 | 长文本 |
| 讯飞星火 | 4 | 200 | 3000 | 国内政企 |
| Mock | 99 | ∞ | 100 | 测试 + 兜底 |

---

## 健康度指标

| 指标 | 健康阈值 | 计算方式 |
|------|---------|---------|
| Provider 可用率 | > 99.5% | successful / total |
| 平均响应时间 | < 2s | p95 latency |
| 降级率 | < 10% | fallback_count / total |
| 超时率 | < 1% | timeout_count / total |

---

## 相关反模式

- **prompt-injection-pattern** — Prompt 注入 (T171)
- **circuit-breaker-pattern** — 熔断器 (后续 phase)
- **graceful-degradation-pattern** — 优雅降级 (P2.5)
- **multi-provider-observability** — 多 Provider 可观测性

---

## 实战案例 (T171 DR-41-A 决策链)

| 决策 | 触发条件 | 行动 |
|------|---------|------|
| DR-41-A.1 | OpenAI 不可用 (健康检查失败) | 切换到 DeepSeek |
| DR-41-A.2 | OpenAI 限流触发 | 切换到 DeepSeek |
| DR-41-A.3 | DeepSeek 也挂 | Mock 兜底 (置信度 0.6) |
| DR-41-A.4 | 置信度 < 0.7 | 触发人工接管 |

---

**反模式库版本**: v4 (33 文件) · +1 (ai-provider-fallback-pattern)
**累计反模式**: 32 → **33**