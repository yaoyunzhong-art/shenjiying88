# Phase-27 Spec: SSE 实时流推送

## 1. 目标

为 Agent 会话执行引入 **实时事件流 (SSE / Server-Sent Events)**,让前端可以逐步看到执行进度,而不是等待完整结果。

## 2. 范围

### 包含

- 7 类事件类型的 discriminated union (Phase-27 协议)
- 后端 `AgentService.runSessionWithStream` 方法
- SDK `ApiClient.runAgentSessionStream` 返回 `AsyncGenerator<AgentSessionEvent>`
- Studio 单会话模式的流式 UI (实时步骤条 + 消息流 + 事件直方图)
- 92 项 E2E 断言 (types + service + SDK + UI)

### 不包含

- 持久化事件流到数据库 (Phase-28+)
- WebSocket 推送(后续 phase 视情况)
- 实时取消/暂停会话(后续 phase)

## 3. 事件协议 (AgentSessionEvent)

### Discriminated Union (8 类型)

```typescript
export type AgentSessionEvent =
  | { type: 'session_started'; session: AgentSession; timestamp: string }
  | { type: 'message_added'; message: AgentMessage; timestamp: string }
  | { type: 'tool_call_started'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'tool_call_completed'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'step_progress'; step: number; maxSteps: number; timestamp: string }
  | { type: 'reflection_started'; step: number; timestamp: string }
  | {
      type: 'session_completed';
      session: AgentSession;
      execution: AgentExecution;
      timestamp: string;
    }
  | { type: 'session_failed'; session: AgentSession; error: string; timestamp: string };

export type AgentSessionEventListener = (event: AgentSessionEvent) => void;
export type AgentSessionEventType = AgentSessionEvent['type'];
```

### 事件语义

| 事件 | 含义 | 关键字段 |
|------|------|----------|
| `session_started` | 会话开始,创建 session 对象 | `session` |
| `message_added` | 新增消息 (system/user/assistant/tool) | `message` |
| `tool_call_started` | 工具调用开始,PENDING 状态 | `toolCall` |
| `tool_call_completed` | 工具调用完成,SUCCESS/FAILED | `toolCall` |
| `step_progress` | 步数进度 (1/5 → 5/5) | `step, maxSteps` |
| `reflection_started` | 反思开始 (仅 enableReflection) | `step` |
| `session_completed` | 会话成功完成 (终态) | `session, execution` |
| `session_failed` | 会话失败 (终态) | `session, error` |

### 事件顺序 (5 步 + reflection)

```
1. session_started
2. message_added (system prompt)
3. message_added (user input)
4. step_progress (1/5)
5. message_added (assistant thought)
6. tool_call_started
7. tool_call_completed
8. message_added (tool result)
9. step_progress (2/5)
... (重复 5 轮)
24. step_progress (5/5)
25. message_added (assistant thought)
26. tool_call_started
27. tool_call_completed
28. message_added (tool result)
29. reflection_started
30. message_added (reflection)
31. session_completed
```

总计:31 事件(5 步 + 反思 + 终态)

## 4. 后端实现

### AgentService.runSessionWithStream

```typescript
runSessionWithStream(
  request: CreateSessionRequest,
  listener: AgentSessionEventListener
): SessionExecutionResult {
  // 1. 验证 config (enabled)
  // 2. 创建 session 对象 + 初始消息 (system, user)
  // 3. push session 到内存存储
  // 4. listener(session_started)
  // 5. listener(message_added) × 2 (system, user)
  // 6. executeSessionWithEvents (内部逐步发射事件)
  // 7. 更新 session 终态
  // 8. listener(session_completed) or listener(session_failed)
  // 9. return { session, execution, timestamp }
}
```

### executeSessionWithEvents (私有方法)

每步执行:
1. `step_progress(step+1, maxSteps)`
2. assistant thought message → `message_added`
3. tool call mock → `tool_call_started` → `tool_call_completed`
4. tool result message → `message_added`
5. 最后一步 + `session.enableReflection` → `reflection_started` + reflection message

## 5. SDK 实现 (ApiClient.runAgentSessionStream)

```typescript
async *runAgentSessionStream(
  body: CreateSessionRequest,
  init: RequestInit = {}
): AsyncGenerator<AgentSessionEvent, void, undefined> {
  const url = `${baseUrl}/agent/sessions/run-stream`;
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(options, init.headers),
    body: JSON.stringify(body)
  });
  
  if (!response.ok) throw new Error(`Stream request failed with status ${response.status}`);
  if (!response.body) throw new Error('Stream response has no body');
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let sepIdx = buffer.indexOf('\n\n');
      while (sepIdx !== -1) {
        const block = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const dataLine = block.split('\n').find(line => line.startsWith('data: '));
        if (dataLine) {
          const json = dataLine.slice('data: '.length).trim();
          if (json && json !== '[DONE]') {
            try {
              yield JSON.parse(json) as AgentSessionEvent;
            } catch { /* 忽略解析失败 */ }
          }
        }
        sepIdx = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### SSE 格式

每个事件块:
```
data: {"type":"session_started","session":{...},"timestamp":"..."}

