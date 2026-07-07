# 🏛️ DR-34: EventStore Postgres 持久化方案

> **编号**: DR-34
> **日期**: 2026-06-27
> **作者**: 🦞 openclaw (后台)
> **状态**: 🟡 待评审 (5 名数据库专家)
> **影响范围**: Phase-33 (2 天)

---

## 1. 背景

Phase-32 EventBufferService 是内存级,无法满足:
- 服务端重启不丢失
- 多实例共享
- 历史 session 重放

---

## 2. 决策

采用 **"Postgres 直接持久化 + LISTEN/NOTIFY + EventBuffer 双写"** 方案。

---

## 3. 备选方案

### A. Redis Streams
- **优点**: 性能高,天然支持 consumer group
- **缺点**:
  - 多租户隔离需要额外设计
  - Redis 内存成本高
  - 持久化不如 Postgres 可靠
- **否决**: 当前无 Redis 基础设施,引入成本高

### B. Kafka / Pulsar (消息队列)
- **优点**: 高吞吐,持久化,消费组
- **缺点**:
  - 引入重组件,运维成本高
  - Phase-33 流量不大,过度设计
  - 多租户隔离需要 topic 拆分
- **否决**: 时机不对,延后到 Q3

### C. Postgres 表 + LISTEN/NOTIFY (本次选择)
- **优点**:
  - 无新组件,复用现有 Postgres 基础设施
  - JSONB 灵活存任意事件
  - LISTEN/NOTIFY 跨实例通知
  - 多租户天然支持 (tenant_id 字段)
- **缺点**:
  - NOTIFY 8GB 队列上限 (足够 Phase-33,长期需拆表)
  - 单实例写吞吐受 Postgres 限制 (预估 1000 events/s 够用)
- **选择理由**: 与 Phase-30/31/32 架构契合,零新依赖

### D. 内存 + 定时 checkpoint
- **优点**: 简单
- **缺点**: 重启仍丢最近 N 分钟数据
- **否决**: 不满足 AC-3

---

## 4. 详细方案

### 4.1 Schema (见 Spec §3.1)
- `agent_events` 表 + UUID 主键 + session 内 event_id 唯一
- 触发器 `notify_agent_event` 自动 pg_notify

### 4.2 EventStoreService
- 用 `pg` (node-postgres) 库
- 连接池 (max=10)
- `persist()`: INSERT ... RETURNING id, fire-and-forget
- `loadAfter()`: SELECT ... WHERE event_id > $1 ORDER BY event_id
- `subscribeChannel()`: LISTEN agent_events, parse payload JSON

### 4.3 EventBufferService 演进
- `append()`: 同步写内存 + 异步写 Postgres (Promise 不 await)
- `replayAfter()`: 先查 Postgres (覆盖历史), fallback 内存
- 接口不变 (Phase-32 E2E 不破)

### 4.4 错误降级
- Postgres 不可用 → EventBuffer 仅写内存, log warning, 后台重连
- 内存模式仍能服务, 只是失去持久化保证

---

## 5. 后果

### 5.1 正面
- ✅ 服务端重启不丢事件
- ✅ 多实例共享 (任一实例可 replay 任意 session)
- ✅ 历史可重放 (Q3 智能推荐基础)
- ✅ 多租户天然支持 (tenant_id + RLS 预留)

### 5.2 负面
- ⚠️ Postgres 单点 (生产需主从)
- ⚠️ 写延迟 (估计 +1ms)
- ⚠️ 8GB NOTIFY 队列 (需监控)

### 5.3 中性
- 需要 Postgres 已部署 (Q1 已规划)
- 需要 `pg` npm 包 (轻量)

---

## 6. 实施计划 (T148-T152, 估时 8h)

| Task | 估时 | 状态 |
|------|------|------|
| T148 pg 客户端 + 连接池 + schema migration | 1.5h | 待开工 |
| T149 EventStoreService.persist / loadAfter | 2h | 待开工 |
| T150 EventStoreService.subscribeChannel (LISTEN/NOTIFY) | 1.5h | 待开工 |
| T151 EventBufferService 双写改造 | 1.5h | 待开工 |
| T152 E2E 44 断言 + Phase-32 兼容测试 + retro | 1.5h | 待开工 |
| **总计** | **8h** | |

---

## 7. 反模式

- ❌ await persist 后再推 SSE (阻塞)
- ❌ Postgres 不可用时直接 throw (应降级到内存)
- ❌ 不带 tenant_id 写入 (违反 Phase-31 多租户)
- ❌ NOTIFY payload 包含完整事件 (用 event_id 让消费方查表)

---

## 8. 待评审专家

- [ ] 5 名 Postgres 专家 (书面)
- [ ] 1 名 SRE (30 分钟)

---

## 9. 决策记录

| 日期 | 决策 | 决策人 |
|------|------|--------|
| 2026-06-27 | 选定方案 C (Postgres + LISTEN/NOTIFY) | 🦞 openclaw |
| 待定 | 专家评审 | 5 Postgres 专家 |
| 待定 | 大飞哥批准 | 大飞哥 |

---

> 🏛️ **"Postgres 复用 + 双写兼容 + 降级兜底 = Stream 持久化生产级"**