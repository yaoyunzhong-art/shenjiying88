# 📋 Phase-32 Tasks: Stream 重连 + Last-Event-ID 续传

> **Phase**: 32
> **负责人**: 🌲 树哥trae (前台实施) / 🦞 openclaw (后台验收)
> **总估时**: 8h
> **前置**: Phase-30 ✅ Phase-31 ✅

---

## T143 — SDK 指数退避重试 (2h)

**目标**: `packages/sdk/src/index.ts` 新增重连逻辑

**AC**:
- [ ] `subscribeStream` 检测到 `error` 时启动退避
- [ ] 退避间隔: 1000ms → 2000ms → 4000ms (backoffMultiplier=2)
- [ ] `maxRetries=3` 时第 4 次不再重试,触发 `onError`
- [ ] 重连请求带 `Last-Event-ID: <上次收到的事件 id>`
- [ ] 配置项 `reconnect.enabled` 默认 `true`

**依赖**: 无

**输出**: `packages/sdk/src/index.ts` 新增 80-120 行

---

## T144 — Event Buffer 服务端 (2h)

**目标**: 新建 `apps/api/src/modules/agent/event-buffer.service.ts`

**AC**:
- [ ] `@Injectable()` 类 `EventBufferService`
- [ ] `Map<sessionId, { events: AgentSessionEvent[], maxId: number }>`
- [ ] `append(sessionId, event)` 入队 + 自增 id + LRU 100 限制
- [ ] `replayAfter(sessionId, lastEventId)` 返回 `lastEventId` 之后的事件数组
- [ ] `has(sessionId)` 判断 session 是否有缓冲
- [ ] 模块导出,供 AgentController 注入

**依赖**: T143 (确定事件 id 格式)

**输出**: `event-buffer.service.ts` 60-80 行 + `event-buffer.module.ts` 20 行

---

## T145 — SSE 端点集成 Event Buffer (1.5h)

**目标**: 修改 `apps/api/src/modules/agent/agent.controller.ts`

**AC**:
- [ ] `@Sse('sessions/run-stream)` 方法读 `@Headers('last-event-id')`
- [ ] 如果 lastEventId 存在,先调 `eventBuffer.replayAfter()` 补发
- [ ] 如果 lastEventId 超出缓冲,返回 410 Gone (`throw new HttpException('events_expired', 410)`)
- [ ] SSE chunk 格式追加 `id: <event.id>\n` (在 `data:` 之前)
- [ ] runSessionWithStream listener 回调里同时调 `eventBuffer.append()`

**依赖**: T144

**输出**: `agent.controller.ts` 修改 +30 行

---

## T146 — ReconnectingBadge 组件 (1.5h)

**目标**: 新建 `packages/ui/src/components/ReconnectingBadge.tsx`

**AC**:
- [ ] 接收 props: `state: 'connecting' | 'open' | 'reconnecting' | 'closed'`
- [ ] 4 种状态对应 4 种 UI:
  - `connecting`: 灰色 "🔄 连接中..."
  - `open`: 绿色 "✓ 已连接" (3s 后自动消失)
  - `reconnecting`: 黄色 "🔄 重连中... (2/3)"
  - `closed`: 红色 "❌ 连接已断开 [重试]" (按钮)
- [ ] 通过 `data-testid` 暴露状态 (e.g. `data-testid="reconnecting-badge-state"`)
- [ ] 不耦合具体 stream 逻辑 (纯展示组件)

**依赖**: 无 (可与 T143 并行)

**输出**: `ReconnectingBadge.tsx` 80-100 行 + `.test.tsx` 40 行

---

## T147 — E2E 集成 (1h) + 文档 (0.5h)

**目标**: 写 `scripts/phase32-e2e-reconnect.ts` + 出 retro

**AC**:
- [ ] 47 断言全过 (Spec §6 表格)
- [ ] 静态扫描关键 token (`EventBuffer` / `Last-Event-ID` / `backoff` / `reconnecting-badge`)
- [ ] 出 `.trae/specs/phase-32-retro.md` (做得好的 / 问题 / 改进)
- [ ] 出 `.trae/tasks/phase-32-tasks-done.md` (标记 T143-T147 done)
- [ ] atomic commit 锁定 (防 cron wipe)

**依赖**: T143-T146 全部完成

**输出**: E2E 脚本 250 行 + retro 80 行

---

## 📊 任务依赖图

```
T143 (SDK 退避) ──┐
                  ├──→ T145 (SSE 集成 buffer)
T144 (Buffer) ────┤        │
                  │        ▼
                  │   T146 (Badge) ──→ T147 (E2E + 文档)
                  │                       │
                  └───────────────────────┘
                          (T146 可与 T143-T145 并行)
```

## 🎯 验收 checklist (🦞 openclaw)

- [ ] T143-T147 全部 commit 在 main 分支
- [ ] `pnpm tsx scripts/phase32-e2e-reconnect.ts` 输出 47 pass / 0 fail
- [ ] 文件静态扫描命中所有关键 token
- [ ] ReconnectingBadge 在 dashboard 上视觉合理 (4 状态可识别)
- [ ] 模拟断网 5s → 重连 → 事件无丢失 (人工验收)

---

> 📋 **"5 个任务 + 47 断言 + 8h 实施 = Stream 生产级"**