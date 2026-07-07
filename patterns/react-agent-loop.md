# Pattern: ReAct Agent 主循环

**适用场景**: 复杂任务自动化 (客服 / 编程助手 / 运营分析)

## 模式

```typescript
class AgentCore {
  async run(query: string, options: { maxSteps, signal, onStep }): Promise<AgentRunResult> {
    const messages = [systemMsg, userMsg];
    const steps: AgentStep[] = [];

    for (let i = 0; i < maxSteps; i++) {
      if (signal?.aborted) throw new Error('aborted');

      // 1. Thought (LLM 决策)
      const resp = await llm.complete({ messages, tools });
      const step: AgentStep = { step: i+1, thought: resp.content, ... };

      // 2. Check final answer
      if (resp.finishReason === 'stop' && !resp.toolCalls) {
        step.finalAnswer = resp.content;
        steps.push(step);
        break;
      }

      // 3. Action (Tool call)
      if (resp.toolCalls) {
        const call = resp.toolCalls[0];
        step.action = { tool: call.name, input: call.input, toolCallId: call.id };
        messages.push({ role: 'assistant', content: resp.content, toolCalls: resp.toolCalls });

        // 4. Observation (执行 tool)
        try {
          const result = await tools.execute(call.name, call.input);
          step.observation = { toolCallId: call.id, result };
          messages.push({ role: 'tool', content: JSON.stringify(result), toolCallId: call.id });
        } catch (e) {
          step.observation = { toolCallId: call.id, result: null, error: e.message };
          messages.push({ role: 'tool', content: `Error: ${e.message}`, toolCallId: call.id });
        }
      }

      steps.push(step);
      onStep?.(step);
    }

    return { steps, finalAnswer, success, totalUsage, totalDurationMs };
  }
}
```

## 关键原则

1. **完整 trace**: 每步记录 thought/action/observation/durationMs
2. **优雅终止**: maxSteps + AbortSignal + final answer
3. **错误不中断**: tool 失败记录到 observation.error,继续循环
4. **可观测回调**: onStep 实时上报,UI 可 streaming
5. **Mock LLM 可测试**: 全局 step counter 模拟循环终止

## 多 Agent 扩展 (T87)

```typescript
class OrchestratorAgent {
  async run(query) {
    // 1. 分解任务到 workers
    // 2. DAG 拓扑序 + 并行执行 (Promise.all)
    // 3. 汇总 worker results
  }
}
```

## 反思扩展 (T88)

```typescript
class ReflectionEngine {
  async reflect(result, query): Promise<Reflection> {
    // 评分 relevance/completeness/accuracy
    // 检测 issues + 给出 improvements
    // needsRetry 决策
  }
}
```

## Phase-23 来源

- T85 agent-core.ts (11/11)
- T87 multi-agent.ts (11/11)
- T88 self-reflection.ts (16/16)
