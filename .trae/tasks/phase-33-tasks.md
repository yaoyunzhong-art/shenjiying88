# 📋 Phase-33 Tasks: EventStore Postgres 持久化

> **Phase**: 33
> **负责人**: 🌲 树哥trae (前台实施) / 🦞 openclaw (后台验收)
> **总估时**: 8h
> **前置**: Phase-32 ✅

---

## T148 — pg 客户端 + 连接池 + schema migration (1.5h)

**目标**: 引入 pg 库 + 配置连接池 + 写 schema migration 脚本

**AC**:
- [ ] 安装 `pg` 和 `@types/pg`
- [ ] `apps/api/src/database/pg-pool.ts` 新建 (Pool 实例, max=10)
- [ ] `apps/api/src/database/migrations/001_agent_events.sql` 新建 (含表 + 索引 + 触发器)
- [ ] 启动时自动跑 migration (NestJS OnModuleInit)
- [ ] 配置: `POSTGRES_URL` 环境变量

**依赖**: 无 (前提是 Postgres 已部署)

**输出**: `pg-pool.ts` + `001_agent_events.sql` 共 80 行

---

## T149 — EventStoreService.persist / loadAfter (2h)

**目标**: 新建 `apps/api/src/modules/agent/event-store.service.ts`

**AC**:
- [ ] `@Injectable()` 类 EventStoreService
- [ ] `async persist(sessionId, event: BufferedEvent, tenantId)` → INSERT agent_events
- [ ] `async loadAfter(sessionId, lastEventId)` → SELECT ... ORDER BY event_id
- [ ] `async getSessionHistory(sessionId, limit)` → SELECT ... LIMIT
- [ ] INSERT 失败 → catch + log + 不 throw (fire-and-forget 兼容)
- [ ] 所有查询带 `tenant_id` 过滤 (多租户)

**依赖**: T148

**输出**: `event-store.service.ts` 100-120 行

---

## T150 — subscribeChannel (LISTEN/NOTIFY) (1.5h)

**目标**: EventStoreService 加实时通知订阅

**AC**:
- [ ] 启动时 `LISTEN agent_events` (OnModuleInit)
- [ ] 解析 NOTIFY payload (JSON: session_id, event_id, event_type)
- [ ] `subscribeChannel(callback)` 注册消费方
- [ ] 多消费方支持 (Map<sessionId, Set<callback>>)
- [ ] NOTIFY 解析失败 → catch + log (不 crash)

**依赖**: T149

**输出**: `event-store.service.ts` +50 行

---

## T151 — EventBufferService 双写改造 (1.5h)

**目标**: EventBufferService 内部从单写内存改为双写

**AC**:
- [ ] 注入 EventStoreService
- [ ] `append()` 同步写内存 + 异步 fire-and-forget 调 `eventStore.persist()`
- [ ] `replayAfter()` 优先查 `eventStore.loadAfter()`, fallback 内存
- [ ] Postgres 不可用时降级到纯内存 (try/catch + log)
- [ ] 公共接口不变 (Phase-32 E2E 仍过)

**依赖**: T149

**输出**: `event-buffer.service.ts` 修改 +30 行

---

## T152 — E2E 44 断言 + 兼容测试 + retro (1.5h)

**目标**: 写 `scripts/phase33-e2e-eventstore.ts` + 出 retro

**AC**:
- [ ] 44 断言全过 (Spec §7 表格)
- [ ] Phase-32 E2E (55 断言) 仍过 (接口兼容)
- [ ] Mock pg (用 in-memory mock 避免真实 Postgres 依赖)
- [ ] 出 `.trae/specs/phase-33-retro.md`
- [ ] atomic commit 锁定

**依赖**: T148-T151 全部完成

**输出**: E2E 脚本 250 行 + retro 80 行

---

## 📊 任务依赖图

```
T148 (pg + schema) ──→ T149 (persist/loadAfter) ──┬─→ T150 (LISTEN/NOTIFY) ─┐
                                                   │                         │
                                                   └─→ T151 (双写改造) ────┤
                                                                             ▼
                                                                  T152 (E2E + retro)
```

## 🎯 验收 checklist (🦞 openclaw)

- [ ] T148-T152 全部 commit 在 main 分支
- [ ] Phase-32 E2E 55 断言仍过
- [ ] Phase-33 E2E 44 断言新过
- [ ] Postgres 表 schema 与 DR-34 §4.1 一致
- [ ] 静态扫描命中 EventStore / pg_notify / persist / loadAfter token
- [ ] 模拟 Postgres 断开 → EventBuffer 降级到内存 (E2E 验证)

---

> 📋 **"5 任务 + 44 断言 + 8h 实施 = EventStore 持久化生产级"**