```

块之间用 `\n\n` 分隔,块内每行 `key: value`。[DONE] 标记流结束。

## 6. 前端实现 (Studio)

### 切换开关 (single mode only)

```tsx
<label>
  <input
    type="checkbox"
    checked={streamMode}
    onChange={(e) => setStreamMode(e.target.checked)}
    data-testid="studio-stream-mode"
  />
  🚀 实时流式 (Phase-27 SSE)
</label>
```

### runStream 函数

```typescript
const runStream = async () => {
  if (!canSubmit || streamRunning) return;
  setStreamRunning(true);
  setStreamEvents([]); setStreamMessages([]);
  setStreamStep(null); setStreamError(null); setStreamFinalSessionId(null);
  try {
    const body: CreateSessionRequest = { configId, userInput, ... };
    for await (const ev of runAgentSessionStream(body)) {
      setStreamEvents(prev => [...prev, ev]);
      if (ev.type === 'message_added') setStreamMessages(prev => [...prev, ev.message]);
      else if (ev.type === 'step_progress') setStreamStep({ current: ev.step, max: ev.maxSteps });
      else if (ev.type === 'session_completed') setStreamFinalSessionId(ev.session.id);
      else if (ev.type === 'session_failed') setStreamError(ev.error);
    }
  } catch (err) {
    setStreamError(err instanceof Error ? err.message : String(err));
  } finally {
    setStreamRunning(false);
  }
};
```

### UI 组件

- `studio-stream-mode`: 流式模式 checkbox
- `studio-stream-running`: 执行中状态(蓝)
- `studio-stream-completed`: 完成卡片(绿),含跳转 Session 详情链接
- `studio-stream-error`: 错误卡片(红)
- `studio-stream-progress`: 步骤进度条
- `studio-stream-messages`: 实时消息流(用户/助手/工具 3 色)
- `studio-stream-event-types`: 事件类型直方图(如 `message_added × 13`)

## 7. E2E 覆盖 (92 断言)

| Section | 断言数 | 覆盖 |
|---------|--------|------|
| 1. types 事件协议 | 7 | 8 事件类型 + 类型守卫 |
| 2. 后端 stream 基础流 | 24 | 5 步 + 反思 + 字段完整性 + 事件顺序 |
| 3. 边界场景 | 8 | config 不存在 / reflection 关闭 / maxSteps 覆盖 / listener 异常 |
| 4. SDK SSE parser | 4 | mock ReadableStream + 解析 3 事件 |
| 5. Studio UI 静态扫描 | 49 | streamMode/state/testid/链接/导出完整性 |
| **合计** | **92** | **0 fail** |

## 8. 架构决策 (DR)

### DR-13: discriminated union + timestamp

每个事件必须包含 `timestamp: string` 用于前端排序 + 时间线显示。

### DR-14: 终态事件只能是 session_completed 或 session_failed

中间事件 (step_progress / message_added / tool_call_*) 不携带"终态"语义。

### DR-15: SDK 返回 AsyncGenerator 而非 Observable

- Native ES2022,无需 rxjs 依赖
- 与 for await 完美配合
- 取消通过 `break` 实现 (无需 takeUntil)

### DR-16: SSE 而非 WebSocket

- 单向推送够用
- HTTP/1.1 兼容性好 (CDN, proxy)
- 浏览器原生 EventSource 可替代 fetch

## 9. 文件变更清单

| 文件 | 变更 |
|------|------|
| `packages/types/src/index.ts` | +33 行 (AgentSessionEvent + EventType union) |
| `packages/sdk/src/index.ts` | +73 行 (runAgentSessionStream + AsyncGenerator) |
| `packages/types/package.json` | main → src/index.ts (跨包解析) |
| `apps/api/src/modules/agent/agent.service.ts` | +130 行 (runSessionWithStream + executeSessionWithEvents + reflection bug fix) |
| `apps/admin-web/app/agents/agent-view-model.ts` | +8 行 (runAgentSessionStream wrapper) |
| `apps/admin-web/app/agents/studio/studio-client.tsx` | +233 行 (stream UI) |
| `scripts/phase27-e2e-sse-stream.ts` | +365 行 (92 断言) |
| `scripts/phase27-smoke.ts` | +42 行 (smoke test) |
| `.trae/specs/phase-27-sse-stream/{spec,tasks,retrospective}.md` | 3 个文档 |