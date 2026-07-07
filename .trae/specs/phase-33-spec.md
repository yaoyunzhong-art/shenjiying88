# 🦞 Phase-33 Spec: EventStore 持久化 (Postgres changefeed)

> **Phase**: 33
> **优先级**: P0 (必做)
> **估时**: 2 天
> **负责人**: 🦞 openclaw (后台 Spec + 验收) / 🌲 树哥trae (前台实施)
> **前置依赖**: Phase-32 (Stream 重连 + Last-Event-ID) ✅
> **后续依赖**: Phase-34 (view-model 强制 tenantId)
> **状态**: 🟡 Spec 已出,等待 🌲 树哥trae 开工

---

## 1. 业务背景

Phase-32 解决了客户端重连问题,但服务端 EventBuffer 是**内存级**:
- 服务端重启 → 全部 session buffer 丢失
- 多实例部署 → 各实例独立 buffer, 用户跨实例断连重连无法续传
- 容量受限: 10000 session × 100 events = 100万事件上限

**Phase-33 目标**: 引入 Postgres changefeed,让事件:
1. **持久化**: 服务端重启不丢失
2. **跨实例共享**: 多 NestJS 实例共享同一份事件流
3. **可重放**: 历史 session 可任意时间点 replay
4. **容量扩展**: 摆脱内存限制

---

## 2. 验收标准 (AC)

### AC-1: 事件持久化
- [ ] 每个 AgentSessionEvent 写入 `agent_events` Postgres 表
- [ ] 表字段: id (uuid), session_id, event_type, event_id (int), payload (jsonb), created_at
- [ ] 写入失败不能阻塞 SSE 推送 (catch + log + 继续)

### AC-2: 跨实例共享
- [ ] NestJS 多实例部署时,任一实例写的事件,其他实例可查
- [ ] 通过 Postgres LISTEN/NOTIFY 通知新事件
- [ ] replay 端点查询 Postgres 而非内存

### AC-3: 服务端重启不丢失
- [ ] 模拟 kill -9 NestJS → 重启 → 验证 Phase-32 Last-Event-ID 续传仍能工作
- [ ] 历史事件从 Postgres 读, 不依赖内存

### AC-4: 接口兼容 (Phase-32 EventBufferService 不变)
- [ ] EventBufferService 接口保持不变
- [ ] 内部实现从 `Map` 切换到 `Map + Postgres` 双写
- [ ] replay 优先从 Postgres 查, fallback 内存

---

## 3. 数据库 Schema

### 3.1 表 `agent_events`

```sql
CREATE TABLE agent_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  event_id    BIGINT NOT NULL,           -- session 内单调递增 (Phase-32 id)
  event_type  TEXT NOT NULL,             -- session_started / message_added / ...
  tenant_id   TEXT NOT NULL,             -- 多租户隔离
  payload     JSONB NOT NULL,            -- 完整 AgentSessionEvent
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, event_id)
);

CREATE INDEX idx_agent_events_session_id ON agent_events (session_id, event_id);
CREATE INDEX idx_agent_events_tenant_id ON agent_events (tenant_id, created_at DESC);
```

### 3.2 NOTIFY 触发器

```sql
CREATE OR REPLACE FUNCTION notify_agent_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('agent_events', json_build_object(
    'session_id', NEW.session_id,
    'event_id', NEW.event_id,
    'event_type', NEW.event_type
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agent_events_notify
AFTER INSERT ON agent_events
FOR EACH ROW EXECUTE FUNCTION notify_agent_event();
```

---

## 4. 接口设计

### 4.1 EventStoreService (新建, 替代 EventBufferService 的持久化部分)

```typescript
// apps/api/src/modules/agent/event-store.service.ts (新建)
@Injectable()
export class EventStoreService {
  constructor(private readonly pgPool: Pool) {}

  /** 持久化事件到 Postgres */
  async persist(sessionId: string, event: BufferedEvent, tenantId: string): Promise<void>

  /** 从 Postgres 读取 lastEventId 之后的事件 */
  async loadAfter(sessionId: string, lastEventId: number): Promise<BufferedEvent[]>

  /** 查询 session 事件历史 (任意时间点) */
  async getSessionHistory(sessionId: string, limit?: number): Promise<BufferedEvent[]>

  /** LISTEN/NOTIFY 订阅 */
  subscribeChannel(onEvent: (sessionId: string, eventId: number) => void): () => void
}
```

### 4.2 EventBufferService 演进

不改接口,内部实现:
- `append()` → 双写: 内存 Map (热数据) + EventStore (持久化)
- `replayAfter()` → 优先查 EventStore, fallback 内存
- 内存 Map 仅保留最近 100 条/session 作为热缓存

---

## 5. 数据流 (持久化场景)

```
[Agent 推送事件]
  listener(event)
      │
      ├─→ eventBuffer.append(sessionId, event)  (内存 + 异步持久化)
      │       │
      │       ├─→ Map.set (同步, 热路径)
      │       └─→ eventStore.persist() (fire-and-forget)
      │               │
      │               ▼
      │           INSERT INTO agent_events
      │               │
      │               └─→ trigger notify_agent_event
      │                       │
      │                       ▼
      │                   pg_notify('agent_events', ...)
      │                       │
      │                       ▼
      │                   其他实例 EventStoreService.subscribeChannel
      │                       │
      │                       └─→ 推送 SSE 给订阅了该 session 的客户端
      │
      └─→ SSE 推送 (queueMicrotask)
```

---

## 6. 边界 & 异常

| 场景 | 行为 |
|------|------|
| Postgres 连接断开 | EventBuffer 退化为内存模式 (Phase-32 兼容), 后台重连 |
| persist 失败 | catch + log + 继续 (不阻塞 SSE), 加 metrics |
| NOTIFY 丢失 | 客户端重连时 replay 兜底 (Phase-32 已有) |
| 大 payload (>1MB) | 截断 + 警告 (避免 Postgres 性能) |
| 多实例写同一 session | Postgres UNIQUE (session_id, event_id) 约束保证幂等 |

---

## 7. E2E 断言规划 (≥40)

| Section | 断言数 |
|---------|--------|
| 1. Postgres 表 schema 存在 | 4 |
| 2. EventStore.persist 写入成功 | 6 |
| 3. EventStore.loadAfter 读取正确 | 6 |
| 4. EventBuffer 双写 (内存 + Postgres) | 6 |
| 5. 跨实例 NOTIFY (mock 模拟) | 6 |
| 6. 服务端重启不丢失 (mock 模拟) | 5 |
| 7. 接口兼容 (Phase-32 E2E 仍过) | 5 |
| 8. 静态扫描 (EventStore / persist / pg_notify) | 6 |
| **小计** | **44** |

---

## 8. 风险 & 对策

| 风险 | 对策 |
|------|------|
| Postgres 单点故障 | 生产环境用主从 + PgBouncer 池化 |
| NOTIFY 队列溢出 (>8GB) | 拆表按月 + 定期清理 |
| 持久化延迟影响 SSE | 异步 fire-and-forget, 不 await |
| 多租户数据泄露 | tenant_id 强制 + RLS policy |

---

## 9. 不在 Phase-33 范围

- ❌ RLS (Row-Level Security) 强制 → Phase-34
- ❌ CDC (Debezium / Logical Replication) → Phase-40+
- ❌ 事件压缩 / 归档 → Phase-40+
- ❌ 多 region 复制 → Phase-44

---

> 🦞 **"内存 → 持久化 = Stream 真正生产级"**