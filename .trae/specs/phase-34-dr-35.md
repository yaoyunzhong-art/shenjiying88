# 🏛️ DR-35: 三层防御强制 tenantId 隔离

> **编号**: DR-35
> **日期**: 2026-06-27
> **作者**: 🦞 openclaw (后台)
> **状态**: 🟡 待评审 (5 名多租户/安全专家)
> **影响范围**: Phase-34 (1.5 天)

---

## 1. 背景

Phase-31 TenantGuard + row-level filter 在应用层做了租户隔离,但:
- 任何 service 忘记传 tenantId 即泄露
- 数据库层无防御
- 前端 View 层无防御
- 缺乏审计

---

## 2. 决策

采用 **"DB RLS + Service ViewModel + React ViewModelProvider"** 三层防御。

---

## 3. 备选方案

### A. 仅应用层 (Phase-31 现状)
- **优点**: 简单
- **缺点**: 任何代码改动可能引入漏洞
- **否决**: 防御纵深不够

### B. 仅 DB RLS
- **优点**: 数据库层兜底
- **缺点**: 前端 View 层仍可串号,审计缺失
- **否决**: 仅 50% 防御

### C. DB RLS + Service ViewModel + React Provider (本次选择)
- **优点**: 三层防御,任一层失效其他层仍生效
- **缺点**: 实施工作量大
- **选择理由**: SaaS 多租户生产级必须纵深防御

### D. 用专用多租户中间件 (如 Citus / Row-Level Security 框架)
- **优点**: 开箱即用
- **缺点**: 引入重组件,锁定厂商
- **否决**: 现阶段过度设计

---

## 4. 详细方案

### 4.1 数据库层 (RLS)

```sql
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON agent_events
  USING (tenant_id = current_setting('app.tenant_id', true));
```

**每个请求**: `SET LOCAL app.tenant_id = $1;` (per-request)

### 4.2 应用层 (ViewModelService)

```typescript
class ViewModelService {
  async getAgentConfig(id: string, tenantId: string) {
    // 1. tenantId 必填校验
    if (!tenantId) throw new ForbiddenException('tenantId required')
    
    // 2. 查
    const config = await this.repo.findById(id)
    
    // 3. 跨租户检测
    if (config?.tenantId !== tenantId) {
      await this.audit.logCrossTenantAttempt({...})
      throw new ForbiddenException('Cross-tenant access denied')
    }
    
    return config
  }
}
```

### 4.3 视图层 (ViewModelProvider)

```typescript
<ViewModelProvider tenantId={user.tenantId} userId={user.id}>
  <Dashboard />  // 子组件用 useTenantId() 拿 tenantId
</ViewModelProvider>
```

### 4.4 审计 (AuditService)

跨租户尝试 → 写 audit_log → 异步,不阻塞

---

## 5. 后果

### 5.1 正面
- ✅ 防御纵深 3 层,无单一漏洞
- ✅ 跨租户尝试可追溯
- ✅ DB 层强制兜底,即使应用代码有 bug
- ✅ 前端 view-model 单一来源,避免状态漂移

### 5.2 负面
- ⚠️ RLS 检查有性能开销 (预计 <1ms,索引缓解)
- ⚠️ Audit log 写入压力 (需监控)
- ⚠️ 三层都需要配套测试

### 5.3 中性
- super-admin 跨租户延后到 Phase-44
- Audit UI 延后到 Phase-39

---

## 6. 反模式

- ❌ Service 直接查 repo 绕过 ViewModelService
- ❌ React 组件 prop 传 tenantId (应通过 useTenantId())
- ❌ Audit 写入失败抛错影响主流程
- ❌ RLS policy 太复杂 (性能差)

---

## 7. 实施 (T153-T157, 估时 8h)

| Task | 估时 | 内容 |
|------|------|------|
| T153 | 1.5h | RLS policy SQL + migration |
| T154 | 2.5h | ViewModelService + AuditService |
| T155 | 1.5h | Migration runner (in-memory 应用 RLS 规则) |
| T156 | 1.5h | ViewModelProvider + useTenantId hook |
| T157 | 1h | E2E 42 断言 + 兼容回归 |
| **总计** | **8h** | |

---

## 8. 决策记录

| 日期 | 决策 | 决策人 |
|------|------|--------|
| 2026-06-27 | 选定方案 C (三层防御) | 🦞 openclaw |
| 待定 | 5 多租户专家评审 | 5 专家 |
| 待定 | 大飞哥批准 | 大飞哥 |

---

> 🏛️ **"DB + Service + View = 纵深防御零绕过, P0 路线图最后一项"**