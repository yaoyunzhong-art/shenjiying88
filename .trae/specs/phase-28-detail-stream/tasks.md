# Phase-28 Tasks: Session 详情页接入 Stream

## T122: Phase-28 spec 文档 ✅

- [x] `.trae/specs/phase-28-detail-stream/spec.md` (160 行)
- [x] 目标: RUNNING 会话自动订阅 stream,实时增量更新 messages + 步骤进度

## T123: Session 详情页 RSC 改造为 hybrid ✅

- [x] 保持 RSC (page.tsx) 不变 — 服务端 fetch session/execution/evaluation/config
- [x] session-detail-client.tsx 增加:
  - 5 个 stream state: `streamEnabled / streamRunning / streamEvents / streamMessages / streamStep / streamStatus / streamError`
  - 1 个 ref: `streamCancelledRef`
  - 1 个 callback: `subscribeStream`
  - 1 个 useEffect: 自动订阅 + cleanup
  - 1 个 memo: `mergedMessages` (累积 seen 去重)

## T124: 客户端订阅 stream 增量更新 messages ✅

- [x] `mergedMessages` 累积去重(原 session.messages + stream 增量)
- [x] `effectiveStatus` 替换 session.status 用于 UI 显示
- [x] UI 状态条:`detail-stream-status` (🟢订阅中 / ✅历史快照 / ❌失败 / ⏸未订阅)
- [x] 进度条:`detail-stream-progress` (Phase-27 风格复用)
- [x] 事件计数:`detail-stream-event-count`
- [x] resubscribe 按钮:`detail-stream-resubscribe`
- [x] cancel 按钮:`detail-stream-cancel`

## T125: E2E 验证 + spec 落盘 ✅

- [x] `scripts/phase28-e2e-detail-stream.ts` 49 断言全过
  - Section 1 (后端 replay): 6
  - Section 2 (消息合并去重): 6
  - Section 3 (步骤进度): 6
  - Section 4 (终态事件): 5
  - Section 5 (UI 静态): 19
  - Section 6 (边界): 4
  - Section 7 (错误恢复): 4
  - Section 8 (view-model wrapper): 3
- [x] `.trae/specs/phase-28-detail-stream/{spec,tasks,retrospective}.md`

## T126: atomic commit ✅

- [x] commit 锁定 Phase-28 全部代码 + spec

## 验收清单

- [x] Session 详情页对 RUNNING 会话自动订阅 stream
- [x] 步骤进度条实时更新
- [x] 新消息自动追加到列表(累积去重)
- [x] 终态事件触发 UI 状态切换
- [x] E2E 49/49 全过
- [x] spec 文档落盘