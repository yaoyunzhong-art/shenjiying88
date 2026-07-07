# Phase-28 Retrospective: Session 详情页接入 Stream

## 1. 完成情况

| 指标 | 值 |
|------|---|
| 任务数 | 5 (T122-T126) |
| 完成 | 5/5 (100%) |
| E2E 断言 | 49 pass / 0 fail |
| 代码增量 | +218 行 session-detail-client + 49 行 E2E + 160 行 spec |
| Bug 修复 | 1 (mergeMessages 累积去重) |

## 2. 核心交付

1. **详情页 stream 集成**: 7 state + 1 ref + 1 callback + 1 useEffect
2. **消息合并**: 累积 seen 去重(防止 stream 重复推送)
3. **UI 状态条**: 4 态(订阅中/历史快照/失败/未订阅)+ 进度条 + 事件计数
4. **错误恢复**: resubscribe 按钮(用户手动重新订阅)
5. **生命周期**: useEffect cleanup 自动取消 stream

## 3. 关键 Bug 修复

### Bug: mergeMessages 未去重 stream 自身

**根因**: 初版 `extras = streamMsgs.filter((m) => !seen.has(m.id))` 只 filter 原 session 里的 id,**stream 内部的重复 id** 仍会重复 push。

**修复**: 累积 seen:
```typescript
const seen = new Set(session.messages.map((m) => m.id));
const extras: AgentMessage[] = [];
for (const m of streamMessages) {
  if (!seen.has(m.id)) {
    extras.push(m);
    seen.add(m.id);  // 累积,防止 stream 重复推送
  }
}
```

**触发场景**: SDK SSE 解析时,如果服务器重发或 retry,同一 message id 会再次 yield。E2E Section 2 专门验证此场景。

## 4. 架构亮点

### DR-17: stream 推送增量 messages,非替换 session

stream 来源是 re-run(同 config + userInput),产生新 session.id。前端**只**用 stream 的 message_added,绝不替换原 session。

### DR-18: auto-scroll 默认关闭

Phase-28 未实现(留给 Phase-29 增强),但 useMemo + ref 留好接口。

### DR-19: 历史快照标记

COMPLETED/FAILED 会话显示 "✅ 已完成 (历史快照)",明确告知用户这些是静态数据(非 live tail)。

### DR-20: 失败会话仍提供重试

`🔁 重新订阅` 按钮让用户手动触发新的 stream(replay)。

## 5. 复用 Phase-27 基础设施

| 组件 | 来源 |
|------|------|
| `runAgentSessionStream` SDK 方法 | Phase-27 |
| 进度条样式 | Phase-27 (Studio) |
| `subscribeStream` async 函数 | Phase-27 (Studio) 的 `runStream` 简化版 |
| 7 事件类型 | Phase-27 |
| 累积 seen dedup | 新加(mergeMessages) |

Phase-28 几乎是"复制 Phase-27 的 Studio stream UI 到详情页 + 合并逻辑"。

## 6. listener 异常处理观察

E2E Section 4 验证:当 listener 在 `step_progress` 抛错时,`executeSessionWithEvents` 内部 try/catch 把错误吞了,但**不 emit session_failed**(因为没 rethrow)。结果是:
- events 流到 step_progress #2 后停止
- 没有 session_failed 事件
- service 静默失败

**这是 Phase-27 设计选择**:stream 不应因单个 listener 异常而中断。但 Phase-29 可以让 SDK 监听 error 并自动 reconnect。

## 7. 后续 Phase-29 候选

1. **真正 SSE endpoint**: `GET /agent/sessions/{id}/live-stream` 订阅已存在的 session
2. **Event replay**: DB 持久化所有 events,详情页可回放任意 session 的完整 timeline
3. **WebSocket 双工**: 客户端可 cancel/pause/rewind
4. **多 session 并发仪表盘**: 实时监控多个 RUNNING session
5. **Timeline 可视化**: 步骤条 + 消息流 + 工具调用时间轴

## 8. 经验沉淀

### ✅ 成功模式
- 累积 seen dedup(不是 filter-only)— 适用于所有 stream 合并场景
- `useRef` flag 控制 cancel — 简单可靠
- 状态条分 4 态(订阅中/历史快照/失败/未订阅)— 覆盖所有用户场景
- detail-testid 一致命名(Phase-27 studio-testid 风格)

### ⚠️ 待改进
- Phase-27 listener 异常应 emit session_failed(让前端知道)
- mergeMessages 应该 deep clone(避免 props 引用泄露)
- auto-scroll 应实现(Phase-29)
- 应支持 stream 中断重连(网络抖动)

## 9. 文件清单

| 路径 | 行数 | 说明 |
|------|------|------|
| `apps/admin-web/app/agents/sessions/[id]/session-detail-client.tsx` | +218 | stream 集成 + mergeMessages fix |
| `scripts/phase28-e2e-detail-stream.ts` | +318 | 49 断言 E2E |
| `.trae/specs/phase-28-detail-stream/spec.md` | 160 | 规格 |
| `.trae/specs/phase-28-detail-stream/tasks.md` | 50 | 任务 |
| `.trae/specs/phase-28-detail-stream/retrospective.md` | 本文件 | 复盘 |