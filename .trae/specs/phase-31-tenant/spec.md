# Phase-31 Spec: 多租户隔离 (Tenant Isolation)

## 1. 目标 (Why)

**核心缺口 (从 Meta-Retro 识别)**:
- `getStats(@Query('tenantId'))` tenantId 是可选参数,无强制注入
- `loadAgentDashboardSnapshot` 没传 tenantId,直接返回所有 sessions
- 跨租户可见 → 数据泄露风险

**Phase-31 目标**: 强制 tenantId 注入 + row-level filter,确保租户间数据隔离。

## 2. 范围 (What)

### 2.1 TenantGuard (NestJS Guard)

- **位置**: `apps/api/src/modules/agent/tenant.guard.ts`
- **行为**:
  - 读 `x-tenant-id` header (大小写兼容)
  - 缺失/空白 → 401 UnauthorizedException
  - 存在 → 写入 `request.tenantId` 供下游使用
- **回退**: query 参数 `?tenantId=xxx` 也接受

### 2.2 AgentService row-level filter

| 方法 | 改动 |
|------|------|
| `getConfigs(tenantId?)` | filter by tenantId |
| `getConfig(id, tenantId?)` | 检查 tenantId 一致 |
| `getSessions(tenantId?)` | filter by tenantId |
| `getSession(id, tenantId?)` | 检查 tenantId 一致 |
| `getEvaluations(tenantId?)` | filter by tenantId |
| `getStats(tenantId?)` | 已存在 |

向后兼容: 不传 tenantId 返回全量(避免破坏现有调用)。

## 3. 数据模型

无新增 entity,tenantId 已存在于所有 entity。

## 4. View-model

待 Phase-32: 在 admin-web 端注入 `x-tenant-id` header(从 cookie / config)。

## 5. UI

无 UI 改动 (后端 + 守卫改动)。

## 6. E2E 覆盖 (47 断言 / 0 fail)

### Section 1: TenantGuard 行为 (5 断言)
- 缺失 header → 401
- 空白 tenantId → 401
- 正常 → 注入 request.tenantId
- 大写 X-Tenant-Id 兼容
- query 兜底

### Section 2: AgentService row-level filter (10 断言)
- getConfigs 全量 / 过滤 / 跨租户
- getConfig 跨租户 / 不存在 / 向后兼容

### Section 3: getSessions 跨租户 (8 断言)
- 同 / 跨 / 不存在

### Section 4: getEvaluations 跨租户 (3 断言)

### Section 5: getStats 跨租户 (5 断言)

### Section 6: 端到端隔离 (2 断言)

### Section 7: 边界 (2 断言)
- 空字符串 / undefined tenantId → 返回全量 (向后兼容)

### Section 8: 文件静态扫描 (8 断言)

## 7. 架构决策 (DR)

### DR-30: TenantGuard 强制注入

**决策**: 用 NestJS Guard 在请求进入 controller 前强制检查 + 注入 tenantId。

### DR-31: 向后兼容无 tenantId

**决策**: `getX(tenantId?)` 不传时返回全量,避免破坏已有调用。前端 view-model 后续 phase 强制传 tenantId。

### DR-32: row-level filter 而非 column-level

**决策**: tenantId 过滤在 service 层 (`filter(s => s.tenantId === tenantId)`) 而非 SQL 层(暂未用 DB)。后续 phase 引入 DB 时,统一改为 `WHERE tenant_id = ?`。

## 8. 文件变更

| 文件 | 类型 | 行数 |
|------|------|------|
| `apps/api/src/modules/agent/tenant.guard.ts` | 新建 | 38 |
| `apps/api/src/modules/agent/agent.service.ts` | 修改 | +18 / -12 |
| `scripts/phase31-e2e-tenant.ts` | 新建 | 320 |

## 9. 验收

```bash
$ npx tsx --tsconfig=apps/api/tsconfig.json scripts/phase31-e2e-tenant.ts
Phase-31 E2E 结果: 47 pass / 0 fail
✓ 全部断言通过
```

## 10. 后续

- **Phase-32**: Stream 重连 + Last-Event-ID 续传
- **Phase-33**: EventStore 持久化
- **Phase-34**: view-model 强制从 cookie 注入 tenantId,端到端隔离验证