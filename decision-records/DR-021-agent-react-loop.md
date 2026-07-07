# DR-021: Agent ReAct 主循环设计

**Status**: Accepted
**Date**: Phase-23 (2026-06-26)
**Context**: Phase-23 T85 Agent 核心

## 决策

Agent 采用标准 **ReAct** 循环:
```
for i in 0..maxSteps:
  1. Thought: LLM 决策
  2. Action: 选择 tool + input
  3. Observation: 执行 tool 得结果
  4. if Final Answer → break
```

## 背景

Agent 设计有多种模式:
- **ReAct** (Reasoning + Acting): 每步 LLM 决策
- **Plan-Execute**: 先规划再执行 (CoT)
- **Reflexion**: 加 Reflection step 自我纠错
- **MRKL**: Multi-Route Knowledge + LLM

ReAct 是最简单且 work well 的模式,适合 V2 mock 实现。

## 关键设计

### AgentStep 结构
```typescript
{
  step: number,
  thought: string,
  action?: { tool, input, toolCallId },
  observation?: { toolCallId, result, error? },
  finalAnswer?: string,
  durationMs: number,
}
```

### 终止条件
1. LLM 返回 `finishReason: 'stop'` 无 tool_call → final answer
2. `maxSteps` 达到 → fallback 到最后 thought
3. AbortSignal 触发 → 抛 `aborted` error

### Message 协议 (OpenAI 兼容)
- system: system prompt
- user: 用户 query
- assistant: LLM 回复 (含 tool_calls)
- tool: tool 执行结果 (含 toolCallId)

## 后果

- ✅ 完全可观测 (每步记录)
- ✅ 可中断 (AbortSignal)
- ✅ 易于扩展 (T88 反思只需在 final 前插 step)
- ✅ 多 Agent (T87) 可复用同一 AgentCore

## 关键修复

1. **MockLLM step counter**: 用全局递增 counter,每次 new 实例 reset
2. **Tool execution error**: observation.error 字段记录,不中断循环
3. **maxSteps fallback**: 未达 final 时用最后 thought 作为 fallback
