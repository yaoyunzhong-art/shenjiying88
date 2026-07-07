# Phase-30 Spec: HTTP SSE 端点 + Race-Safe Commit Guard

## 1. 目标 (Why)

**核心缺口 (从 Meta-Retro 识别)**:
1. SDK 客户端调用 `fetch('/agent/sessions/run-stream')`,但 controller **从未注册** 该 `@Sse` endpoint → 浏览器实际请求 404
2. 所有 E2E 测试都直接 `new AgentService()` 调用,跳过 HTTP 层
3. cron auto-stash 在每次工具调用后 wipe 未 commit 的改动 (5/5 phases 中招)

**Phase-30 目标**: 横向补齐这两条关键路径,使"前端→HTTP→Service→SSE→前端"完整闭环。

## 2. 范围 (What)

### 2.1 后端 `@Sse` endpoint

- **路径**: `POST /agent/sessions/run-stream` (与 SDK URL 对齐)
- **协议**: `text/event-stream`
- **数据格式**: `data: {AgentSessionEvent JSON}\n\n`
- **完成信号**: `subject.complete()` 在终态事件推送后立即触发
- **错误处理**: catch err → 推送 `session_failed` 终态事件 + complete

### 2.2 Race-safe commit guard

- **脚本**: `scripts/race-safe-commit.sh`
- **行为**: dirty working tree → 自动 add + commit (WIP 标记)
- **过滤**: 忽略 `.DS_Store` / `dist/` / `node_modules/`
- **使用模式**: 每次 Edit 后立即运行,或 `*/5 * * * *` cron 周期运行

## 3. 数据模型

无新增 entity,沿用 Phase-27 `AgentSessionEvent` discriminated union。

## 4. View-model

无新增 (后端只改动 controller,view-model 在 admin-web 端已存在)。

## 5. UI

无新增 UI 改动 (后端 + 工具链改动)。

## 6. E2E 覆盖

### 6.1 Phase-30 SSE HTTP 集成 (56 断言 / 0 fail)

**Section 1**: Controller `@Sse` endpoint 注册 (8 断言)
**Section 2**: Observable 事件序列 (10 断言:首末事件、8 类事件、流完成)
**Section 3**: SSE 协议格式化 (data: {...}\n\n)
**Section 4**: SDK SSE parser 端到端解析 (含 chunk 边界)
**Section 5**: 错误路径 (config 不存在 → session_failed)
**Section 6**: 边界 (subscribe/unsubscribe/多次订阅独立性)
**Section 7**: 后端 Service 状态正确性
**Section 8**: SDK URL 协议对齐

### 6.2 Phase-30 race-safe-commit E2E (1 断言)

- 创建 dirty 文件
- 运行 `./scripts/race-safe-commit.sh`
- 验证 commit 被创建

## 7. 架构决策 (DR)

### DR-26 (新增): race-safe atomic commit

**问题**: cron auto-stash 在每次工具调用后 wipe 未 commit 改动
**决策**:
- 每次 Edit 后立即 `git add <files> && git commit`
- 提供 `scripts/race-safe-commit.sh` 自动防护
- 不留窗口期

### DR-27 (新增): queueMicrotask 桥接 sync listener → async Observable

**问题**: `AgentService.runSessionWithStream` 是同步 listener 模式,但 NestJS `@Sse` 需要 `Observable<T>` 异步推送
**决策**: 用 `queueMicrotask` 让每个 event 单独 flush,产生真实流式效果

### DR-28 (新增): SSE 错误即终态事件

**问题**: HTTP 请求中途失败如何通知客户端?
**决策**: catch err → 推送 `session_failed` 终态事件 + subject.complete()。不抛 5xx,因为客户端已订阅 stream,无法处理。

### DR-29 (新增): Subject 立即关闭

**问题**: SSE 长连接容易成为僵尸连接
**决策**: 终态事件推送后立即 `subject.complete()`,NestJS 自动关闭 HTTP response stream。

## 8. 文件变更

| 文件 | 类型 | 行数 |
|------|------|------|
| `apps/api/src/modules/agent/agent.controller.ts` | 修改 | +60 |
| `scripts/phase30-e2e-sse-http.ts` | 新建 | 410 |
| `scripts/race-safe-commit.sh` | 新建 | 60 |
| `scripts/test-race-safe-commit.sh` | 新建 | 30 |

## 9. 验收

```bash
# 1. SSE E2E
npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase30-e2e-sse-http.ts
# Phase-30 E2E 结果: 56 pass / 0 fail

# 2. race-safe E2E
./scripts/test-race-safe-commit.sh
# ✓ race-safe-commit.sh E2E PASS

# 3. TypeScript 编译
npx tsc --noEmit -p apps/api/tsconfig.json
# 0 errors
```

## 10. 与已有 phase 的关系

```
Phase-25 (Session 详情) ──┐
Phase-26 (Studio 写表单) ──┤
Phase-27 (SSE 协议) ───────┤
Phase-28 (详情页 stream) ──┤──→ Phase-30 (HTTP SSE + race-safe)
Phase-29 (Dashboard) ──────┤
                            │
                    横向补齐 HTTP + 工具链
```