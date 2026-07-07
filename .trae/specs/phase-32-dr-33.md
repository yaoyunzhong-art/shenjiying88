# 🏛️ DR-33: Stream 重连 + Last-Event-ID 续传方案

> **编号**: DR-33
> **日期**: 2026-06-27
> **作者**: 🦞 openclaw (后台)
> **状态**: 🟡 待评审 (5 名网络专家)
> **影响范围**: Phase-32 (1 天) + Phase-33 (持久化扩展)

---

## 1. 背景

Phase-30 已实现 HTTP SSE 单向流式推送,但缺乏生产级断连恢复机制。
当前痛点: 任何网络抖动 / 服务端重启 / 客户端切后台,都会导致用户丢失中间事件。

---

## 2. 决策 (Decision)

采用 **"客户端 SDK 指数退避 + 服务端 Event Buffer + Last-Event-ID 续传"** 三件套方案。

---

## 3. 备选方案 (Alternatives)

### A. 客户端缓存 (无服务端 buffer)
- **机制**: 客户端本地缓存所有事件,重连后从本地 replay
- **优点**: 服务端零状态,实现简单
- **缺点**:
  - 多设备无法同步 (用户切设备看不到历史)
  - 客户端 OOM 风险
  - 重连时不知道服务端真实进度
- **否决**: 不符合 SaaS 多设备场景

### B. WebSocket + 双向心跳
- **机制**: 改用 WebSocket,客户端定期发心跳
- **优点**: 双向通信,可推送指令
- **缺点**:
  - 偏离 Phase-30 的 SSE 架构,大改
  - WebSocket 负载均衡复杂 (sticky session)
  - Phase-40 才需要双向,提前引入是 over-engineering
- **否决**: 时机不对,延后到 Phase-40

### C. 服务端 Event Buffer + Last-Event-ID (本次选择)
- **机制**: 服务端按 session 内存 buffer 最近 N 条事件 (默认 100),重连请求带 Last-Event-ID
- **优点**:
  - 兼容 SSE 架构,小改动
  - 多设备可独立续传
  - 实现相对简单 (1 个 service + 1 个 header)
- **缺点**:
  - 内存占用 (100 条/session × 10000 session = 100 万条 ≈ 200MB,可接受)
  - 服务端重启会丢 buffer (Phase-33 用 Postgres 解决)
- **选择理由**: 与 Phase-30 架构契合,实施成本低,后续可平滑演进到持久化

---

## 4. 详细方案

### 4.1 客户端 SDK 退避策略

```
attempt 1: delay 1000ms
attempt 2: delay 2000ms
attempt 3: delay 4000ms
attempt 4: 触发 onError (放弃)
```

公式: `delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)`

### 4.2 服务端 Event Buffer 数据结构

```typescript
type BufferedEvent = AgentSessionEvent & { id: number }

interface SessionBuffer {
  events: BufferedEvent[]      // 按 id 升序
  maxId: number                 // 当前最大 id
  createdAt: string
}

class EventBufferService {
  private buffers = new Map<string, SessionBuffer>()
  private readonly MAX_PER_SESSION = 100
  private readonly MAX_TOTAL_SESSIONS = 10000  // LRU 淘汰
}
```

### 4.3 SSE Chunk 格式扩展

```
id: 42
data: {"type":"step_progress","step":3,...}

```

(在原 `data:` 前加 `id:` 字段,符合 SSE 规范)

### 4.4 Last-Event-ID 过期处理

- 客户端发 `Last-Event-ID: 95`
- 服务端检查 buffer 中 `id=95` 是否存在
- 不存在 → 返回 `410 Gone` + JSON `{error: "events_expired", lastValidId: 88}`
- 客户端收到 410 → 全量重跑 session (用同一 `request.userInput`)

---

## 5. 后果 (Consequences)

### 5.1 正面
- ✅ 用户断连无感 (体验提升)
- ✅ 服务端可控 (内存 + LRU 保护)
- ✅ 演进路径清晰 (Phase-33 接 Postgres)

### 5.2 负面
- ⚠️ 内存增长 (需监控: 单实例 10000 session × 100 events × 1KB ≈ 1GB)
- ⚠️ 服务端重启丢 buffer (Phase-33 解决)
- ⚠️ LRU 淘汰可能误伤长 session (需监控告警)

### 5.3 中性
- 多 tab 并发: 每 tab 独立,各自续传 (符合预期)
- 跨设备续传: 设备 A 看到 id=42,设备 B 从 0 开始 (符合预期,因为 B 没 buffer)

---

## 6. 反模式 (Anti-patterns to Avoid)

- ❌ 用时间戳做 event id (时钟漂移风险)
- ❌ 全局共享 buffer (多租户串号风险)
- ❌ 无限制的 buffer 增长 (OOM)
- ❌ 客户端无限重试 (DoS 服务端)

---

## 7. 待评审专家

- [ ] 5 名"网络/性能"专家 (异步书面)
- [ ] 1 名 NestJS 架构师 (30 分钟视频)

---

## 8. 实施计划

| 任务 | 估时 | 状态 |
|------|------|------|
| T143 SDK 退避 | 2h | 待 🌲 开工 |
| T144 Event Buffer | 2h | 待 🌲 开工 |
| T145 SSE 集成 | 1.5h | 待 🌲 开工 |
| T146 ReconnectingBadge | 1.5h | 待 🌲 开工 |
| T147 E2E + 文档 | 1h | 待 🌲 开工 |
| **总计** | **8h** | |

---

## 9. 评审 checklist (🦞 openclaw 自查)

- [x] 与现有架构兼容 (SSE 扩展 id 字段)
- [x] 安全性 (无新增攻击面)
- [x] 可观测 (有 buffer size 监控点)
- [x] 可回滚 (新 service + header,可一次性 revert)
- [x] 文档齐全 (Spec + Tasks + DR 三件套)
- [x] 演进路径 (Phase-33 持久化已规划)

---

## 10. 决策记录

| 日期 | 决策 | 决策人 |
|------|------|--------|
| 2026-06-27 | 选定方案 C (Event Buffer + Last-Event-ID) | 🦞 openclaw |
| 待定 | 专家书面评审 | 5 网络专家 |
| 待定 | 大飞哥批准 | 大飞哥 |

---

> 🏛️ **"兼容 SSE + 服务端可控 + 演进清晰 = 生产级 Stream"**