# Phase-27 Retrospective: SSE 实时流推送

## 1. 完成情况

| 指标 | 值 |
|------|---|
| 任务数 | 5 |
| 完成 | 5/5 (100%) |
| E2E 断言 | 92 pass / 0 fail |
| 代码增量 | +860 行 (含 SDK + 后端 + 前端 + E2E + spec) |
| 关键 bug 修复 | 1 (reflection 配置覆盖) |

## 2. 核心交付

1. **types 协议**:`AgentSessionEvent` 8 类型 discriminated union + Listener 回调类型
2. **后端 stream**: `runSessionWithStream` 发射 31 事件(5 步 + 反思 + 终态)
3. **SDK SSE parser**: `AsyncGenerator<AgentSessionEvent>` + `\n\n` 分块解析
4. **Studio UI**: 7 个 testid,实时进度条 + 消息流 + 事件直方图
5. **E2E 92 断言**: types / service / SDK / UI 静态扫描全覆盖

## 3. 关键 Bug 修复

### Bug: `reflection` 配置覆盖无效

**位置**: `agent.service.ts` line 381  
**根因**: `if (config.enableReflection && step === steps - 1)`  
**问题**: 用户在 `CreateSessionRequest` 中传 `enableReflection: false`,但 `runSessionWithStream` 创建 `session.enableReflection = request.enableReflection ?? config.enableReflection`,然后执行时却读 `config.enableReflection`,**配置覆盖失效**。

**修复**: 改为 `if (session.enableReflection && step === steps - 1)`,统一从 session 读取。

**E2E 覆盖**: Section 3 断言 `reflection 关闭时无 reflection_started`。

## 4. 架构亮点

### DR-13: discriminated union + timestamp

每个事件必含 `timestamp: string`:
- 前端按时间排序
- 时间线显示
- 后端 debugging 时延分析

### DR-14: 终态事件二元化

中间事件不携带"终态"语义,前端 switch 只对 `session_completed` / `session_failed` 做收尾(跳转/错误显示)。

### DR-15: AsyncGenerator 而非 Observable

```typescript
for await (const ev of client.runAgentSessionStream({...})) {
  // 处理事件
  if (ev.type === 'session_completed') break;  // 取消
}
```

优势:
- Native ES2022,0 依赖
- 取消通过 `break` 即可
- 类型推断精准 (`Extract<Event, { type: 'X' }>`)

### DR-16: SSE 而非 WebSocket

- 单向推送(后端→前端)
- HTTP/1.1 兼容(proxy/CDN 不丢包)
- `text/event-stream` 标准 MIME
- 浏览器原生 `EventSource` 可替代 `fetch` (Phase-28 可选优化)

## 5. cron auto-stash 防御战

本 phase 遭遇 5+ 次 cron auto-stash,丢失改动包括:
- types/src/index.ts (AgentSessionEvent 被 revert)
- sdk/src/index.ts (runAgentSessionStream 被 revert,AsyncGenerator 被改成 `any`)
- api/agent.service.ts (stream 方法被 revert)

**防御策略**:
1. Edit 后立即 `grep` 验证未丢失
2. 重建 `dist/` 后立即 E2E 验证
3. 全部完成后**一次性 atomic commit**(本次 commit 由 cron 0f47cd63e 自动完成,意外保护了代码)

## 6. 跨包类型解析问题

`packages/types/package.json` `main` 原本指向 `dist/index.js`,但 `dist` 是 tsup 异步 build 产物,经常滞后于 `src`。

**修复**: `main` 改 `src/index.ts`,让所有跨包 import 直接走源码。
- 优点: 实时生效,IDE 类型正确
- 缺点: 牺牲了 dist 的运行时优化(可接受,因为 monorepo 内 pnpm symlink 直接到 src)

## 7. 后续 Phase-28 候选

1. **持久层**: DB 存储事件流 + Session replay
2. **WebSocket**: 双向通信(支持 client → server cancel)
3. **EventSource 优化**: 浏览器原生 API 替代 fetch + ReadableStream
4. **Studio Stream 增强**: 时间线轴可视化 + 暂停/恢复按钮
5. **Session 详情页接入 stream**: 自动增量更新消息列表(而非 fetch 一次性)

## 8. 经验沉淀

### ✅ 成功模式
- 7 事件类型足够覆盖所有执行场景
- AsyncGenerator 模式 + try/finally 释放 reader lock
- 静态扫描 + 动态运行双轨 E2E
- 每个事件含 timestamp 是后端 debugging 救命稻草

### ⚠️ 待改进
- listener 异常处理应 wrap try/catch per-event(本次用全局 catch)
- SSE 重连机制未实现(网络抖动需重试)
- UI 进度条依赖 `streamStep`,如果 step_progress 丢失则不显示(需 fallback)

## 9. 文件清单

| 路径 | 行数 | 说明 |
|------|------|------|
| `packages/types/src/index.ts` | +33 | AgentSessionEvent + Listener + EventType |
| `packages/types/package.json` | 1 | main → src/index.ts |
| `packages/sdk/src/index.ts` | +73 | runAgentSessionStream + AsyncGenerator |
| `apps/api/src/modules/agent/agent.service.ts` | +130 | runSessionWithStream + reflection fix |
| `apps/admin-web/app/agents/agent-view-model.ts` | +8 | wrapper |
| `apps/admin-web/app/agents/studio/studio-client.tsx` | +233 | stream UI |
| `scripts/phase27-e2e-sse-stream.ts` | 365 | 92 断言 E2E |
| `scripts/phase27-smoke.ts` | 42 | smoke test |
| `.trae/specs/phase-27-sse-stream/spec.md` | 160 | 规格 |
| `.trae/specs/phase-27-sse-stream/tasks.md` | 70 | 任务 |
| `.trae/specs/phase-27-sse-stream/retrospective.md` | 本文件 | 复盘 |