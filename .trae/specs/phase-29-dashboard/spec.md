# Phase-29 Spec: 多 Session 并发监控仪表盘

## 1. 目标

让运营/管理员在一个页面看到**所有 Agent 会话的实时状态**,包括:
- RUNNING 会话的实时步骤进度(复用 Phase-27/28 stream)
- COMPLETED / FAILED 会话的统计摘要
- 一键跳转 Session 详情
- 多 session 并发 stream 订阅(每个 RUNNING session 一个独立 stream)

## 2. 路由

新增 `/agents/dashboard`(admin-web),聚合所有 sessions 状态。

## 3. 范围

### 包含
- 多 session 聚合 view-model (`loadAgentDashboardSnapshot`)
- 并发 stream 订阅(N 个 RUNNING → N 个 stream)
- 实时统计卡片(总数 / 运行中 / 成功 / 失败 / 平均步骤 / 平均耗时)
- Session 列表 (StatusBadge + 进度条 + 步骤数 + 时长)
- 一键跳转 `/agents/sessions/[id]`
- E2E 50+ 断言

### 不包含
- 多租户隔离(沿用 tenantId 过滤,Phase-30)
- Session cancel / pause(Phase-31, 需 SSE endpoint)
- DB 持久化(Phase-32)
- 时间线可视化(Phase-33)

## 4. 数据模型

### DashboardSnapshot

```typescript
export interface AgentDashboardSnapshot {
  deliveryMode: 'api' | 'fallback';
  sessions: AgentSession[];
  runningCount: number;
  completedCount: number;
  failedCount: number;
  avgSteps: number;
  avgDurationMs: number;
  totalConfigs: number;
  totalExecutions: number;
  timestamp: string;
  error?: string;
}
```

### Per-session live state (客户端)

```typescript
interface SessionLiveState {
  sessionId: string;
  events: AgentSessionEvent[];
  latestStep: { current: number; max: number } | null;
  messageCount: number;
  status: AgentSessionStatus;
  error: string | null;
}
```

## 5. View-model 聚合

```typescript
export async function loadAgentDashboardSnapshot(init?: RequestInit): Promise<AgentDashboardSnapshot> {
  try {
    const client = createAgentClient();
    const [sessions, stats] = await Promise.all([
      client.listAgentSessions(init),
      client.getAgentStats(init)
    ]);
    return {
      deliveryMode: 'api',
      sessions,
      runningCount: stats.runningSessions,
      completedCount: stats.completedSessions,
      failedCount: stats.failedSessions,
      avgSteps: stats.avgSteps,
      avgDurationMs: stats.avgDurationMs,
      totalConfigs: sessions.length > 0 ? new Set(sessions.map(s => s.configId)).size : 0,
      totalExecutions: stats.totalSessions,
      timestamp: stats.timestamp
    };
  } catch {
    // fallback: FALLBACK_AGENT_SESSIONS
    return {
      deliveryMode: 'fallback',
      sessions: FALLBACK_AGENT_SESSIONS,
      runningCount: FALLBACK_AGENT_SESSIONS.filter(s => s.status === 'RUNNING').length,
      // ...
    };
  }
}
```

## 6. 客户端并发 stream

```typescript
useEffect(() => {
  const running = snapshot.sessions.filter(s => s.status === 'RUNNING');
  const controllers = running.map(session => subscribeToSession(session));
  return () => {
    controllers.forEach(c => c.cancel());
  };
}, [snapshot.sessions.map(s => s.id).join(',')]);
```

每个 RUNNING session 一个独立 `subscribeStream` Promise,通过 `Promise.all` 并发订阅。

## 7. UI 结构

```
┌──────────────────────────────────────────────────┐
│  Agent 实时监控仪表盘 (Phase-29)                 │
│  [运行中 3] [已完成 12] [失败 2] [平均 4.2 步]   │
├──────────────────────────────────────────────────┤
│  Session 列表:                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ 🟢 sess-001 | default-agent-v1            │    │
│  │ ████████░░░░ 步骤 3/5 | 12 事件           │    │
│  │ 起始: 14:23:01 | 用户: user-001           │    │
│  │                              [详情 →]      │    │
│  └──────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────┐    │
│  │ ✅ sess-002 | default-agent-v1            │    │
│  │ 步骤 5/5 | 总耗时 5230ms                   │    │
│  │                              [详情 →]      │    │
│  └──────────────────────────────────────────┘    │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

## 8. E2E 覆盖 (预计 50 断言)

| Section | 断言 |
|---------|------|
| 1. view-model aggregator | 12 |
| 2. 多 session 并发 stream | 8 |
| 3. 统计卡片 | 6 |
| 4. Session 列表渲染 | 8 |
| 5. UI 静态扫描 (testid) | 12 |
| 6. 边界 (0 running / 全失败) | 4 |
| **合计** | **50** |

## 9. 架构决策 (DR)

### DR-21: 多 stream 并发而非串行

使用 `Promise.all(running.map(subscribe))`,不阻塞 UI。

### DR-22: cleanup useEffect 取消所有 stream

每个 stream 设独立的 `cancelled` ref,组件 unmount 时全部 cancel。

### DR-23: stats 与 sessions 并发 fetch

`Promise.all([listSessions, getStats])` 减少首屏延迟。

### DR-24: Session 卡片按 status 排序

RUNNING > PENDING > COMPLETED > FAILED > CANCELLED,运营优先看运行中。

## 10. 文件变更

| 文件 | 变更 |
|------|------|
| `apps/admin-web/app/agents/agent-view-model.ts` | +60 行 (loadAgentDashboardSnapshot) |
| `apps/admin-web/app/agents/dashboard/page.tsx` | 新建 (~25 行 RSC) |
| `apps/admin-web/app/agents/dashboard/dashboard-client.tsx` | 新建 (~280 行) |
| `scripts/phase29-e2e-dashboard.ts` | 新建 (~400 行) |
| `.trae/specs/phase-29-dashboard/{spec,tasks,retrospective}.md` | 3 文档 |

## 11. 验收清单

- [ ] `/agents/dashboard` 路由可访问
- [ ] 统计卡片正确显示 4 个指标
- [ ] Session 列表渲染所有 sessions
- [ ] RUNNING session 自动订阅 stream
- [ ] 多 stream 并发不阻塞
- [ ] useEffect cleanup 取消所有 stream
- [ ] E2E 50+ 断言全过
- [ ] spec 文档落盘
- [ ] atomic commit 锁定 Phase-29