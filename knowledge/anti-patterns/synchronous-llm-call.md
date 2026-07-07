# Anti-Pattern · Synchronous LLM Call in Request Lifecycle

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 严重度: 🔴 P0 (可导致服务雪崩)
> 来源: Phase-19 ai-review 设计阶段 (避免陷阱)

---

## 1. 🚨 反模式描述

在 HTTP 请求生命周期中**同步等待 LLM 响应**,导致:

- ❌ 请求延迟 +5s ~ +60s (LLM 响应时间不可控)
- ❌ 数据库连接被长时间占用 → 池耗尽 → 全站 500
- ❌ 单实例并发能力降至 1 LLM call / worker
- ❌ LLM Provider 故障 → 请求全部 hang → 用户看到白屏
- ❌ 难以做单元测试 (必须 mock 整个 LLM 调用链)
- ❌ 月度预算无法控制 (无 budget gate 介入时机)

---

## 2. ❌ 反例代码

### 2.1 反例 1: Controller 中直接 await

```typescript
// ❌ 反例: HTTP 请求中同步调用 LLM
@Controller('review')
export class ReviewController {
  @Post()
  async createReview(@Body() dto: ReviewDto) {
    // 🚨 HTTP 请求被 LLM 调用 hang 住 5-60s
    const result = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: dto.code }],
    })
    return result
  }
}
```

**问题**:
- 用户等待 30s+ 看到结果
- Express 默认 timeout 30s → 超时 504
- NestJS 默认 worker 数耗尽 → 后续请求排队

### 2.2 反例 2: Service 中无 timeout

```typescript
// ❌ 反例: 没有 timeout
async reviewCode(code: string) {
  const result = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    body: JSON.stringify({ model: 'claude-sonnet-4-6', messages: [...] }),
    // 无 signal / timeout
  })
  return result.json()
}
```

**问题**:
- 网络故障 → 永久 hang
- Provider 故障 → 永久 hang
- 必须靠外部 gateway timeout (往往没有)

### 2.3 反例 3: 无 budget gate

```typescript
// ❌ 反例: 月度预算耗尽仍继续调用
async reviewCode(code: string) {
  // 没有 costTracker.checkBudget()
  const result = await this.claude.generate(...)
  this.costTracker.recordUsage(...)  // 只记录,不拦截
}
```

**问题**:
- 月初预算 $1000,月中已花 $1500
- 财务看到账单崩溃
- 无法实施"软上限切换 fallback"策略

---

## 3. ✅ 正确做法

### 3.1 异步任务模式 (推荐)

```typescript
// ✅ 正确: HTTP 立即返回 jobId,worker 异步处理
@Controller('review')
export class ReviewController {
  @Post()
  @HttpCode(202)  // Accepted
  async createReview(@Body() dto: ReviewDto): Promise<{ jobId: string }> {
    const job = await this.reviewQueue.add('review', dto, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
    })
    return { jobId: job.id }  // 立即返回,不等 LLM
  }

  @Get(':jobId')
  async getReviewStatus(@Param('jobId') jobId: string) {
    const job = await this.reviewQueue.getJob(jobId)
    return {
      status: await job.getState(),  // 'waiting' | 'active' | 'completed' | 'failed'
      result: job.returnvalue,
    }
  }
}
```

**优势**:
- HTTP 响应 < 100ms (用户立即收到 jobId)
- Worker 可水平扩展
- 失败可重试
- 可观测 (Bull Board)

### 3.2 强制 timeout + signal

```typescript
// ✅ 正确: AbortSignal + 超时
async reviewCode(code: string, options: { signal?: AbortSignal } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)  // 60s

  try {
    const result = await this.claude.generate(
      { userPrompt: code },
      { signal: controller.signal }
    )
    return result
  } finally {
    clearTimeout(timeout)
  }
}
```

### 3.3 Budget gate 前置

```typescript
// ✅ 正确: 预算检查 → 调用 → 记录
async reviewCode(code: string) {
  // 1. 预算检查 (前置)
  const budget = this.costTracker.checkBudget('claude')
  if (!budget.allowed) {
    if (budget.fallback) {
      // 软上限: 切换 fallback
      return this.reviewWithProvider(code, budget.fallback)
    }
    // 硬上限: 抛错
    throw new BudgetExceededError(...)
  }

  // 2. 调用
  const result = await this.claude.generate(...)

  // 3. 记录 (cache hit 也记录,但 cost=0)
  this.costTracker.recordUsage(result.usage)
  this.costTracker.setCache(...)

  return result
}
```

### 3.4 流式响应 (高级场景)

```typescript
// ✅ 正确: SSE 流式响应,客户端实时收到 token
@Controller('review')
export class ReviewController {
  @Post('stream')
  async streamReview(@Body() dto: ReviewDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')

    const stream = this.claude.generateStream({ userPrompt: dto.code })
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
    }
    res.end()
  }
}
```

**优势**:
- 用户立即看到首字 (TTFT < 1s)
- 长内容体验好
- 仍是 HTTP 长连接,但比同步 await 好

---

## 4. 📊 性能对比

| 指标 | 同步反模式 | 异步任务 | 流式响应 |
|---|---|---|---|
| **TTFT** (首字时间) | 5-60s | <100ms (jobId) | <1s (首 token) |
| **总完成时间** | 5-60s (HTTP 内) | 5-60s (后台) | 5-60s (后台流式) |
| **并发能力** | 1/worker | 100/worker | 5/worker |
| **故障影响** | 全站 hang | 仅 job 失败 | 连接断开 |
| **可观测** | 无 | Bull Board | Stream log |
| **测试难度** | 难 (mock 链) | 易 (worker 独立) | 中 (需要 EventSource) |

---

## 5. 🔍 检测方法

### 5.1 代码审查 checklist

- [ ] LLM 调用是否在 Controller 内同步 `await`?
- [ ] LLM 调用是否有 timeout / AbortSignal?
- [ ] LLM 调用前是否 `costTracker.checkBudget()`?
- [ ] LLM 调用是否经过 `LLMProviderFactory`?
- [ ] LLM 调用是否有 fallback chain?

### 5.2 grep 检测

```bash
# 检测反模式: Controller / Service 中同步 LLM 调用
grep -rn "await.*openai\|await.*anthropic\|await.*this\.claude\.generate\|await.*this\.openai\.generate" \
  apps/api/src/modules/*/{controller,service}.ts

# 应该为 0 (除了 wrapper service)
```

### 5.3 Linter 规则 (Phase-21)

```typescript
// eslint-plugin-custom 规则:
// 'no-sync-llm-in-request-lifecycle'
// 检测: HTTP handler (装饰器 @Get/@Post) 中包含 await LLM 调用
```

---

## 6. 🔗 关联文档

- [knowledge/best-practices/llm-integration.md](../best-practices/llm-integration.md) · LLM 集成规范
- [knowledge/decision-records/DR-005-rag-architecture.md](../decision-records/DR-005-rag-architecture.md) · RAG 架构
- [debt.md TD-001](../../debt.md) · LLM 成本控制
- [apps/api/src/modules/ai-review/](../../apps/api/src/modules/ai-review/) · 实现

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 强制: 所有 LLM 调用必须遵循 (代码评审自动检查)
> 评审: Champion (待 R8 通过)
