# 🗺️ PRD: 质检巡查管理模块 (Phase 1)

> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(46+ tests) E2E✅(#60) PRD补写

**用途**: 安监部门核心管理——质检巡检(CRUD)、巡查任务(任务生命周期)、整改记录(问题闭环)三大板块
**产出**: `apps/api/src/modules/quality/` + `apps/api/src/modules/quality-inspection/`
**作用**: V23 Phase 1 安监运营核心能力

## 🎯 目标

为门店安监部门提供完整的质检巡查管理能力，支撑门店日常运营中的来料检验、过程巡检、出厂质检、安全巡查及不合格品整改闭环。

### 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 质检巡检 (Inspections) | 来料/过程/出厂/出货检验记录管理 | P0 |
| 巡查任务 (Patrol Tasks) | 安全巡查任务创建、指派、执行、完成 | P0 |
| 整改记录 (Rectifications) | 不合格整改生命周期（开单→执行→验证→关闭） | P0 |
| 逾期提醒 | 巡查逾期/整改逾期自动提醒 | P1 |
| 统计看板 | 通过率/整改统计/逾期率 | P1 |
| 租户隔离 | 多门店数据隔离 | P0 |

## 📐 架构设计

```
QualityController ──→ QualityService ──→ [InMemory Store (Phase 1)]
     │                      │
     │                      ├── QualityInspectionService (复用质检基础)
     │                      ├── PatrolTask CRUD
     │                      └── RectificationRecord CRUD
     │
     ├── TenantGuard (多租户隔离)
     └── DTO Validation (class-validator)
```

### 模块结构

```
quality/
├── quality.controller.ts        # 22+ REST 端点（巡检/巡查/整改）
├── quality.service.ts           # 业务逻辑 + 内存存储 + 跨模块通知
├── quality.dto.ts               # 请求/查询 DTO (3类)
├── quality.entity.ts            # 实体类型 + 枚举 (3类)
├── quality.module.ts            # NestJS 模块注册
├── quality.controller.test.ts   # 22+ tests
├── quality.module.test.ts       # 10+ tests
└── cross-module-e2e-60-quality.test.ts  # 15 E2E 场景

quality-inspection/              # 独立子模块（复用基础质检功能）
├── quality-inspection.controller.ts
├── quality-inspection.service.ts
├── quality-inspection.dto.ts
├── quality-inspection.entity.ts
├── quality-inspection.module.ts
├── quality-inspection.controller.test.ts  # 17 tests
├── quality-inspection.service.test.ts     # 17 tests
├── quality-inspection.dto.test.ts         # 8 tests
├── quality-inspection.entity.test.ts      # 5 tests
├── quality-inspection.module.test.ts      # 11 tests
├── quality-inspection.role.test.ts        # 9 tests
└── quality-inspection.ringbeam.md         # 圈梁表
```

## 🧩 数据结构

### 1. 质检巡检 (InspectionRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (inspect-{uuid}) |
| inspectNo | string | 检验单号 (如 IQC-2026-0001) |
| type | enum | INCOMING/OUTGOING/IN_PROCESS/FINAL |
| itemName | string | 检验物料/成品名称 |
| itemBatch | string | 批次号 |
| result | enum | PASS/FAIL/CONDITIONAL |
| severity | enum | CRITICAL/MAJOR/MINOR/OBSERVATION |
| defects | Defect[] | 缺陷列表 |
| inspector | string | 检验员 |
| inspectedAt | string | 检验时间 |

### 2. 巡查任务 (PatrolTask)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (patrol-{uuid}) |
| patrolNo | string | 巡查单号 (如 PT-2026-0001) |
| title | string | 巡查标题 |
| description | string | 巡查描述 |
| area | enum | KITCHEN/WAREHOUSE/DINING_HALL/EQUIPMENT_ROOM... |
| priority | enum | LOW/MEDIUM/HIGH/URGENT |
| status | enum | PENDING/IN_PROGRESS/COMPLETED/CANCELLED |
| checkItems | CheckItem[] | 检查项列表 |
| assignedTo | string | 责任人 |
| scheduledAt | string | 计划执行时间 |

### 3. 整改记录 (RectificationRecord)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (rect-{uuid}) |
| rectificationNo | string | 整改单号 (如 REC-2026-0001) |
| sourceInspectionId | string | 来源质检记录 ID |
| sourceInspectNo | string | 来源质检单号 |
| title | string | 整改标题 |
| status | enum | OPEN/IN_PROGRESS/RESOLVED/VERIFIED/CLOSED |
| severity | enum | CRITICAL/MAJOR/MINOR/OBSERVATION |
| responsiblePerson | string | 责任人 |
| actions | Action[] | 整改措施列表 |
| deadline | string | 截止日期 |
| verifiedBy | string | 验证人 |

## 🔄 状态机

### 巡查任务生命周期
```
PENDING ──→ IN_PROGRESS ──→ COMPLETED
   │                             │
   └──── CANCELLED ←────────────┘
```

### 整改记录生命周期
```
OPEN ──→ IN_PROGRESS ──→ RESOLVED ──→ VERIFIED ──→ CLOSED
  │                                                    ↑
  └────────────────────────────────────────────────────┘
```

## 🧪 测试覆盖

| 测试层 | 文件 | 数量 | 覆盖 |
|--------|------|:----:|:----|
| Module | quality.module.test.ts | 10 | 正例+边界 |
| Controller | quality.controller.test.ts | 22+ | 三类实体CRUD+查询视图+跨租户隔离 |
| Controller | quality-inspection.controller.test.ts | 17 | 巡检CRUD+错误传播 |
| Service | quality-inspection.service.test.ts | 17 | 完整CRUD+查询+种籽数据 |
| DTO | quality-inspection.dto.test.ts | 8 | 字段验证 |
| Entity | quality-inspection.entity.test.ts | 5 | 枚举值+接口形状 |
| Role | quality-inspection.role.test.ts | 9 | 角色旅程 |
| Module | quality-inspection.module.test.ts | 11 | 元数据+反射 |
| E2E | cross-module-e2e-60-quality.test.ts | 15 | 6模块跨链 |
| **合计** | | **114+** | |

## 🛡️ 角色权限

| 资源 | 安监主管 | 巡检员 | 店长 | 前台/HR等 |
|------|:-------:|:------:|:----:|:---------:|
| qi:list | ✅ | ✅ | ✅ | ❌ |
| qi:create | ✅ | ✅ | ❌ | ❌ |
| qi:report | ✅ | ❌ | ✅ | ❌ |
| patrol:create | ✅ | ❌ | ❌ | ❌ |
| patrol:execute | ✅ | ✅ | ❌ | ❌ |
| rect:create | ✅ | ❌ | ❌ | ❌ |
| rect:close | ✅ | ❌ | ❌ | ❌ |
| stats:view | ✅ | ❌ | ✅ | ❌ |

## 📊 离线数据

- **质检巡检**: 20 条种子数据（涵盖 IQC/OQC/IPQC/FQC + 生鲜食品/工业品/消费品场景）
- **巡查任务**: 8 条种子数据（厨房/仓库/设备间/洗手间/入口）
- **整改记录**: 6 条种子数据（CRITICAL/MAJOR 严重级别，含已关闭/进行中/待处理状态）

## 🔗 跨模块对接

| 对端模块 | 对接方式 | 说明 |
|:---------|:---------|:-----|
| notification | 创建不合格时自动发通知 | 质检FAIL→安监主管通知 |
| notification | 整改超期提醒 | 整改逾期→责任人通知 |
| notification | 整改关闭验证通知 | 闭单→验证人通知 |
| auth/rbac | TenantGuard + 角色鉴权 | 多租户隔离+操作权限 |
| analytics | 巡检通过率 | 统计推送分析模块 |
| analytics | 逾期率统计 | 整改/巡查逾期统计 |
| agent/ai-review | AI辅助整改建议 | 自动分析缺陷根因 (Phase 2) |
| agent/quality-eval | 供应商质量评估 | 按供应商汇总合格率 (Phase 2) |

## 📋 验收标准

| # | 场景 | 步骤 |
|:-:|:-----|:-----|
| AC-1 | 创建质检巡检 | POST /quality/inspections → 返回完整记录 |
| AC-2 | 巡检列表+筛选 | GET /quality/inspections?type=INCOMING&result=FAIL |
| AC-3 | 巡查任务创建 | POST /quality/patrol-tasks → 返回PENDING任务 |
| AC-4 | 巡查完成 | PATCH /quality/patrol-tasks/:id {status: COMPLETED} |
| AC-5 | 逾期巡查查询 | GET /quality/patrol-tasks/views/overdue |
| AC-6 | 整改记录创建 | POST /quality/rectifications → 通知责任人 |
| AC-7 | 整改关闭 | PATCH /quality/rectifications/:id {status: CLOSED} → 通知验证人 |
| AC-8 | 整改统计 | GET /quality/rectifications/views/stats |
| AC-9 | 跨租户隔离 | tenant-001 看不到 tenant-002 的数据 |
| AC-10 | 角色权限 | 前台不能创建巡检，安监主管可以 |
| AC-11 | E2E全链路 | 质检→巡查→整改→通知→统计 完整闭环 |
