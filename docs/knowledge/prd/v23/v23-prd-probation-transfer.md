# 🗺️ PRD: 人事转正管理模块 (Phase 2)

> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(≥15 tests) E2E✅(#63) PRD补写
> 归属: Pulse-v23 Phase 2 HR补充

**用途**: 试用期员工转正申请→审批全闭环，覆盖转正/延长试用/终止试用3种结果
**产出**: `apps/api/src/modules/transfer/`
**作用**: V23 Phase 2 HR运营核心能力——试用期员工生命周期管理

## 🎯 目标

为门店及各部门提供完整的试用期转正管理能力，支撑人事管理中的转正申请、审批流转、统计分析及多租户隔离。

### 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 转正申请 (Create) | 填写员工试用期信息、自评，启动转正流程 | P0 |
| 转正审批 (Approve) | 审批人审核，支持通过/延长/终止三种结果 | P0 |
| 转正查询 (List/Get) | 按状态/部门/员工/时间范围筛选查询 | P0 |
| 统计看板 (Stats) | 按状态/部门/评级/月度趋势多维度统计 | P1 |
| 评价等级 (Rating) | A(优秀)/B(合格)/C(需改进)/D(不合格)四级评价 | P1 |
| 租户隔离 | 多门店/多租户数据严格隔离 | P0 |
| Mock种子数据 | 10条模拟数据覆盖全流程场景 | P1 |

## 📐 架构设计

```
ProbationTransferController ──→ ProbationTransferService ──→ [InMemory Store]
         │                              │
         │   (TenantContext)             ├── createTransfer (ONGOING状态创建)
         │                              ├── getTransfer / listTransfers (筛选查询)
         │                              ├── approveTransfer (审批流: COMPLETED/EXTENDED/TERMINATED)
         │                              ├── getStats (多维度统计)
         │                              └── seedMockData (测试数据)
         │
         ├── TenantGuard (多租户隔离)
         └── class-validator DTO (输入校验)
```

### 模块结构

```
transfer/
├── probation-transfer.controller.ts       # 6 REST 端点（CRUD + 审批 + 统计 + 种子）
├── probation-transfer.service.ts          # 业务逻辑 + 内存存储 + 多维度统计
├── probation-transfer.dto.ts              # 请求/查询 DTO (3类)
├── probation-transfer.entity.ts           # 实体类型 + 枚举 + 统计接口
├── probation-transfer.module.ts           # NestJS 模块注册
├── probation-transfer.controller.test.ts  # ≥15 tests (路由元数据+CRUD+审批+统计)
└── cross-module-e2e-63-transfer.test.ts   # E2E 场景
```

## 🧩 数据结构

### 1. 试用期转正记录 (ProbationTransfer)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (transfer-{uuid}) |
| employeeId | string | 员工工号 |
| employeeName | string | 员工姓名 |
| department | string | 所属部门 |
| position | string | 岗位名称 |
| probationDuration | enum(ProbationDuration) | 试用期时长(1/2/3/6个月) |
| probationStart | string | 试用期开始日期 (YYYY-MM-DD) |
| probationEnd | string | 试用期结束日期 (YYYY-MM-DD) |
| status | enum(ProbationStatus) | ONGOING/COMPLETED/EXTENDED/TERMINATED |
| transferDate | string? | 转正日期 |
| performanceRating | string? | 评价等级: A/B/C/D |
| evaluation | string | 评估意见/自评 |
| approver | string | 审批人 |
| approvalRemark | string? | 审批意见 |
| rejectReason | string? | 驳回原因 |
| tenantId | string | 租户ID |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### 2. 枚举定义

**ProbationStatus (试用期状态):**
```
ONGOING     - 试用中（待审批）
COMPLETED   - 转正通过
EXTENDED    - 延长试用期
TERMINATED  - 终止试用
```

**ProbationDuration (试用期时长，月):**
```
1  - 一个月
2  - 两个月
3  - 三个月
6  - 六个月
```

**PerformanceRating (评价等级):**
```
A - 优秀：远超岗位要求
B - 合格：达到岗位要求
C - 需改进：基本达标但有差距
D - 不合格：未达到岗位要求
```

## 📡 API 端点

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|------------|
| POST | `/probation-transfers` | 创建转正申请 | CreateProbationTransferDto |
| GET | `/probation-transfers` | 查询转正列表 | ProbationQueryDto (query) |
| GET | `/probation-transfers/stats` | 统计看板 | tenant (header) |
| GET | `/probation-transfers/:transferId` | 转正详情 | transferId (param) |
| PATCH | `/probation-transfers/:transferId/approve` | 审批操作 | ApproveProbationTransferDto |
| POST | `/probation-transfers/seed` | 注入Mock数据 | tenant (header) |

### 转正申请 DTO (POST /probation-transfers)

```typescript
interface CreateProbationTransferDto {
  employeeId: string
  employeeName: string
  department: string
  position: string
  probationDuration: ProbationDuration  // 1 | 2 | 3 | 6
  probationStart: string                // YYYY-MM-DD
  probationEnd: string                  // YYYY-MM-DD
  evaluation: string                    // 评估意见
  approver: string                      // 审批人
}
```

### 审批 DTO (PATCH /probation-transfers/:id/approve)

```typescript
interface ApproveProbationTransferDto {
  status: ProbationStatus               // COMPLETED | EXTENDED | TERMINATED
  performanceRating?: string            // A | B | C | D
  approvalRemark?: string               // 审批意见
  rejectReason?: string                 // 驳回原因（TERMINATED时填写）
}
```

### 统计接口返回 (GET /probation-transfers/stats)

```typescript
interface ProbationStats {
  total: number                                          // 总记录数
  byStatus: Record<ProbationStatus, number>              // 按状态分布
  byDepartment: Array<{ department: string; count: number }> // 部门分布
  completedRate: number                                  // 转正率 (0~1)
  extensionRate: number                                  // 延长率 (0~1)
  terminationRate: number                                // 终止率 (0~1)
  averageDurationDays: number                            // 平均试用期天数
  monthlyTrend: Array<{                                  // 月度趋势
    month: string                                        // YYYY-MM
    completed: number                                    // 转正数
    extended: number                                     // 延长数
    terminated: number                                   // 终止数
  }>
  performanceDistribution: Array<{                       // 评价分布
    rating: string                                       // A/B/C/D
    count: number
  }>
}
```

## 🛡️ 多租户隔离

所有接口通过 `TenantGuard` + `TenantContext` 装饰器实现租户隔离。同一租户只能操作本租户的试用期转正数据。

```
请求 → TenantGuard → TenantContext({ tenantId }) → Service(tenantId) → InMemoryStore
```

## 🚀 审批流状态机

```
                      ┌─────────┐
                      │ ONGOING │ (创建)
                      └────┬────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │COMPLETED │ │ EXTENDED │ │TERMINATED│
        │ (转正)   │ │(延长试用)│ │(终止试用)│
        └──────────┘ └──────────┘ └──────────┘
```

- 只有 ONGOING 状态的记录可以审批
- 审批结果有三种：COMPLETED(转正通过)、EXTENDED(延长试用期)、TERMINATED(终止试用)
- 审批后设置 transferDate(转正日期/审批日期) 和 performanceRating(评价等级)

## 🧪 测试覆盖

- Controller 测试 ≥ 15 条：路由元数据 + CRUD + 审批流(通过/延长/终止) + 统计
- E2E 测试 (#63)：覆盖试用期→转正→延长→终止→统计→租户隔离全链路

### Mock种子数据 (10条)

| # | 员工 | 部门 | 试用期(月) | 结果 | 评价 |
|---|------|------|-----------|------|------|
| 1 | 张三 | 运营部 | 3 | ✅ 转正 | A |
| 2 | 李四 | 技术部 | 3 | ✅ 转正 | B |
| 3 | 王五 | 销售部 | 3 | ⏳ 试用中 | - |
| 4 | 赵六 | 运营部 | 6 | 🔄 延长 | C |
| 5 | 孙七 | 人事部 | 3 | ✅ 转正 | A |
| 6 | 周八 | 技术部 | 3 | ⏳ 试用中 | - |
| 7 | 吴九 | 市场部 | 2 | ❌ 终止 | D |
| 8 | 郑十 | 财务部 | 3 | ⏳ 试用中 | - |
| 9 | 陈一 | 运营部 | 1 | ⏳ 试用中 | - |
| 10 | 黄二 | 销售部 | 3 | 🔄 延长 | C |

## ✅ 圈梁检查

- [x] TypeScript 编译通过 (TSC)
- [x] 单元测试 ≥ 10 (≥15 tests)
- [x] 圈梁表覆盖
- [x] PRD 文档补写
- [x] 知识入库 (v23 Phase 2)
- [x] E2E 覆盖 (#63)
