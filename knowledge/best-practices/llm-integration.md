# Best Practice · LLM Integration (LLM 集成规范)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 适用: Phase-19 AI Reviewer + Phase-21 Auto E2E Generator + 任何 LLM 调用
> 来源: Phase-19 ai-review 模块 + cost-tracker.service.ts + DR-005

---

## 1. 🎯 目标

建立统一的 LLM 集成规范,确保:
- ✅ **成本可控**:TD-001 月度预算 $1000 硬上限
- ✅ **质量稳定**:TD-002 准确率 ≥70%
- ✅ **可观测**:每次调用的 token + 成本 + 延迟都有记录
- ✅ **可降级**:Provider 故障时自动切换 fallback
- ✅ **可缓存**:Prompt 缓存命中率 ≥60%

---

## 2. 📐 核心规范

### 2.1 必须通过抽象接口调用

```typescript
// ✅ 正确: 使用 ILLMProvider 抽象
const provider = this.factory.get('claude')
const response = await provider.generate({
  systemPrompt: REVIEW_DIFF_SYSTEM,
  userPrompt,
  temperature: 0.2,
  cacheKey: `review:${prId}`,
})

// ❌ 错误: 直接 new SDK
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: 'sk-...' })
// 无法降级、无法追踪、无法复用 cache
```

### 2.2 必须经过 CostTracker

```typescript
// ✅ 正确: budget check → call → record
const budget = this.costTracker.checkBudget(request.provider)
if (!budget.allowed && budget.fallback) {
  request.provider = budget.fallback
}

const response = await provider.generate(request)
this.costTracker.recordUsage(response.usage)
this.costTracker.setCache(request, response)

// ❌ 错误: 跳过 cost tracker
const response = await provider.generate(request)
// 月度成本失控,无任何追踪
```

### 2.3 必须使用强 schema Prompt

```typescript
// ✅ 正确: ReviewOutput 强类型 + few-shot
const REVIEW_DIFF_SYSTEM = `你是资深代码评审专家...`
const REVIEW_DIFF_USER_TEMPLATE = `请评审以下 PR diff: ...`

interface ReviewOutput {
  overallScore: number
  issues: Array<{ severity: ...; category: ...; message: string }>
  needsApproverReview: boolean
}

const FEW_SHOT_EXAMPLE: ReviewOutput = { /* 示例 */ }

// ❌ 错误: 自由文本 prompt
const prompt = '请评审这段代码,告诉我有什么问题'
// 输出不可解析,无法自动化
```

### 2.4 温度 ≤0.3 (确定性输出)

```typescript
// ✅ 正确: 评审用 0.2-0.3
{ temperature: 0.2 }  // code review
{ temperature: 0.3 }  // test suggestion

// ⚠️ 例外: 创意生成可用 0.7-1.0
{ temperature: 0.8 }  // marketing copy (Phase-17 内容运营)

// ❌ 错误: 评审用高温
{ temperature: 0.9 }  // 结果不可重复,无法 A/B
```

### 2.5 必须有 Cache Key

```typescript
// ✅ 正确: cacheKey 用 hash(prId + diffHash)
import { createHash } from 'node:crypto'
const cacheKey = `review:${createHash('sha256').update(prId + diffHash).digest('hex')}`

// ❌ 错误: 无 cacheKey
const cacheKey = undefined
// 重复评审相同 PR,成本翻倍
```

### 2.6 必须设置 timeout + retry

```typescript
// ✅ 正确: 配置 timeout + 指数退避
{
  timeoutMs: 60000,        // Claude 默认 60s
  maxRetries: 3,
  backoff: { type: 'exponential', delay: 1000 },
}

// ❌ 错误: 无 timeout
// Provider 故障导致整个 service hang
```

---

## 3. 💰 成本控制最佳实践

### 3.1 选择合适模型

| 任务 | 推荐模型 | 成本 (per 1M tokens) | 适用 |
|---|---|---|---|
| 代码评审 (核心) | Claude Sonnet 4.6 | $3/$15 | 准确率优先 |
| 测试用例 | GPT-4o-mini | $0.15/$0.60 | 成本优先 |
| RFC 起草 | Claude Sonnet 4.6 | $3/$15 | 长文生成 |
| 简单分类 | GPT-4o-mini | $0.15/$0.60 | 短文本 |
| Embedding | text-embedding-3-large | $0.13 | RAG |

### 3.2 缩短 prompt

```typescript
// ✅ 正确: 只传必要 context
const filesContext = files.slice(0, 5).map(f => `### ${f.path}\n${f.diff.slice(0, 2000)}`).join('\n')

// ❌ 错误: 完整 diff 不限长度
const filesContext = files.map(f => f.diff).join('\n')  // 可能 100K+ tokens
```

### 3.3 Prompt 缓存策略

```typescript
// 缓存命中率目标 ≥60%
// 策略 1: 相同 PR 不重复评审
const cacheKey = `review:${prId}:${diffHash}`

// 策略 2: 相同模板相同系统提示 (Anthropic prompt caching)
const systemPrompt = `你是 shenjiying88 资深评审...` // 可缓存
```

### 3.4 降级链

```typescript
// 默认 claude (准)
// 软上限触发 → openai (便宜)
// 硬上限触发 → BudgetExceededError
const fallbackChain = ['openai', 'claude']
```

---

## 4. 🔍 可观测性

### 4.1 必须记录 metrics

```typescript
// ✅ 正确: 每次调用记录
this.costTracker.recordUsage({
  inputTokens: response.usage.inputTokens,
  outputTokens: response.usage.outputTokens,
  totalTokens: ...,
  costUsd: calculateCost(...),
  provider: response.provider,
  model: response.model,
  timestamp: new Date().toISOString(),
})

