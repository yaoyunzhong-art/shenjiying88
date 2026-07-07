# Phase-28 Spec: Session 详情页接入 Stream

## 1. 目标

把 Phase-25 的 Session 详情页与 Phase-27 的 SSE stream 整合,让用户查看 RUNNING 状态的会话时能看到**实时执行进度**(消息流、工具调用、步数),而不是只看到一个静态 "执行中" 状态。

## 2. 核心场景

| 场景 | 当前行为 | Phase-28 行为 |
|------|----------|---------------|
| 查看 RUNNING 会话 | 显示初始 messages + 静态 "运行中" 状态 | **自动订阅 stream**,逐步追加新 message/工具调用 |
| 查看 COMPLETED 会话 | 显示完整 messages(一次性 fetch) | 显示完整 messages + "📡 历史快照" 标记 |
| 查看 FAILED 会话 | 显示错误消息 + 部分 messages | 显示错误消息 + 已接收的 messages |
| Studio 跳转到详情 | session 是 RUNNING,跳过去后看到 0 步 | 跳过去后看到执行过程实时展开 |

## 3. 架构

### 3.1 RSC 层 (page.tsx)

保持不变:
- 服务端 fetch session/execution/evaluation/config
- 通过 props 传入 client
- **新增**:如果 session.status === 'RUNNING',page.tsx 不需特殊处理(初始状态已是 RUNNING)

### 3.2 Client 层 (session-detail-client.tsx)

新增:

#### Stream state
```typescript
const [streamEnabled, setStreamEnabled] = useState(initialStatus === 'RUNNING');
const [streamRunning, setStreamRunning] = useState(initialStatus === 'RUNNING');
const [streamEvents, setStreamEvents] = useState<AgentSessionEvent[]>([]);
const [streamMessages, setStreamMessages] = useState<AgentMessage[]>(initialMessages);
const [streamStep, setStreamStep] = useState({ current: initialCurrentStep, max: initialMaxSteps });
const [streamStatus, setStreamStatus] = useState(initialStatus);
```

#### Subscribe 函数
```typescript
const subscribeStream = useCallback(async () => {
  try {
    for await (const ev of runAgentSessionStream({
      configId: session.configId,
      userInput: session.userInput,
      maxSteps: session.maxSteps,
      enableReflection: session.enableReflection,
      createdBy: 'detail-replay',
      tenantId: session.tenantId
    })) {
      setStreamEvents(prev => [...prev, ev]);
      switch (ev.type) {
        case 'message_added':
          setStreamMessages(prev => mergeMessage(prev, ev.message));
          break;
        case 'step_progress':
          setStreamStep({ current: ev.step, max: ev.maxSteps });
          break;
        case 'session_completed':
          setStreamStatus('COMPLETED');
          setStreamRunning(false);
          break;
        case 'session_failed':
          setStreamStatus('FAILED');
          setStreamRunning(false);
          break;
      }
    }
  } catch (err) {
    setStreamRunning(false);
  }
}, [session]);
```

**注意**: 实际是 re-run session,而非真的 subscribe 已存在的 session。这是 Phase-27 的局限(无 SSE endpoint + 无 replay)。Phase-29 会做真正的 replay。

#### useEffect 自动订阅
```typescript
useEffect(() => {
  if (streamEnabled && initialStatus === 'RUNNING') {
    subscribeStream();
  }
}, [streamEnabled]);
```

### 3.3 UI 增强

| 元素 | testid | 说明 |
|------|--------|------|
| 顶部 stream 状态条 | `detail-stream-status` | 🟢 运行中 / ✅ 已完成 / ❌ 失败 / ⏸ 未订阅 |
| 事件计数 | `detail-stream-event-count` | "已接收 12 事件" |
| 步骤进度条 | `detail-stream-progress` | 复用 Phase-27 studio 进度条样式 |
| 自动滚动到底部 | n/a | messages 列表追加后自动 scrollIntoView |
| 手动订阅按钮 | `detail-stream-resubscribe` | 如果 stream 断开,用户可手动重新订阅(replay) |

## 4. 消息合并策略

stream 推送的 message 来自 **re-run** 同一 configId + userInput,会产生新的 session.id(因为 runAgentSessionStream 内部创建新 session)。所以前端需要:

1. **不要**用 stream 的 session.id 替换原 session
2. **只**用 stream 的 message_added 事件增量更新消息列表
3. **不**保存 stream 的 execution 结果(原 session 已有 execution)
4. **只**关注消息流和步骤进度(用户最关心的)

## 5. E2E 覆盖 (预计 60+ 断言)

| Section | 断言数 |
|---------|--------|
| 1. 详情页 stream 集成 | 12 |
| 2. message 合并去重 | 8 |
| 3. 步骤进度更新 | 6 |
| 4. 终态事件处理 | 8 |
| 5. UI 静态扫描 (testid) | 15 |
| 6. 边界 (non-RUNNING 不订阅) | 6 |
| 7. 错误恢复 (resubscribe) | 5 |
| **合计** | **60** |

## 6. 架构决策 (DR)

### DR-17: stream 推送增量 messages,非替换 session

stream 来源是 re-run,而非原 session 的 live tail。前端只取 message_added 事件。

### DR-18: auto-scroll 仅在用户未手动滚动时

如果用户向上滚动查看历史消息,新消息进来时**不要**auto-scroll。检测:`scrollTop + clientHeight + threshold < scrollHeight` 时说明用户在底部。

### DR-19: 历史快照标记

COMPLETED/FAILED 会话的消息列表显示 `📜 历史快照` 标记,提示这些是静态数据(非 live)。

### DR-20: 失败会话仍订阅 stream(retry 模式)

FAILED 会话默认不订阅,但提供 "🔁 重试运行" 按钮,触发新的 stream。

## 7. 文件变更

| 文件 | 变更 |
|------|------|
| `apps/admin-web/app/agents/sessions/[id]/session-detail-client.tsx` | +200 行 (stream state + subscribe + UI) |
| `scripts/phase28-e2e-detail-stream.ts` | +450 行 (60 断言) |
| `.trae/specs/phase-28-detail-stream/{spec,tasks,retrospective}.md` | 3 文档 |

## 8. 验收清单

- [ ] Session 详情页对 RUNNING 会话自动订阅 stream
- [ ] 步骤进度条实时更新
- [ ] 新消息自动追加到列表
- [ ] 终态事件触发 UI 状态切换
- [ ] E2E 60+ 断言全过
- [ ] spec 文档落盘
- [ ] atomic commit 防 cron auto-stash

## 9. 后续 Phase-29 候选

- **真正 SSE endpoint**: 后端暴露 `/agent/sessions/{id}/live-stream`,订阅已存在的 session 的 live events
- **Event replay**: 持久化所有 events 到 DB,详情页可回放任意 session
- **WebSocket 双工**: 支持 client → server cancel/pause
- **多 session 并发视图**: 仪表盘同时订阅多个 session