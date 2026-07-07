# 🦞 Phase-32 Spec: Stream 重连 + Last-Event-ID 续传

> **Phase**: 32
> **优先级**: P0 (必做)
> **估时**: 1 天
> **负责人**: 🦞 openclaw (后台 Spec + 验收) / 🌲 树哥trae (前台实施)
> **前置依赖**: Phase-30 (HTTP SSE 集成) ✅ + Phase-31 (多租户隔离) ✅
> **后续依赖**: Phase-33 (EventStore 持久化)

---

## 1. 业务背景

当前 SSE 流(Phase-30)存在 3 类断连风险:

1. **网络抖动**: 用户 WiFi 切换 / 4G-5G 切换 / 进电梯 → TCP 连接断
2. **服务器重启**: NestJS 滚动更新 / OOM / 部署 → 长连接被掐
3. **客户端切后台**: 浏览器 tab 切到后台 / 手机锁屏 → stream 被浏览器限流或断

**当前痛点**: 断连后客户端 `EventSource` 默认会重连,但服务器端**没有事件缓冲**:
- 用户会丢失断连期间的中间事件 (message_added / step_progress)
- 终态事件 (session_completed) 可能丢失 → 用户以为 agent 卡死
- 失败时只能整段重跑,浪费 LLM 算力

**Phase-32 目标**: 让断连恢复后,**用户不感知任何事件丢失**。

---

## 2. 验收标准 (AC)

### AC-1: 客户端指数退避重试
- [ ] SDK `subscribeStream()` 在收到 `error` 或 `complete` 异常时自动重连
- [ ] 重试间隔: 1s → 2s → 4s (指数退避)
- [ ] 最大重试: 3 次 (3 次后放弃,UI 显示"连接已断开,请手动刷新")
- [ ] 重连请求必须带 `Last-Event-ID` header

### AC-2: 服务端事件缓冲 (Last-Event-ID 续传)
- [ ] SSE 端点支持读 `Last-Event-ID` header
- [ ] 服务器按 session 缓冲最近 N 条事件 (默认 N=100,内存 buffer)
- [ ] 重连请求携带 `Last-Event-ID=X` 时,从 X 之后的事件开始 replay
- [ ] 如果 X 已过期 (> 缓冲大小),返回 410 Gone + 提示客户端重跑

### AC-3: UI 连接状态可视化
- [ ] `<ReconnectingBadge>` 组件在重连过程中显示 "🔄 重连中..." (loading)
- [ ] 重连成功显示 "✓ 已恢复" (3 秒后自动消失)
- [ ] 重连失败 3 次显示 "❌ 连接已断开 [手动重试]" 按钮
- [ ] 组件通过 props `state` 控制,不耦合具体 stream 逻辑

### AC-4: 跨网络切换不丢事件
- [ ] 模拟断网 5 秒 → 恢复 → 验证后续事件无重复无丢失
- [ ] 模拟 server restart (kill -9) → 重启 → 验证 session 可续传
- [ ] 模拟客户端切后台 30 秒 → 切回 → 验证事件完整

---

## 3. 接口设计

### 3.1 客户端 SDK 变化

```typescript
// packages/sdk/src/index.ts 新增 / 修改
interface SseSubscribeOptions {
  url: string
  body?: CreateSessionRequest
  onEvent: (event: AgentSessionEvent) => void
  onError?: (err: Error) => void
  // Phase-32 新增
  reconnect?: {
    enabled?: boolean          // 默认 true
    maxRetries?: number        // 默认 3
    initialDelayMs?: number    // 默认 1000
    backoffMultiplier?: number // 默认 2
  }
  lastEventId?: string         // 重连时携带
}

function subscribeStream(opts: SseSubscribeOptions): {
  unsubscribe: () => void
  status: 'connecting' | 'open' | 'reconnecting' | 'closed'
}
```

### 3.2 服务端 SSE 端点变化

```typescript
// apps/api/src/modules/agent/agent.controller.ts
@Sse('sessions/run-stream')
runSessionStream(
  @Headers('last-event-id') lastEventId: string | undefined,
  @Body() request: CreateSessionRequest
): Observable<SseMessageEvent>
```

**事件格式扩展** (每条 SSE chunk 末尾追加 `id:` 字段):
```
id: 42
data: {"type":"step_progress","step":3,...}

```

### 3.3 服务端 Event Buffer

```typescript
// apps/api/src/modules/agent/event-buffer.service.ts (新建)
@Injectable()
export class EventBufferService {
  private buffers = new Map<string, AgentSessionEvent[]>()
  
  append(sessionId: string, event: AgentSessionEvent): void {
    // LRU 缓冲,每 session 最多 100 条
  }
  
  replayAfter(sessionId: string, lastEventId: string): AgentSessionEvent[] {
    // 返回 lastEventId 之后的所有事件
  }
}
```

---

## 4. 数据流 (重连场景)

```
[断连发生]
  客户端 lastEventId = "42"
       │
       ▼ 1s 后
[客户端重连]
  GET /api/agent/sessions/run-stream
  Headers: Last-Event-ID: 42
       │
       ▼
[服务端读 Header]
  lastEventId = 42
       │
       ▼
[查 EventBuffer]
  session-xxx 缓冲了 50 条事件
  其中 42-50 是已发,1-41 是更早
       │
       ▼
[Replay]
  推送 events[42..49] 给客户端 (7 条补发)
  然后正常推送新事件
       │
       ▼
[客户端处理]
  onEvent(event) 依次触发
  用户感知不到断连
```

---

## 5. 边界 & 异常

| 场景 | 行为 |
|------|------|
| `Last-Event-ID` 为空 | 正常流(从头开始) |
| `Last-Event-ID` 超出缓冲 | 返回 410 Gone + `{error: "events_expired"}` |
| Session 不存在 | 返回 404 |
| 服务端 buffer 满 (LRU 淘汰) | 返回最早事件序号,客户端重新订阅 |
| 客户端 retry 3 次仍失败 | SDK 触发 onError,UI 显示手动重试按钮 |
| 并发重连 (用户开多 tab) | 每 tab 独立 lastEventId,各自续传 |

---

## 6. E2E 断言规划 (≥40)

| Section | 断言数 |
|---------|--------|
| 1. SDK 指数退避 (1s/2s/4s) | 8 |
| 2. SDK maxRetries 限制 | 6 |
| 3. Last-Event-ID header 传递 | 5 |
| 4. 服务端 EventBuffer append/replay | 8 |
| 5. 服务端 410 Gone 过期处理 | 6 |
| 6. ReconnectingBadge 组件 4 状态 | 8 |
| 7. 文件静态扫描 (关键 token) | 6 |
| **小计** | **47** |

---

## 7. 风险 & 对策

| 风险 | 对策 |
|------|------|
| 内存爆 (event buffer) | LRU 100 条/session + 总数上限 10000 |
| Last-Event-ID 时钟漂移 | 用单调递增整数,不用时间戳 |
| 多 tab 并发污染 | 每 tab 独立订阅,不共享 buffer |
| 缓冲被 evict 导致 410 | 客户端捕获 410 → 全量重跑 session |

---

## 8. 不在 Phase-32 范围

- ❌ 持久化到 Postgres (Phase-33)
- ❌ 跨服务器集群 event 共享 (Phase-33+)
- ❌ 压缩事件 payload (Phase-40+)
- ❌ 多 session 并发监控 UI 调整 (Phase-29 已完成)

---

> 🦞 **"断连无感 + 续传精确 + UI 透明 = Stream 生产级可用"**