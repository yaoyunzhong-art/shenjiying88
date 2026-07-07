# Phase-27 Tasks: SSE 实时流推送

## T1: types 事件协议 ✅

- [x] `packages/types/src/index.ts` 添加 `AgentSessionEvent` discriminated union
- [x] 8 事件类型:`session_started / message_added / tool_call_started / tool_call_completed / step_progress / reflection_started / session_completed / session_failed`
- [x] 添加 `AgentSessionEventType` union + `AgentSessionEventListener` 回调类型

## T2: 后端 stream 方法 ✅

- [x] `apps/api/src/modules/agent/agent.service.ts` 添加 `runSessionWithStream(request, listener): SessionExecutionResult`
- [x] 添加私有方法 `executeSessionWithEvents(session, config, listener): AgentExecution`
- [x] **Bug fix**: `reflection_started` 判断改用 `session.enableReflection` 而非 `config.enableReflection`(覆盖配置生效)
- [x] listener 异常 catch 后 emit `session_failed` 并 rethrow
- [x] 验证:`npx tsx -e` 实际 emit 31 事件(session_started + 2 init msg + 5×(step + thought + tool_started + tool_completed + tool_msg) + reflection + reflection_msg + session_completed)

## T3: SDK 暴露 stream API ✅

- [x] `packages/sdk/src/index.ts` 添加 `runAgentSessionStream(body, init)` 返回 `AsyncGenerator<AgentSessionEvent, void, undefined>`
- [x] SSE parser:`fetch` + `ReadableStream` + `\n\n` 分隔 + `data: {...}` JSON 解析
- [x] 端点:`POST /agent/sessions/run-stream` (content-type: text/event-stream)
- [x] `packages/types/package.json` main 改 `src/index.ts` (跨包类型解析,避免 dist 滞后)
- [x] 验证:`npx tsc -p packages/sdk/tsconfig.json --noEmit` 通过

## T4: Studio 流式 UI ✅

- [x] `apps/admin-web/app/agents/studio/studio-client.tsx` 添加:
  - 7 个 stream state: `streamMode / streamRunning / streamEvents / streamMessages / streamStep / streamError / streamFinalSessionId`
  - `runStream` async 函数订阅 `runAgentSessionStream`
  - 7 个 data-testid:`studio-stream-mode / -running / -completed / -error / -progress / -messages / -event-types`
  - 完成跳转:`/agents/sessions/${streamFinalSessionId}`
- [x] `apps/admin-web/app/agents/agent-view-model.ts` 添加 `runAgentSessionStream` wrapper

## T5: E2E + Spec 文档 ✅

- [x] `scripts/phase27-e2e-sse-stream.ts` 92 断言全过
  - Section 1 (types): 7 断言
  - Section 2 (后端 stream): 24 断言
  - Section 3 (边界): 8 断言
  - Section 4 (SDK SSE parser): 4 断言
  - Section 5 (Studio UI 静态): 49 断言
- [x] `.trae/specs/phase-27-sse-stream/spec.md` 完整规格文档
- [x] `.trae/specs/phase-27-sse-stream/tasks.md` (本文件)
- [x] `.trae/specs/phase-27-sse-stream/retrospective.md` 复盘

## 验收检查清单

- [x] `npx tsx scripts/phase27-e2e-sse-stream.ts` → 92/92 pass
- [x] 8 事件类型全部定义 + 全部 emit
- [x] SDK SSE parser 解析 3 mock 事件成功
- [x] Studio 7 个 testid 全部存在
- [x] reflection 覆盖配置生效(原 bug 修复)
- [x] listener 异常被 catch,stream 不中断