# Phase-30 Retrospective: HTTP SSE + Race-Safe Commit

## 1. 目标达成

| 目标 | 状态 |
|------|------|
| 后端 `@Sse('sessions/run-stream')` endpoint 注册 | ✅ |
| Observable<SseMessageEvent> 异步推送 | ✅ (queueMicrotask 桥接) |
| SSE 协议格式 `data: {...}\n\n` | ✅ |
| 错误路径 → session_failed 终态 | ✅ |
| Subject.complete() 立即关闭 | ✅ |
| Race-safe commit guard 脚本 | ✅ (60 行 bash) |
| E2E 50+ 断言 | ✅ (56 pass / 0 fail) |
| race-safe E2E | ✅ (PASS) |
| spec + retro 落盘 | ✅ |
| atomic commit | ✅ |

## 2. 实施路径

1. **T133 Meta-Retro**: 2 天复盘,识别 5 大反模式 + 优化 Phase-30+ 路线图
2. **T135 HTTP SSE**: `@Sse('sessions/run-stream')` + queueMicrotask 桥接 sync listener
3. **T136 E2E**: 8 section × 56 断言,覆盖 endpoint / Observable / 协议 / parser / 错误 / 边界 / service / SDK 对齐
4. **T137 race-safe**: `scripts/race-safe-commit.sh` 自动 add + commit + 噪声过滤
5. **T138 文档**: spec.md + retrospective.md + tasks.md

## 3. 关键架构决策 (DR-26 → DR-29)

### DR-26: race-safe atomic commit

**问题**: cron auto-stash 在每次工具调用后 wipe 未 commit 改动 (5/5 phases 中招,Phase-29 实际遭遇 2 次 Edit wipe)

**决策**:
- 每次 Edit 后立即 `git add <files> && git commit`
- `scripts/race-safe-commit.sh` 自动化防护
- 不留窗口期

### DR-27: queueMicrotask 桥接 sync listener → async Observable

**问题**: `AgentService.runSessionWithStream` 是同步 listener 模式,但 NestJS `@Sse` 需要 `Observable<T>` 异步推送

**决策**: 用 `queueMicrotask` 让每个 event 单独 flush,产生真实流式效果

```typescript
queueMicrotask(() => {
  try {
    this.agentService.runSessionWithStream(request, (event) => {
      queueMicrotask(() => subject.next({ data: event }))
    })
    queueMicrotask(() => subject.complete())
  } catch (err) {
    subject.next({ data: { type: 'session_failed', ... } })
    subject.complete()
  }
})
```

### DR-28: SSE 错误即终态事件

**问题**: HTTP 请求中途失败如何通知客户端?

**决策**: catch err → 推送 `session_failed` 终态事件 + subject.complete()。不抛 5xx,因为客户端已订阅 stream,无法处理。

### DR-29: Subject 立即关闭

**问题**: SSE 长连接容易成为僵尸连接

**决策**: 终态事件推送后立即 `subject.complete()`,NestJS 自动关闭 HTTP response stream。

## 4. 反模式 & 教训

### 4.1 cron auto-stash wipe 再次中招

**事实**: 本 Phase 中:
- Phase-30 step 1 (controller @Sse) → 第一次 Edit 被 wipe,需重新 Edit + atomic commit
- Phase-30 step 2 (E2E) → 被 wipe 多次,需 atomic commit 锁定
- Phase-30 step 3 (E2E 修复) → 同样被 wipe

**结论**: race-safe-commit.sh 是必须的工具,但本 phase 编写时还没就绪。下次必须先 commit race-safe 脚本再 commit 其他改动。

### 4.2 SDK SSE parser 字符串匹配 bug

**事实**: 第一次 E2E 断言 "SDK 期望 `data: {...}\\n\\n` 格式" 失败,因 SDK 实际没有这个确切字符串。

**修复**: 改用 `sdkSrc.includes('data: ')` 或 `sepIdx = buffer.indexOf('\\\\n\\\\n')` 等具体代码片段匹配。

**教训**: E2E 静态扫描断言应匹配**实际代码 token**,不要构造看起来合理的伪字符串。

### 4.3 reflection_started 测试对象错误

**事实**: 第一次 E2E 断言 `types.includes('reflection_started')` 失败,因 `collectedEvents` 来自 `enableReflection: false` 的 stream,而 reflection 只在 `enableReflection: true` 时发射。

**修复**: 创建独立的 reflection-enabled stream subscription。

**教训**: E2E 中的 state 不要复用,每种条件用独立 subscription。

## 5. 验证清单

- [x] `npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase30-e2e-sse-http.ts` → 56 pass / 0 fail
- [x] `./scripts/test-race-safe-commit.sh` → PASS
- [x] controller @Sse endpoint 注册
- [x] Subject.complete() 触发
- [x] catch err 推送 session_failed
- [x] 多 subscription 独立 session.id
- [x] SDK URL `/agent/sessions/run-stream` 与 controller `'sessions/run-stream'` 对齐
- [x] race-safe-commit.sh 过滤 .DS_Store / dist/ / node_modules/

## 6. 文件变更

| 文件 | 类型 | 行数 | Commit |
|------|------|------|--------|
| `apps/api/src/modules/agent/agent.controller.ts` | 修改 | +60 | step 1 |
| `scripts/phase30-e2e-sse-http.ts` | 新建 | 410 | step 2 |
| `scripts/race-safe-commit.sh` | 新建 | 60 | T137 |
| `scripts/test-race-safe-commit.sh` | 新建 | 30 | T137 |
| `.trae/specs/meta-retro-2days.md` | 新建 | 200 | T133 |
| `.trae/specs/phase-30-http-sse/{spec,tasks,retrospective}.md` | 新建 | 3 文档 | T138 |

## 7. 与之前 Phase 的差距

### Phase-25-29 缺失

- ❌ HTTP SSE endpoint (Phase-30 补齐)
- ❌ race-safe automation (Phase-30 补齐)
- ❌ SDK ↔ controller URL 一致性验证 (Phase-30 补齐)

### Phase-31+ 待办 (从 Meta-Retro)

- 🟡 多租户隔离 (TenantGuard + row-level filter)
- 🟡 Stream 重连 (指数退避 + Last-Event-ID)
- 🟡 EventStore 持久化 (Postgres append-only)
- 🟡 时间线可视化 (火焰图)

## 8. 后续方向 (Phase-31+)

| Phase | 主题 | 优先级 |
|-------|------|--------|
| 31 | Tenant 隔离 (强制 row-level filter) | P0 |
| 32 | Stream 重连 + Last-Event-ID 续传 | P1 |
| 33 | EventStore 持久化 (Postgres) | P1 |
| 34 | 时间线 / 火焰图 | P2 |

## 9. 团队协作要点

1. **每个 phase 必须有 race-safe 防护**: 不依赖 cron 关闭,主动 commit
2. **E2E 静态扫描用实际代码 token**: 不要构造伪字符串
3. **state 复用需谨慎**: 不同条件用独立 subscription
4. **HTTP 层必须 E2E**: 不能只测 service 层

## 10. Phase-30 闭环

✅ **完整闭环**: spec → code → E2E → race-safe → retro → atomic commit

✅ **横向补齐**: 解决了 Meta-Retro 识别的 #1 (HTTP SSE) 和 #2 (race-safe) 关键缺口

✅ **生产就绪**: 浏览器 SSE 请求现在真正可达 (`/agent/sessions/run-stream`),不再 404