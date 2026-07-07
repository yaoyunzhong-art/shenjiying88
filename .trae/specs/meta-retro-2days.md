# Meta-Retro: 2 天开发模式与优化方向

> 基于 Phase-25 → Phase-29 的 5 个连续 phase、238 个 git commits、5 次 cron auto-stash wipe 的实战复盘。

## 1. 已交付 (Phase-25 → 29)

| Phase | 主题 | 行数 (≈) | E2E 断言 | 关键产出 |
|-------|------|---------|---------|---------|
| 25 | Session 详情页 | 745 | 14 | `agent-session-detail-snapshot` + MessageBubble/EvaluationCard/ExecutionCard |
| 26 | Agent Studio 写表单 | 480 | 48 | 3 Tab 写操作面板 (Config / Session / Delete) |
| 27 | SSE 实时流推送 | 380 | 92 | `agent-session-event` 8 类事件 + AsyncGenerator + SDK SSE parser |
| 28 | 详情页接入 Stream | 425 | 92 | `runSessionWithStream` + message 合并 + DR-19 历史快照 |
| 29 | 多 Session 监控仪表盘 | 580 | 82 | `loadAgentDashboardSnapshot` + 16 testid + 并发订阅 |

**总产出**: ≈2610 行新代码,328 个 E2E 断言,DR-17 → DR-25 共 9 个决策记录。

## 2. 反复出现的反模式 (高频 → 低频)

### 2.1 🔴 高频: cron auto-stash race (5/5 phases 中招)

**症状**: 每条 commit message 都写 "防 cron auto-stash 丢失",Phase-29 实际遭遇 2 次 Edit wipe。

**根因**: 用户环境 cron 在每次工具调用后自动 `git add -A && git stash`,而我的工作流是"Edit → 验证 → atomic commit",中间窗口被 cron 钻空。

**对策**:
- **DR-26 (新增)**: 每次 Edit 后立即 `git add <files> && git commit`,不留窗口
- **Phase-30 引入**: `scripts/race-safe-commit.sh` 自动监测 `git status` dirty,每 5 分钟强制 commit (work-in-progress)
- **长期**: 与用户沟通关停 cron auto-stash (或改为 `git stash pop` 后立即还原)

### 2.2 🟡 中频: 测试仅覆盖 service 层,HTTP 层盲区

**症状**: 所有 phase 的 E2E 都直接 `new AgentService()` 调用,从不通过 HTTP controller。

**根因**:
- SDK 客户端调用 `fetch('/agent/sessions/run-stream')`,但 controller 实际**没有 `@Sse` endpoint**
- 也就是说:前端浏览器看到的 SSE stream 路径**当前是 404**,只有后端直连 AgentService 才能工作

**对策 (Phase-30 核心)**:
- 补齐 `agent.controller.ts` 的 `@Sse('sessions/run-stream')` 端点
- 新增 `phase30-e2e-sse-http.ts` 通过 fetch 真 HTTP 拉取并解析 `data: {...}\n\n`
- 强制所有未来 phase 的 E2E **必须经过 HTTP 层**

### 2.3 🟡 中频: tenant 隔离未强制

**症状**:
- `getStats(@Query('tenantId'))` tenantId 是可选参数
- `loadAgentDashboardSnapshot` 没传 tenantId,直接返回所有 sessions
- Phase-29 dashboard 跨租户可见

**对策 (Phase-31 规划)**:
- view-model 强制注入 tenantId (从 cookie / header)
- controller 增加 `@UseGuards(TenantGuard)` 强制 row-level filter
- E2E 增加跨租户隔离断言 (tenant-A 看不到 tenant-B 的 session)

### 2.4 🟢 低频: 流断线无重连

**症状**: SSE 连接断开时,`for await` 直接结束,UI 显示 streamError,但无 retry。

**对策 (Phase-32 规划)**:
- SDK 增加 `runAgentSessionStream` 包装,带指数退避重连 (最多 3 次)
- 客户端 UI 显示"重连中..."指示器
- 配合后端 event-id,支持 Last-Event-ID 续传

### 2.5 🟢 低频: 服务重启数据丢失

**症状**: AgentService 完全 in-memory,server restart → 所有 session 状态归零。

