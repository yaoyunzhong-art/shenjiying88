# 🗺️ PRD: 请假考勤管理模块 (Phase 2)

> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(51 tests) E2E✅(#61) PRD补写
> 归属: Pulse-v23 Phase 2 HR补充

**用途**: 请假申请→审批→统计闭环，覆盖7种请假类型(年假/病假/事假/产假/婚假/丧假/其他)
**产出**: `apps/api/src/modules/leave-request/`
**作用**: V23 Phase 2 HR运营核心能力——员工请假全生命周期管理

## 🎯 目标

为门店员工提供完整的请假管理能力，支撑门店日常运营中的请假申请、审批流转、考勤统计及多租户隔离。

### 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 请假申请 (Create) | 7种请假类型申请（年假/病假/事假/产假/婚假/丧假/其他） | P0 |
| 请假审批 (Approve/Reject) | 审批人审核、驳回操作 | P0 |
| 请假取消 (Cancel) | 待审批状态下可取消申请 | P0 |
| 请假查询 (List/Get) | 按类型/状态/员工/时间范围筛选查询 | P0 |
| 统计看板 (Stats) | 按类型/状态/月度趋势/员工作维度统计 | P1 |
| 租户隔离 | 多门店/多租户数据严格隔离 | P0 |
| Mock种子数据 | 21条模拟数据覆盖全流程场景 | P1 |

## 📐 架构设计

```
LeaveRequestController ──→ LeaveRequestService ──→ [InMemory Store]
         │                          │
         │   (TenantContext)        ├── createLeave (PENDING状态创建)
         │                          ├── getLeave / listLeaves (筛选查询)
         │                          ├── approveLeave / cancelLeave (审批流)
         │                          ├── getStats (多维度统计)
         │                          └── seedMockData (测试数据)
         │
         ├── TenantGuard (多租户隔离)
         └── class-validator DTO (输入校验)
```

### 模块结构

```
leave-request/
├── leave-request.controller.ts       # 8 REST 端点（CRUD + 审批 + 统计 + 种子）
├── leave-request.service.ts          # 业务逻辑 + 内存存储 + 多维度统计
├── leave-request.dto.ts              # 请求/查询 DTO (3类)
├── leave-request.entity.ts           # 实体类型 + 枚举 + 统计接口
├── leave-request.module.ts           # NestJS 模块注册
├── leave-request.controller.test.ts  # 21 tests (路由元数据+CRUD+审批+统计)
├── leave-request.service.test.ts     # 16 tests (CRUD+审批+种子)
├── leave-request.module.test.ts      # 2 tests (模块定义)
├── leave-request.role.test.ts        # 12 tests (6角色×2场景)
└── cross-module-e2e-61-leave.test.ts # 15 E2E 场景 (请假→HR→通知→租户→统计)
```

## 🧩 数据结构

### 1. 请假记录 (LeaveRequest)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 (leave-{uuid}) |
| employeeId | string | 员工工号 |
| employeeName | string | 员工姓名 |
| type | enum(LeaveType) | ANNUAL/SICK/PERSONAL/MATERNITY/MARRIAGE/BEREAVEMENT/OTHER |
| status | enum(LeaveStatus) | PENDING/APPROVED/REJECTED/CANCELLED |
| startDate | string | 请假开始日期 (YYYY-MM-DD) |
| endDate | string | 请假结束日期 (YYYY-MM-DD) |
| days | number | 请假天数 |
| reason | string | 请假原因 |
| approver | string | 审批人 |
| approvedAt | string? | 审批时间 |
| remark | string? | 备注/驳回原因 |
| tenantId | string | 租户ID |
| createdAt | string | 创建时间 |

### 2. 请假枚举

**LeaveType:**
```
ANNUAL       - 年假
SICK         - 病假
PERSONAL     - 事假
MATERNITY    - 产假
MARRIAGE     - 婚假
BEREAVEMENT  - 丧假
OTHER        - 其他
```

**LeaveStatus:**
```
PENDING    - 待审批
APPROVED   - 已通过
REJECTED   - 已驳回
CANCELLED  - 已取消
```

## 📡 API 端点

| 方法 | 路径 | 说明 | 请求体/参数 |
|------|------|------|------------|
| POST | `/leave-requests` | 创建请假申请 | CreateLeaveRequestDto |
| GET | `/leave-requests` | 查询请假列表 | LeaveQueryDto (query) |
| GET | `/leave-requests/stats` | 统计看板 | tenant (header) |
| GET | `/leave-requests/:leaveId` | 请假详情 | leaveId (param) |
| PATCH | `/leave-requests/:leaveId/approve` | 审批操作 | ApproveLeaveDto |
| PATCH | `/leave-requests/:leaveId/cancel` | 取消申请 | leaveId (param) |
| POST | `/leave-requests/seed` | 注入Mock数据 | tenant (header) |

### 统计接口返回 (GET /leave-requests/stats)

```typescript
interface LeaveStats {
  total: number                          // 总请假数
  byStatus: Record<LeaveStatus, number>  // 按状态分布
  byType: Record<LeaveType, number>      // 按类型分布
  totalDays: number                      // 请假总天数
  approvedDays: number                   // 已通过天数
  pendingDays: number                    // 待审批天数
  rejectionRate: number                  // 驳回率 (0~1)
  monthlyTrend: Array<{                  // 月度趋势
    month: string                        // YYYY-MM
    count: number
    days: number
  }>
  employeeStats: Array<{                // 员工请假统计
    employeeId: string
    employeeName: string
    totalLeaves: number
    totalDays: number
    approvedLeaves: number
  }>
}
```

## 🛡️ 多租户隔离

所有借口通过 `TenantGuard` + `TenantContext` 装饰器实现租户隔离。同一租户只能操作本租户的请假数据。

```
请求 → TenantGuard → TenantContext({ tenantId }) → Service(tenantId) → InMemoryStore
```

## 🚀 跨模块测试覆盖

E2E测试覆盖以下跨模块场景:

| 场景 | 涉及模块 | 说明 |
|------|---------|------|
| S1 请假申请→HR员工关联 | leave-request + hr | 请假人信息与HR员工匹配 |
| S2 审批流→角色权限 | leave-request + auth | 只有审批人可操作审批 |
| S3 请假创建→通知 | leave-request + notification | 创建请假自动通知审批人 |
| S4 租户隔离 | leave-request + tenant | 多租户数据互不可见 |
| S5 月度统计→分析 | leave-request + analytics | 统计总天数、驳回率、月度趋势 |
| S6 审批异常(已关闭) | leave-request | 不可驳回已取消的记录 |
| S7 超长假期(产假92天) | leave-request | 边界值覆盖 |

## ✅ 圈梁检查

- [x] TypeScript 编译通过 (TSC)
- [x] 单元测试 ≥ 10 (51 tests)
- [x] 圈梁表覆盖
- [x] PRD 文档补写
- [x] 知识入库 (v23 Phase 2)
- [x] E2E 覆盖 (#61)
