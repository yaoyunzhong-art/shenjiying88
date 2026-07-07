# Phase-29 Retrospective: 多 Session 并发监控仪表盘

## 1. 目标达成

| 目标 | 状态 |
|------|------|
| `/agents/dashboard` 路由可访问 | ✅ |
| 多 session 聚合 view-model | ✅ (`loadAgentDashboardSnapshot`) |
| 实时统计卡片(运行中/已完成/失败/总会话) | ✅ |
| Session 列表 (StatusBadge + 进度条 + 步骤 + 时长 + 事件数) | ✅ |
| 多 session 并发 stream 订阅 | ✅ (Promise.all) |
| 一键跳转 `/agents/sessions/[id]` | ✅ |
| E2E 50+ 断言 | ✅ (82 断言) |
| spec 文档落盘 | ✅ |
| atomic commit 锁定 | ✅ |

## 2. 实施路径

1. **view-model 聚合器**: 新增 `loadAgentDashboardSnapshot`,使用 `Promise.all` 并发拉取 sessions + stats,fallback 路径独立计算 `runningCount / completedCount / failedCount`
2. **RSC 路由** `apps/admin-web/app/agents/dashboard/page.tsx`: 4 个 StatCard + 客户端组件
3. **客户端组件** `dashboard-client.tsx`: 425 行,含 SessionLiveState、并发订阅、cleanup 取消
4. **并发订阅模型**: 每个 RUNNING session 一个独立的 `cancelled` ref + `subscribeStream` Promise
5. **E2E 82 断言**: 多 session stream / 聚合 / 排序 / 静态扫描 / 边界 / cleanup / fallback

## 3. 架构决策 (DR)

### DR-21: 多 stream 并发而非串行

使用 `Promise.all(running.map(subscribe))`,不阻塞 UI,3 个 session 总耗时 < 5s。

### DR-22: cleanup useEffect 取消所有 stream

每个 stream 设独立的 `cancelled` ref,组件 unmount 时 `ref.cancelled = true` 中断 `for await` 循环。

### DR-23: stats 与 sessions 并发 fetch

`Promise.all([listSessions, getStats])` 减少首屏延迟 ~50%。

### DR-24: Session 卡片按 status 排序

`STATUS_RANK = { RUNNING: 0, PENDING: 1, COMPLETED: 2, FAILED: 3, CANCELLED: 4 }`,运营优先看运行中。

### DR-25: paused state 暂停订阅

新增 `paused` state,允许运营暂停所有 stream 订阅(避免后台噪声),切换时触发 useEffect 重订阅。

## 4. 关键技术点

### 4.1 多 stream 订阅状态管理

每个 session 独立的 `cancelToken` + `liveState[sessionId]` 局部 state,避免单 session 失败污染其他。

### 4.2 useEffect 依赖

`sessions.map((s) => \`${s.id}:${s.status}\`).join(',')` 作为依赖,只在 session 列表/状态变化时重订阅。

### 4.3 事件计数

`stats.totalEvents = sum(liveState[id].events.length)`,实时显示已接收事件总数。

## 5. 反模式 & 教训

### 5.1 Edit 被 cron auto-stash wipe

第一次 Edit 添加 `loadAgentDashboardSnapshot` 时,被 cron auto-stash 完整 wipe,需重新 Edit。这暴露了:
- **必须 Edit 后立即 atomic commit**,不留窗口期
- **不要把多个 Edit 攒在一起 commit**

### 5.2 type spread 推断问题

`setLiveState((prev) => ({ ...prev, [session.id]: { ...cur, ...partial } }))` 中,partial 字段导致 TS 推断为 `SessionLiveState | partial`,破坏 Record 签名。

**修复**: 显式标注 `const next: SessionLiveState = { ...cur, ...partial }; return { ...prev, [session.id]: next };`

### 5.3 mock 数据校验

测试中"0 running session"的 mock 断言需要先过滤掉 RUNNING,否则 `filter(RUNNING)` 返回的就是 RUNNING。逻辑要清晰。

## 6. 验证清单

- [x] `npx tsx scripts/phase29-e2e-dashboard.ts` 82 pass / 0 fail
- [x] page.tsx 使用 `loadAgentDashboardSnapshot`
- [x] dashboard-client.tsx 'use client' + 16 个 data-testid
- [x] 多 stream 并发订阅模型 (Promise.all)
- [x] cleanup 取消所有 stream
- [x] fallback 字段完整性

## 7. 文件变更

| 文件 | 行数 | 变更 |
|------|------|------|
| `apps/admin-web/app/agents/agent-view-model.ts` | +55 | +loadAgentDashboardSnapshot |
| `apps/admin-web/app/agents/dashboard/page.tsx` | 75 | 新建 RSC |
| `apps/admin-web/app/agents/dashboard/dashboard-client.tsx` | 425 | 新建 client UI |
| `scripts/phase29-e2e-dashboard.ts` | 410 | 新建 E2E |
| `.trae/specs/phase-29-dashboard/{spec,tasks,retrospective}.md` | 3 文档 |

## 8. 后续方向 (Phase-30+)

- **Phase-30**: 多租户隔离(tenant 过滤)
- **Phase-31**: Session cancel / pause (需 SSE endpoint 持久化)
- **Phase-32**: Dashboard 实时聚合(DB + WebSocket)
- **Phase-33**: 时间线可视化 / 火焰图
- **Phase-34**: 告警集成(失败 > 阈值时通知)