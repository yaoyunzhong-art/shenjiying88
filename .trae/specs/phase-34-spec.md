# 🦞 Phase-34 Spec: view-model 强制 tenantId + Postgres RLS

> **Phase**: 34
> **优先级**: P0 (P0 路线图最后一项)
> **估时**: 1.5 天
> **负责人**: 🦞 openclaw (后台 Spec + 验收) / 🌲 树哥trae (前台实施)
> **前置依赖**: Phase-31 (TenantGuard) ✅ + Phase-33 (EventStore) ✅
> **后续依赖**: Phase-35 (收银业务, 租户数据基础)
> **状态**: 🟡 Spec 已出,等待 🌲 树哥trae 开工

---

## 1. 业务背景

Phase-31 已实现 TenantGuard + service 层 row-level filter,但仍有漏洞:

1. **应用层遗漏**: 任何 service 方法忘记传 tenantId,就会泄露数据
2. **数据库层无防线**: 即使 SQL 写错,Postgres 不会拦截 (in-memory 模拟也无 RLS)
3. **view-model 层遗漏**: 前端 React state 持有 tenant-A 数据,UI 渲染时串到 tenant-B
4. **缺乏审计**: 跨租户访问尝试没有日志,无法追溯

**Phase-34 目标**: 三层防御,任何一层都不可绕过:
- **数据库层 (RLS)**: Postgres RLS policy 强制 `WHERE tenant_id = current_tenant`
- **应用层 (Service)**: ViewModelService 统一拦截,任何方法必须传 tenantId
- **视图层 (View)**: React ViewModelProvider 注入 tenantId,子组件无法绕过

---

## 2. 验收标准 (AC)

### AC-1: Postgres RLS 强制
- [ ] `agent_events` 表启用 RLS
- [ ] RLS policy: `USING (tenant_id = current_setting('app.tenant_id'))`
- [ ] 不带 tenant_id 的 SELECT 返回 0 行
- [ ] 不带 tenant_id 的 INSERT 被拒绝
- [ ] 不带 tenant_id 的 UPDATE/DELETE 0 行

### AC-2: ViewModelService 统一拦截
- [ ] 新建 `view-model.service.ts`,所有跨表读取统一走它
- [ ] 每个方法必须传 `tenantId` 参数 (TypeScript 强制)
- [ ] 跨租户访问 → 抛 `ForbiddenException` + 审计日志
- [ ] 任意业务 service 必须通过 ViewModelService 读数据 (禁止直接查 store)

### AC-3: ViewModelProvider (前端)
- [ ] React Context `ViewModelProvider` 注入 tenantId
- [ ] `useViewModel()` hook 自动注入 tenantId,子组件无法绕过
- [ ] 切换 tenant 时,所有 view-model 失效 (防脏读)

### AC-4: 审计日志
- [ ] 任何跨租户访问尝试 → 记录到 audit_log
- [ ] 日志字段: timestamp, actor_user_id, tenant_id_attempted, resource, action
- [ ] 异步写入,不阻塞主流程

---

## 3. 数据库 Schema (Phase-34 增补)

### 3.1 RLS Policy

```sql
-- 启用 RLS
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY tenant_isolation_select ON agent_events
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true));

-- INSERT policy
CREATE POLICY tenant_isolation_insert ON agent_events
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- UPDATE policy
CREATE POLICY tenant_isolation_update ON agent_events
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

-- DELETE policy
CREATE POLICY tenant_isolation_delete ON agent_events
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));
```

### 3.2 Audit Log

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor       TEXT,                        -- 'user-123' / 'system'
  tenant_id   TEXT NOT NULL,               -- 尝试访问的 tenant
  resource    TEXT NOT NULL,               -- 'agent_events:sess-X'
  action      TEXT NOT NULL,               -- 'cross_tenant_access_attempt'
  metadata    JSONB
);

CREATE INDEX idx_audit_log_tenant_time ON audit_log (tenant_id, occurred_at DESC);
```

---

## 4. 接口设计

### 4.1 ViewModelService (后端)

```typescript
// apps/api/src/modules/shared/view-model.service.ts (新建)
@Injectable()
export class ViewModelService {
  constructor(
    private readonly agentConfigs: AgentConfigRepository,
    private readonly agentSessions: AgentSessionRepository,
    private readonly eventStore: EventStoreService,
    private readonly audit: AuditService
  ) {}

  // 所有方法必须显式传 tenantId
  async getAgentConfig(id: string, tenantId: string): Promise<AgentConfig | null> {
    // 1. 校验 tenantId 非空
    if (!tenantId) throw new ForbiddenException('tenantId required')
    
    // 2. 查询
    const config = await this.agentConfigs.findById(id)
    
    // 3. 跨租户检测
    if (config && config.tenantId !== tenantId) {
      await this.audit.logCrossTenantAttempt({
        actor: 'unknown',
        tenantId,
        resource: `agent_configs:${id}`,
        action: 'cross_tenant_access_attempt'
      })
      throw new ForbiddenException('Cross-tenant access denied')
    }
    
    return config ?? null
  }
  