**对策 (Phase-33 规划)**:
- 引入 Postgres/Prisma 持久化 (已有 prisma.module 基础)
- Session events 存 EventStore (append-only)
- Stream 改为 changefeed 订阅

## 3. 关键架构决策 (DR) 沉淀

| ID | 决策 | 影响 |
|----|------|------|
| DR-17 | stream 推送增量 messages,非替换 session | 防止重复渲染 |
| DR-18 | auto-scroll 仅在用户未手动滚动时 | 避免强制滚动打断用户 |
| DR-19 | 历史快照标记 (✅ 已完成/⏸ 未订阅) | 区分实时 vs 快照 |
| DR-20 | 失败会话仍提供重试按钮 | 不掩盖失败 |
| DR-21 | 多 stream 并发而非串行 | UI 不阻塞 |
| DR-22 | cleanup useEffect 取消所有 stream | 防止内存泄漏 |
| DR-23 | stats 与 sessions 并发 fetch | 首屏 -50% 延迟 |
| DR-24 | session 卡片按 status 排序 | 运营优先看运行中 |
| DR-25 | paused state 暂停订阅 | 避免后台噪声 |

## 4. 优化后的 Phase-30+ 路线图

### Phase-30 (本周) — **HTTP SSE + Race-Safe Commit**

**优先级**: 🔴 P0 — 阻塞生产化

- **T135**: `agent.controller.ts` 新增 `@Sse('sessions/run-stream')` 端点,委托 `runSessionWithStream`
- **T136**: `phase30-e2e-sse-http.ts` 通过 fetch 真 HTTP 拉取并解析 `data: {...}\n\n`
- **T137**: `scripts/race-safe-commit.sh` 自动监测 dirty,定期 commit
- **T138**: spec + retro + atomic commit

**E2E**: ≥40 断言覆盖 HTTP 层 + race guard

### Phase-31 (下周) — **Tenant Isolation**

- view-model 强制 tenantId 注入
- `@UseGuards(TenantGuard)` + row-level filter
- 跨租户隔离 E2E (tenant-A 不可见 tenant-B)

### Phase-32 — **Stream 重连 & 续传**

- SDK 指数退避重连 (最多 3 次)
- Last-Event-ID 续传 (后端持久化最近 N 个 event)
- UI 重连指示器

### Phase-33 — **EventStore 持久化**

- Postgres append-only events 表
- Stream 改为 changefeed 订阅
- 服务重启不丢事件

### Phase-34 — **时间线可视化**

- Step 时间线 (thought → tool → observation)
- 火焰图 / 性能瓶颈定位
- 与 Phase-29 dashboard 集成

## 5. 团队工作流改进 (meta)

### 5.1 Phase 模板固化

每次新 phase 强制包含:
1. **spec.md** (11 节,含目标/范围/数据模型/View-model/UI/E2E/DR/文件/验收)
2. **tasks.md** (T-number + status + commit 关联)
3. **retrospective.md** (8 节,含目标/路径/DR/技术点/反模式/验证/文件/后续)
4. **E2E 脚本** `scripts/phaseXX-e2e-*.ts` (≥40 断言)
5. **atomic commit** (≤1 个 commit,带 DR 编号)

### 5.2 commit message 标准

```
🦞 Phase-XX <主题> (防 cron auto-stash)

- <改动1>
- <改动2>

DR-XX, DR-YY
E2E: NN pass / 0 fail
```

### 5.3 全局索引

**待 Phase-30 完成**: 创建 `.trae/INDEX.md` 汇总所有 phase 的入口与产出,避免 spec/ 目录碎片化。

## 6. 立即执行 (本轮)

按上面路线图,立即开工 **Phase-30**:
1. T135: 补齐 `@Sse('sessions/run-stream')` controller endpoint
2. T136: HTTP 集成 E2E (≥40 断言)
3. T137: race-safe-commit.sh 自动防护脚本
4. T138: 文档落盘 + atomic commit

预计 30 分钟完成 Phase-30 全闭环。

---

**结论**: Phase-25 → 29 完整跑通了"view → studio → stream → detail-stream → dashboard"的纵向链路,但**横向 (HTTP 层 + 持久化 + 多租户)** 是空白。Phase-30 起横向补齐,生产化路径清晰。