# Phase-29 Tasks: 多 Session 并发监控仪表盘

## 任务列表

| ID | 任务 | 状态 | 提交 |
|----|------|------|------|
| T128 | view-model aggregator (`loadAgentDashboardSnapshot`) | ✅ | Phase-29 |
| T129 | `/agents/dashboard` 客户端组件 (`dashboard-client.tsx`) | ✅ | Phase-29 |
| T130 | E2E 50+ 断言脚本 (`phase29-e2e-dashboard.ts`) | ✅ | Phase-29 |
| T131 | retrospective + spec 落盘 | ✅ | Phase-29 |
| T132 | atomic commit | ✅ | Phase-29 |

## 子任务明细

### T128 view-model aggregator

- [x] 定义 `AgentDashboardSnapshot` 接口 (10 字段)
- [x] 实现 `loadAgentDashboardSnapshot` (Promise.all 并发 fetch)
- [x] fallback 路径独立计算 runningCount / completedCount / failedCount
- [x] totalConfigs = Set(configId).size
- [x] deliveryMode 标注 api / fallback

### T129 客户端组件

- [x] `'use client'` directive
- [x] `SessionLiveState` 接口设计
- [x] `emptyLiveState()` 初始化器
- [x] `subscribeStream` useCallback (单 session)
- [x] `useEffect` 并发订阅 (Promise.all)
- [x] cleanup 取消所有 stream
- [x] paused state (暂停订阅)
- [x] 16 个 data-testid 完整覆盖
- [x] StatCard 4 个 (运行中/已完成/失败/总会话)
- [x] SessionRow (StatusBadge + 进度条 + 步骤 + 事件数 + 详情链接)
- [x] Sortable by STATUS_RANK (RUNNING > PENDING > COMPLETED > FAILED > CANCELLED)

### T130 E2E 断言

- [x] Section 1: view-model aggregator 字段对齐 (8 断言)
- [x] Section 2: 多 session 并发 stream (10 断言)
- [x] Section 3: per-session 聚合 (6 断言)
- [x] Section 4: Session 列表排序 (3 断言)
- [x] Section 5: UI 静态扫描 (~40 断言,含 15 data-testid + 文案 + page.tsx)
- [x] Section 6: 边界场景 (8 断言)
- [x] Section 7: 并发 fetch + useEffect 依赖 (3 断言)
- [x] Section 8: fallback 字段完整性 (4 断言)
- **总计: 82 断言 / 0 fail**

### T131 文档

- [x] `spec.md`: 11 节 (目标/路由/范围/数据模型/View-model/UI/E2E/DR/文件/验收)
- [x] `retrospective.md`: 8 节 (目标/路径/DR/技术点/反模式/验证/文件/后续)
- [x] `tasks.md`: 当前文件

## 验收

```
$ npx tsx scripts/phase29-e2e-dashboard.ts

── 1. view-model aggregator 字段对齐 ──
── 2. 多 session 并发 stream ──
── 3. per-session 聚合 ──
── 4. Session 列表排序 ──
── 5. UI 静态扫描 ──
── 6. 边界场景 ──
── 7. 并发 fetch + useEffect 依赖 ──
── 8. fallback 字段完整性 ──

Phase-29 E2E 结果: 82 pass / 0 fail
✓ 全部断言通过
```

## 关键文件路径

- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/agents/dashboard/page.tsx`
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/agents/dashboard/dashboard-client.tsx`
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/agents/agent-view-model.ts` (loadAgentDashboardSnapshot)
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/phase29-e2e-dashboard.ts`