// 监控指标:
// - LLM 调用 QPS / 延迟 P95 / 成功率
// - 月度成本 / 单调用成本 / Token 吞吐
// - Provider 切换次数 (claude → openai)
// - Cache 命中率
```

### 4.2 必须结构化日志

```typescript
// ✅ 正确: 结构化 JSON log
this.logger.log({
  event: 'llm.generate',
  provider: response.provider,
  model: response.model,
  inputTokens: response.usage.inputTokens,
  outputTokens: response.usage.outputTokens,
  costUsd: response.usage.costUsd,
  latencyMs: response.latencyMs,
  cacheHit: response.cacheHit,
  intent: request.metadata?.intent,
}, 'LLM call completed')

// ❌ 错误: 自由文本 log
this.logger.log('Claude called successfully')
```

---

## 5. 🧪 测试策略

### 5.1 单元测试 (mock provider)

```typescript
// mock ILLMProvider,验证 budget check + cache + record
const mockProvider = {
  generate: vi.fn().mockResolvedValue({
    content: '{"overallScore":7}',
    usage: { inputTokens: 100, outputTokens: 50, costUsd: 0.01, ... },
  }),
}

factory.register('claude', mockProvider)
await service.reviewPRDiff(params)
expect(costTracker.recordUsage).toHaveBeenCalled()
```

### 5.2 集成测试 (真实 SDK + mock HTTP)

```typescript
// 使用 nock 拦截 Anthropic API
nock('https://api.anthropic.com')
  .post('/v1/messages')
  .reply(200, { content: [{ text: '...' }], usage: {...} })

const response = await claudeProvider.generate(request)
expect(response.content).toContain('...')
```

### 5.3 准确率测试 (TD-002)

```typescript
// ground truth: 100 个已知 bug PR
// 验证: AI Review 准确率 ≥70%
const groundTruth = loadGroundTruthPRs()  // 100 个
const reviews = await Promise.all(groundTruth.map(pr => service.reviewPRDiff(pr)))

const metrics = evaluateAB(reviews, groundTruth)
expect(metrics.hitRateAtK).toBeGreaterThanOrEqual(0.7)
```

---

## 6. 🚨 异常处理

### 6.1 Provider 不可用

```typescript
try {
  return await provider.generate(request)
} catch (err) {
  if (err instanceof LLMUnavailableError) {
    // 切换 fallback provider
    const fallback = this.factory.getAvailable(this.cfg.fallbackChain)
    return await fallback.generate(request)
  }
  throw err
}
```

### 6.2 预算耗尽

```typescript
try {
  const budget = this.costTracker.checkBudget(provider)
} catch (err) {
  if (err instanceof BudgetExceededError) {
    // 返回错误给调用方,由调用方决定
    // - 延迟评审到下个月
    // - 人工评审
    // - 申请预算追加 (RFC)
    throw new ServiceUnavailableException({
      code: 'LLM_BUDGET_EXCEEDED',
      message: 'AI Reviewer 月度预算已耗尽,已切换人工评审',
      monthlyCost: err.currentCostUsd,
      limit: err.limitUsd,
    })
  }
}
```

### 6.3 内容过滤 / 速率限制

```typescript
// Anthropic content_filter 触发 → 记录 + 重试
if (response.finishReason === 'content_filter') {
  this.logger.warn('LLM content filter triggered', { request })
  // 不缓存 (已在 cost-tracker 中处理)
  // 触发人工 review
  return { needsApproverReview: true, ... }
}
```

---

## 7. 📋 Checklist 上线前必查

- [ ] 所有 LLM 调用通过 `LLMProviderFactory.get()`
- [ ] 所有调用经过 `CostTracker.checkBudget()`
- [ ] 所有 response 通过 `CostTracker.recordUsage()`
- [ ] Prompt 含 `cacheKey`
- [ ] Temperature ≤0.3 (创意类除外)
- [ ] Prompt 模板有 few-shot example
- [ ] Output schema 强类型 + JSON 解析鲁棒
- [ ] Timeout + retry 配置
- [ ] Fallback chain 配置
- [ ] 结构化日志 + metrics
- [ ] 单元测试 ≥80% 覆盖
- [ ] 准确率测试 (TD-002, ≥70%)
- [ ] 异常处理 (provider / budget / content filter)

---

## 8. 🔗 关联文档

- [knowledge/decision-records/DR-005-rag-architecture.md](../decision-records/DR-005-rag-architecture.md) · RAG 架构
- [knowledge/anti-patterns/synchronous-llm-call.md](../anti-patterns/synchronous-llm-call.md) · 反模式
- [debt.md TD-001](../../debt.md) · LLM 成本控制
- [debt.md TD-002](../../debt.md) · AI Review 准确率阈值
- [apps/api/src/modules/ai-review/](../../apps/api/src/modules/ai-review/) · 实现

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 评审: Champion (待 R8 通过)
> 强制: Phase-19 上线前必须全部 checklist 通过
> 更新: 新增 LLM 场景时同步更新 checklist