  async listAgentConfigs(tenantId: string): Promise<AgentConfig[]> { ... }
  async getSession(id: string, tenantId: string): Promise<AgentSession | null> { ... }
  async listSessions(tenantId: string): Promise<AgentSession[]> { ... }
  async getSessionHistory(sessionId: string, tenantId: string): Promise<BufferedEvent[]> { ... }
  async getEvaluation(id: string, tenantId: string): Promise<QualityEvaluation | null> { ... }
}
```

### 4.2 AuditService

```typescript
// apps/api/src/modules/shared/audit.service.ts (新建)
@Injectable()
export class AuditService {
  async logCrossTenantAttempt(params: {
    actor: string
    tenantId: string
    resource: string
    action: 'cross_tenant_access_attempt' | 'missing_tenant_id' | 'invalid_tenant'
  }): Promise<void> {
    // 异步写 audit_log (生产: Postgres; 当前: in-memory)
  }
  
  async getAuditLog(tenantId: string, since?: Date): Promise<AuditEntry[]> { ... }
}
```

### 4.3 ViewModelProvider (前端)

```typescript
// packages/ui/src/providers/ViewModelProvider.tsx (新建)
'use client';
import React, { createContext, useContext } from 'react';

interface ViewModelContextValue {
  tenantId: string
  userId: string
}

const ViewModelContext = createContext<ViewModelContextValue | null>(null)

export function ViewModelProvider({
  tenantId,
  userId,
  children
}: {
  tenantId: string
  userId: string
  children: React.ReactNode
}) {
  return (
    <ViewModelContext.Provider value={{ tenantId, userId }}>
      {children}
    </ViewModelContext.Provider>
  )
}

export function useViewModel(): ViewModelContextValue {
  const ctx = useContext(ViewModelContext)
  if (!ctx) throw new Error('useViewModel must be used within ViewModelProvider')
  return ctx
}

export function useTenantId(): string {
  return useViewModel().tenantId
}
```

---

## 5. 数据流 (跨租户访问拦截)

```
[请求 GET /agent/configs/cfg-A-1]
  Headers: x-tenant-id: tenant-B
  
[Phase-31 TenantGuard]
  request.tenantId = "tenant-B"
  
[Phase-34 ViewModelService.getAgentConfig]
  查询 SELECT * FROM agent_configs WHERE id = 'cfg-A-1'
  → 命中 cfg-A-1 (实际属于 tenant-A)
  
[跨租户检测]
  if config.tenantId !== 'tenant-B':
    audit.logCrossTenantAttempt({...})  → 写入 audit_log
    throw ForbiddenException('Cross-tenant access denied')
  
[响应]
  HTTP 403 Forbidden
  Body: { error: 'cross_tenant_access_denied', auditId: 123 }
```

---

## 6. 边界 & 异常

| 场景 | 行为 |
|------|------|
| 缺失 tenantId | ViewModelService 抛 ForbiddenException |
| tenantId 与数据不匹配 | 403 + audit_log |
| tenantId 为空字符串 | 403 + audit_log |
| super-admin 跨租户 (Phase-44) | 需 explicit `bypass_tenant=true` (Phase-44+) |
| audit_log 写入失败 | 主流程不受影响 (try/catch + log) |
| ViewModelProvider 未包裹 | useViewModel 抛错 (防绕过) |

---

## 7. E2E 断言规划 (≥42)

| Section | 断言数 |
|---------|--------|
| 1. RLS SQL 文件存在 + 关键 policy | 5 |
| 2. RLS 模拟测试 (in-memory 拦截) | 6 |
| 3. ViewModelService tenantId 强制 | 8 |
| 4. 跨租户访问 403 + 审计 | 6 |
| 5. AuditService 写入 + 查询 | 5 |
| 6. ViewModelProvider React 注入 | 6 |
| 7. 兼容 Phase-31/32/33 测试 | 6 |
| **小计** | **42** |

---

## 8. 风险 & 对策

| 风险 | 对策 |
|------|------|
| RLS 启用后现有查询破 | Phase-34 一次性全量测试 + 强制 `SET app.tenant_id = $1` per request |
| super-admin 需要跨租户 | Phase-44+ 实现 `bypass_tenant` flag (Phase-34 仅普通租户) |
| audit_log 写入压力 | 异步队列 + 批量写 (Phase-40+ 优化) |
| 性能下降 (RLS 检查) | 索引 `idx_audit_log_tenant_time` + RLS policy 简单化 |

---

## 9. 不在 Phase-34 范围

- ❌ super-admin 跨租户 → Phase-44
- ❌ RLS 在 EventStore 真实 Postgres 实施的端到端测试 (需真实 DB) → Phase-40+
- ❌ 审计日志可视化 UI → Phase-39 (数据报表)
- ❌ 审计日志归档 → Phase-40+

---

> 🦞 **"DB RLS + Service ViewModel + React Provider = 三层防御零绕过"**