# Phase-49 集团管控 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:20 CST
> **Phase**: P3 商业化
> **预计**: 4 天 (大 phase)

---

## 1. 业务目标

集团管控是 SaaS 平台集团化核心:
- **多组织架构**: 集团/事业部/区域/门店 4 级
- **权限分层**: 跨组织数据权限
- **集团报表**: 合并报表/分部报表
- **资金集中**: 集团资金池/内部转账
- **战略协同**: 跨业务线协同

依赖所有 P1+P2 phase 数据。

---

## 2. 数据模型

### Organization (组织)
```typescript
interface Organization {
  id: string
  tenantId: string              // 顶级集团
  type: 'GROUP' | 'DIVISION' | 'REGION' | 'STORE'
  parentOrgId?: string
  name: string
  path: string                   // /group/division/region/store
  level: number                  // 0/1/2/3
  metadata: Record<string, unknown>
}

interface OrgRelation {
  orgId: string
  relatedOrgId: string
  type: 'PARENT_CHILD' | 'SISTER' | 'PARTNER'
}
```

### PermissionLayer (权限分层)
```typescript
interface PermissionLayer {
  id: string
  orgId: string
  dataScope: 'SELF' | 'CHILDREN' | 'TREE' | 'ALL'
  resourceTypes: string[]        // 'order', 'member', 'finance'
  fieldRestrictions?: Record<string, 'HIDE' | 'MASK' | 'NORMAL'>
}
```

### ConsolidatedReport (合并报表)
```typescript
interface ConsolidatedReport {
  id: string
  groupOrgId: string
  period: string
  type: 'BALANCE_SHEET' | 'INCOME' | 'CASH_FLOW'
  totalRevenueCents: number
  totalCostCents: number
  segments: ReportSegment[]
  consolidationAdjustments: number  // 内部交易抵消
}

interface ReportSegment {
  orgId: string
  revenueCents: number
  costCents: number
  memberCount: number
  orderCount: number
}
```

---

## 3. 任务卡 (T179)

| T-NN | 标题 | 估时 |
|------|------|------|
| T179-1 | 组织架构 + 多级树 | 1.5d |
| T179-2 | 数据权限分层 | 1d |
| T179-3 | 合并报表 + 内部抵消 | 1.5d |

**总计**: 4 天

---

## 4. Champion 督导
- E41 王集团董事长 (战略)
- E42 李事业部总经理 (执行)
- E43 张区域总监 (区域)

---

## 5. 关键决策待定
1. **组织层级**: 3 / 4 / 5 级?
2. **权限模型**: RBAC / ABAC?
3. **内部交易**: 如何识别 + 抵消?
4. **合并报表**: 实时 / 月结?
5. **集团 BI**: 自研 / 集成 Tableau?

---

> 🦞 **"Phase-49 集团管控 = P3 商业化第 5 步 = 集团化运营"**---

## V3 Decision Lock · 2026-06-27 22:33 CST

### D1 Org Hierarchy: 5 levels (HQ > Region > Brand > Store > Team)
- HQ: group headquarters
- Region: 7 regions (CN-North/South/East/West/Northeast/Northwest/Southwest)
- Brand: per sub-brand
- Store: per physical location
- Team: per functional team

### D2 Data Isolation: Logical (shared DB with tenant_id)
- All tables include org_path (materialized path)
- Row-level security (RLS) in PostgreSQL
- Drill-down: child -> parent aggregation

### D3 Approval: BPM workflow engine (Camunda)
- Engine: Camunda 7 (battle-tested)
- Designer: drag-drop UI for ops
- SLA: per step configurable (e.g. ≤ 24h)

### D4 Treasury: Internal bank + cash pool
- Internal bank: inter-org transfers (free)
- Cash pool: HQ sweeps daily
- Reconciliation: T+1 auto-reconcile

### D5 Consolidation: Individual + Consolidated + Adjustment
- Individual: per entity financial statements
- Adjustment: inter-company elimination
- Consolidated: combined for group report

---

> Phase-49 = Group Control = multi-org + consolidation