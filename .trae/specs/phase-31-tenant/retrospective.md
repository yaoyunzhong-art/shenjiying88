# Phase-31 Retrospective: 多租户隔离

## 1. 目标达成

| 目标 | 状态 |
|------|------|
| TenantGuard 强制 tenantId 注入 | ✅ |
| AgentService row-level filter (5 个方法) | ✅ |
| 跨租户隔离验证 | ✅ (47 断言) |
| 向后兼容 (无 tenantId 返回全量) | ✅ |
| spec + retro 落盘 | ✅ |

## 2. 实施路径

1. **T139 TenantGuard**: NestJS `CanActivate` 实现,缺失抛 401,写入 `request.tenantId`
2. **T140 row-level filter**: 5 个 service 方法支持 `tenantId?` 可选参数
3. **T141 E2E**: 8 section × 47 断言
4. **T142 文档**: spec.md + retrospective.md + tasks.md

## 3. 架构决策 (DR-30 → DR-32)

### DR-30: TenantGuard 强制注入

**决策**: NestJS Guard 在请求进入 controller 前检查 + 注入,无需 controller 改动。

### DR-31: 向后兼容无 tenantId

**决策**: `getX(tenantId?)` 不传时返回全量。理由: 已有调用方(view-model、单测)不传 tenantId,直接抛错会破坏回归。

### DR-32: row-level filter 而非 column-level

**决策**: service 层 `.filter()` 实现,后续 phase 引入 DB 时迁移到 SQL `WHERE`。

## 4. 反模式 & 教训

### 4.1 cron auto-stash 再次 wipe `getEvaluations` 改动

**事实**: 我在 step 2 改了 `getEvaluations(tenantId?)` 但被 cron wipe,直到 step 4 重新应用才发现。

**修复**: 每步都 git status + atomic commit 锁定。

### 4.2 E2E 默认数据冲突

**事实**: AgentService constructor 预加载 3 个默认 config (`tenant-demo`),我新建的 4 个测试 config 让总数变 7。我的断言 `length === 4` 失败。

**修复**: 改用 `>=` 比较 + tenant-specific filter (tenant-A 只看到自己 2 个)。

### 4.3 mockContext 引用丢失

**事实**: 第一次 E2E 的 mockContext 每次新建 request 对象,Guard 修改后外部看不到 `req.tenantId`。

**修复**: mockContext 接受外部 req 引用,guard 写入后外部能读到。

## 5. 验证清单

- [x] `npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase31-e2e-tenant.ts` → 47 pass / 0 fail
- [x] TenantGuard 4 种情况 (缺失/空白/正常/大小写)
- [x] AgentService 5 方法 tenantId filter
- [x] 跨租户隔离 (tenant-A 看不到 tenant-B)
- [x] 同租户可见
- [x] 向后兼容 (无 tenantId → 全量)

## 6. 文件变更

| 文件 | 类型 | 行数 | Commit |
|------|------|------|--------|
| `apps/api/src/modules/agent/tenant.guard.ts` | 新建 | 38 | step 1 |
| `apps/api/src/modules/agent/agent.service.ts` | 修改 | +18/-12 | step 2+4 |
| `scripts/phase31-e2e-tenant.ts` | 新建 | 320 | step 3+5 |

## 7. 后续 (Phase-32+)

| 主题 | 优先级 |
|------|--------|
| Stream 重连 + Last-Event-ID | P1 |
| view-model 注入 cookie tenantId | P1 |
| EventStore 持久化 | P1 |
| SQL 层 row-level filter (Postgres) | P2 |

## 8. 团队协作要点

1. **新增 entity 时强制 tenantId**: 实体设计模板化
2. **controller 默认应用 TenantGuard**: 通过 module-level APP_GUARD
3. **view-model 强制 header**: cookie → header 注入中间件
4. **E2E 必须含跨租户断言**: 防止回归