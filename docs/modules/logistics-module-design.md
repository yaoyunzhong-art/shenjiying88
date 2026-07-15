# P-30 物流模块详细设计文档

## 1. 模块概述

物流模块是数字运动潮玩平台 V17 的核心运维管理子系统，负责门店设备巡检、清洁排班、维修工单和物料申请四大子域的全生命周期管理。

### 1.1 核心职责

- **设备巡检管理**：周期性设备检查任务下发、提醒、执行与结果记录
- **清洁排班管理**：门店清洁人员排班、区域分配、签到打卡
- **维修工单管理**：故障报修、工单派发、维修过程追踪、验收闭环
- **物料申请管理**：维修物料申请、审批流程、出库管理

### 1.2 架构位置

```
┌─────────────────────────────────────────────────────────┐
│                    M5 Platform V17                       │
├─────────────────────────────────────────────────────────┤
│  P-31 多租户  │  P-32 用户认证  │  P-33 权限控制        │
├─────────────────────────────────────────────────────────┤
│  P-30 物流模块 ◄────── 核心子系统                        │
│  ├── 巡检任务 (InspectionTask)                         │
│  ├── 清洁排班 (CleanSchedule)                          │
│  ├── 维修工单 (RepairOrder)                            │
│  └── 物料申请 (MaterialRequest)                        │
├─────────────────────────────────────────────────────────┤
│  P-48 营销券  │  P-49 SEO/GEO  │  P-54 自动化测试      │
├─────────────────────────────────────────────────────────┤
│  P-53 基础设施 (ACK/Terraform/Prometheus)               │
└─────────────────────────────────────────────────────────┘
```

## 2. 领域模型设计

### 2.1 实体关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         物流模块领域模型                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────┐         ┌──────────────────┐                │
│   │  InspectionTask  │         │  CleanSchedule   │                │
│   │  (巡检任务)       │         │  (清洁排班)       │                │
│   ├──────────────────┤         ├──────────────────┤                │
│   │ - equipmentId    │         │ - assigneeId     │                │
│   │ - assigneeId     │         │ - shiftName      │                │
│   │ - scheduledAt    │         │ - scheduledDate  │                │
│   │ - status         │         │ - areaCode       │                │
│   │ - result         │         │ - checkIn        │                │
│   └────────┬─────────┘         └──────────────────┘                │
│            │                                                        │
│            │  triggers                                             │
│            ▼                                                        │
│   ┌──────────────────┐                                            │
│   │   RepairOrder    │◄───────────┐                                 │
│   │   (维修工单)      │            │                                 │
│   ├──────────────────┤            │ creates                         │
│   │ - equipmentId    │            │                                 │
│   │ - issueDesc      │            │                                 │
│   │ - assigneeId     │            │                                 │
│   │ - status         │            │                                 │
│   │ - verification   │            │                                 │
│   └────────┬─────────┘            │                                 │
│            │                      │                                 │
│            │  requires            │                                 │
│            ▼                      │                                 │
│   ┌──────────────────┐          │                                 │
│   │  MaterialRequest │          │                                 │
│   │  (物料申请)       │──────────┘                                 │
│   ├──────────────────┤                                             │
│   │ - requesterId    │                                             │
│   │ - purpose        │                                             │
│   │ - items[]        │                                             │
│   │ - status         │                                             │
│   │ - approval       │                                             │
│   │ - outbound       │                                             │
│   └──────────────────┘                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 状态机设计

#### 2.2.1 巡检任务状态机

```
                    ┌─────────────┐
                    │  scheduled  │
                    │  (已排期)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
     ┌────────────────┐    │   ┌──────────────┐
     │   reminded    │    │   │  sweep-due   │
     │  (已提醒)      │────┘   │  (到期扫批)   │
     └───────┬────────┘        └──────┬───────┘
             │                        │
             ▼                        │
     ┌────────────────┐              │
     │  completed    │◄─────────────┘
     │  (已完成)     │   (记录结果)
     └────────────────┘
```

#### 2.2.2 清洁排班状态机

```
┌─────────────┐     assign-area      ┌─────────────┐     check-in      ┌─────────────┐
│  scheduled  │ ────────────────────▶ │  assigned   │ ───────────────▶ │ checked_in  │
│  (已排期)    │                     │  (已分配区域) │                   │  (已签到)    │
└─────────────┘                     └─────────────┘                   └─────────────┘
```

#### 2.2.3 维修工单状态机

```
                              ┌─────────┐
                              │   open  │
                              │ (待处理) │
                              └────┬────┘
                                   │ assign
                                   ▼
                              ┌─────────┐      start      ┌─────────────┐
                              │ assigned│ ──────────────▶ │ in_progress │
                              │ (已派单) │                 │   (维修中)   │
                              └─────────┘                 └──────┬──────┘
                                                                 │ complete
                                                                 ▼
                              ┌─────────┐      verify       ┌─────────────┐
                              │ verified│ ◀────────────────│  completed  │
                              │ (已验收) │                  │   (已完成)   │
                              └─────────┘                  └─────────────┘
```

#### 2.2.4 物料申请状态机

```
┌─────────────────┐     approve      ┌─────────────┐     outbound      ┌─────────────┐
│ pending_approval│ ───────────────▶ │  approved   │ ───────────────▶ │  outbound   │
│   (待审批)       │                  │  (已批准)    │                  │  (已出库)    │
└─────────────────┘                  └─────────────┘                  └─────────────┘
```

## 3. 接口设计

### 3.1 RESTful API 概览

| 资源 | 端点 | 方法 | 描述 |
|------|------|------|------|
| **巡检任务** | | | |
| | `/logistics/inspections` | POST | 创建巡检任务 |
| | `/logistics/inspections` | GET | 列表查询 |
| | `/logistics/inspections/:id` | GET | 详情查询 |
| | `/logistics/inspections/:id/remind` | POST | 发送提醒 |
| | `/logistics/inspections/sweep/reminders` | POST | 批量到期提醒扫描 |
| | `/logistics/inspections/:id/result` | POST | 记录巡检结果 |
| **清洁排班** | | | |
| | `/logistics/clean-schedules` | POST | 创建排班 |
| | `/logistics/clean-schedules` | GET | 列表查询 |
| | `/logistics/clean-schedules/:id` | GET | 详情查询 |
| | `/logistics/clean-schedules/:id/assign-area` | POST | 分配区域 |
| | `/logistics/clean-schedules/:id/check-in` | POST | 签到打卡 |
| **维修工单** | | | |
| | `/logistics/repairs` | POST | 创建工单 |
| | `/logistics/repairs` | GET | 列表查询 |
| | `/logistics/repairs/:id` | GET | 详情查询 |
| | `/logistics/repairs/:id/assign` | POST | 派单分配 |
| | `/logistics/repairs/:id/start` | POST | 开始维修 |
| | `/logistics/repairs/:id/complete` | POST | 完成维修 |
| | `/logistics/repairs/:id/verify` | POST | 验收确认 |
| **物料申请** | | | |
| | `/logistics/material-requests` | POST | 创建申请 |
| | `/logistics/material-requests` | GET | 列表查询 |
| | `/logistics/material-requests/:id` | GET | 详情查询 |
| | `/logistics/material-requests/:id/approve` | POST | 审批通过 |
| | `/logistics/material-requests/:id/outbound` | POST | 出库确认 |

### 3.2 核心接口详细说明

#### 3.2.1 创建巡检任务

```
POST /logistics/inspections
Headers:
  x-tenant-id: T001

Request:
{
  "storeId": "S001",                    // 可选：门店ID
  "equipmentId": "EQ-001",              // 设备ID
  "equipmentName": "投篮机一号",          // 设备名称
  "assigneeId": "U1001",                // 负责人ID
  "assigneeName": "张三",                // 负责人名称
  "scheduledAt": "2026-07-20T09:00:00Z"  // 计划执行时间
}

Response 201:
{
  "id": "inspection-xxx",
  "tenantId": "T001",
  "storeId": "S001",
  "equipmentId": "EQ-001",
  "equipmentName": "投篮机一号",
  "assigneeId": "U1001",
  "assigneeName": "张三",
  "scheduledAt": "2026-07-20T09:00:00Z",
  "status": "scheduled",
  "createdAt": "2026-07-16T10:00:00Z",
  "updatedAt": "2026-07-16T10:00:00Z"
}
```

#### 3.2.2 记录巡检结果

```
POST /logistics/inspections/:id/result
Headers:
  x-tenant-id: T001

Request:
{
  "status": "normal",           // normal | warning | fault
  "note": "设备运行正常，无异常",  // 巡检备注
  "inspectorId": "U1001",       // 巡检人ID
  "inspectorName": "张三"        // 巡检人名称
}

Response 200:
{
  "id": "inspection-xxx",
  ...
  "status": "completed",
  "result": {
    "status": "normal",
    "note": "设备运行正常，无异常",
    "inspectorId": "U1001",
    "inspectorName": "张三",
    "recordedAt": "2026-07-20T09:30:00Z"
  },
  "completedAt": "2026-07-20T09:30:00Z",
  "updatedAt": "2026-07-20T09:30:00Z"
}
```

#### 3.2.3 创建维修工单

```
POST /logistics/repairs
Headers:
  x-tenant-id: T001

Request:
{
  "storeId": "S001",                       // 可选：门店ID
  "inspectionTaskId": "inspection-xxx",    // 可选：关联巡检任务ID
  "equipmentId": "EQ-001",                 // 设备ID
  "equipmentName": "投篮机一号",             // 设备名称
  "issueDescription": "投篮感应器失灵，无法计分", // 问题描述
  "reporterId": "U1001",                   // 报修人ID
  "reporterName": "张三"                    // 报修人名称
}

Response 201:
{
  "id": "repair-xxx",
  "tenantId": "T001",
  "storeId": "S001",
  "inspectionTaskId": "inspection-xxx",
  "equipmentId": "EQ-001",
  "equipmentName": "投篮机一号",
  "issueDescription": "投篮感应器失灵，无法计分",
  "reporterId": "U1001",
  "reporterName": "张三",
  "status": "open",
  "createdAt": "2026-07-16T10:00:00Z",
  "updatedAt": "2026-07-16T10:00:00Z"
}
```

## 4. 数据模型

### 4.1 实体定义

#### 4.1.1 InspectionTask（巡检任务）

```typescript
interface InspectionTaskEntity {
  // 主键
  id: string;                    // 格式: inspection-${uuid}
  
  // 租户隔离
  tenantId: string;              // 租户ID
  storeId?: string;              // 门店ID（可选）
  
  // 业务属性
  equipmentId: string;           // 设备ID
  equipmentName: string;         // 设备名称
  assigneeId: string;          // 负责人ID
  assigneeName: string;        // 负责人名称
  scheduledAt: string;           // 计划执行时间 (ISO8601)
  
  // 状态管理
  status: 'scheduled' | 'reminded' | 'completed';
  reminderSentAt?: string;        // 提醒发送时间
  completedAt?: string;           // 完成时间
  
  // 结果数据
  result?: {
    status: 'normal' | 'warning' | 'fault';
    note: string;
    inspectorId: string;
    inspectorName: string;
    recordedAt: string;
  };
  
  // 审计字段
  createdAt: string;
  updatedAt: string;
}
```

#### 4.1.2 CleanSchedule（清洁排班）

```typescript
interface CleanScheduleEntity {
  // 主键
  id: string;                    // 格式: clean-${uuid}
  
  // 租户隔离
  tenantId: string;
  storeId?: string;
  
  // 排班信息
  assigneeId: string;            // 清洁人员ID
  assigneeName: string;          // 清洁人员名称
  shiftName: string;             // 班次名称 (如: "早班"、"晚班")
  shiftTime: string;             // 班次时间 (如: "09:00-17:00")
  scheduledDate: string;         // 排班日期 (YYYY-MM-DD)
  
  // 区域分配
  areaCode?: string;             // 区域编码
  areaName?: string;             // 区域名称
  
  // 状态管理
  status: 'scheduled' | 'assigned' | 'checked_in';
  assignedAt?: string;           // 分配时间
  
  // 签到信息
  checkIn?: {
    cleanerId: string;
    cleanerName: string;
    checkedInAt: string;
    note?: string;
  };
  
  // 审计字段
  createdAt: string;
  updatedAt: string;
}
```

#### 4.1.3 RepairOrder（维修工单）

```typescript
interface RepairOrderEntity {
  // 主键
  id: string;                    // 格式: repair-${uuid}
  
  // 租户隔离
  tenantId: string;
  storeId?: string;
  
  // 关联数据
  inspectionTaskId?: string;     // 关联巡检任务（故障由巡检发现）
  
  // 设备信息
  equipmentId: string;
  equipmentName: string;
  
  // 问题描述
  issueDescription: string;      // 问题详细描述
  
  // 报修人信息
  reporterId: string;
  reporterName: string;
  
  // 处理人信息
  assigneeId?: string;           // 维修工程师ID
  assigneeName?: string;         // 维修工程师名称
  
  // 状态管理
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'verified';
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  
  // 完成信息
  completionNote?: string;       // 维修完成说明
  
  // 验收信息
  verification?: {
    verifierId: string;
    verifierName: string;
    note: string;
    verifiedAt: string;
  };
  
  // 审计字段
  createdAt: string;
  updatedAt: string;
}
```

#### 4.1.4 MaterialRequest（物料申请）

```typescript
interface MaterialRequestEntity {
  // 主键
  id: string;                    // 格式: material-${uuid}
  
  // 租户隔离
  tenantId: string;
  storeId?: string;
  
  // 申请人信息
  requesterId: string;
  requesterName: string;
  department?: string;          // 部门
  
  // 申请用途
  purpose: string;                // 申请用途说明
  
  // 状态管理
  status: 'pending_approval' | 'approved' | 'outbound';
  
  // 物料明细
  items: Array<{
    itemId: string;              // 物料编码
    itemName: string;            // 物料名称
    category: string;            // 物料类别
    unit: string;                // 计量单位
    quantity: number;            // 申请数量
  }>;
  totalQuantity: number;          // 总数量
  
  // 审批信息
  approval?: {
    approverId: string;
    approverName: string;
    note: string;
    approvedAt: string;
  };
  
  // 出库信息
  outbound?: {
    operatorId: string;
    operatorName: string;
    warehouseCode?: string;      // 仓库编码
    note?: string;
    outboundAt: string;
  };
  
  // 审计字段
  createdAt: string;
  updatedAt: string;
}
```

## 4. 代码架构

### 4.1 模块结构

```
apps/api/src/modules/logistics/
├── logistics.entity.ts      # 领域实体定义
├── logistics.service.ts     # 业务逻辑层
├── logistics.controller.ts  # API 控制层
└── index.ts                 # 模块导出
```

### 4.2 依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                      LogisticsController                     │
│                      (API 控制层)                            │
├─────────────────────────────────────────────────────────────┤
│                         │                                   │
│                         ▼                                   │
│                      LogisticsService                        │
│                      (业务逻辑层)                            │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐  │
│  │ Inspection │ CleanSchedule │ RepairOrder │ Material   │  │
│  │   Task     │               │             │ Request    │  │
│  └──────────────┴──────────────┴──────────────┴────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                         │                                   │
│                         ▼                                   │
│              NotificationService (可选依赖)                   │
│              (通知服务 - 提醒推送)                            │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 核心服务方法

```typescript
// 巡检任务管理
class LogisticsService {
  // 创建巡检任务
  createInspectionTask(input: CreateInspectionTaskInput): InspectionTaskEntity
  
  // 查询巡检任务列表
  listInspectionTasks(tenantId: string, filter?: Filter): InspectionTaskEntity[]
  
  // 查询单个巡检任务
  getInspectionTask(id: string, tenantId: string): InspectionTaskEntity | undefined
  
  // 发送巡检提醒
  sendInspectionReminder(id: string, tenantId: string, now?: string): InspectionTaskEntity
  
  // 批量扫描到期提醒
  sweepDueInspectionReminders(now?: string): SweepResult
  
  // 记录巡检结果
  recordInspectionResult(id: string, tenantId: string, input: RecordInput): InspectionTaskEntity
  
  // 清洁排班管理
  createCleanSchedule(input: CreateCleanScheduleInput): CleanScheduleEntity
  listCleanSchedules(tenantId: string, filter?: Filter): CleanScheduleEntity[]
  getCleanSchedule(id: string, tenantId: string): CleanScheduleEntity | undefined
  assignCleanArea(id: string, tenantId: string, input: AssignAreaInput): CleanScheduleEntity
  checkInCleanSchedule(id: string, tenantId: string, input: CheckInInput): CleanScheduleEntity
  
  // 维修工单管理
  createRepairOrder(input: CreateRepairOrderInput): RepairOrderEntity
  listRepairOrders(tenantId: string, filter?: Filter): RepairOrderEntity[]
  getRepairOrder(id: string, tenantId: string): RepairOrderEntity | undefined
  assignRepairOrder(id: string, tenantId: string, input: AssignInput): RepairOrderEntity
  startRepairOrder(id: string, tenantId: string, input?: StartInput): RepairOrderEntity
  completeRepairOrder(id: string, tenantId: string, input: CompleteInput): RepairOrderEntity
  verifyRepairOrder(id: string, tenantId: string, input: VerifyInput): RepairOrderEntity
  
  // 物料申请管理
  createMaterialRequest(input: CreateMaterialRequestInput): MaterialRequestEntity
  listMaterialRequests(tenantId: string, filter?: Filter): MaterialRequestEntity[]
  getMaterialRequest(id: string, tenantId: string): MaterialRequestEntity | undefined
  approveMaterialRequest(id: string, tenantId: string, input: ApproveInput): MaterialRequestEntity
  outboundMaterialRequest(id: string, tenantId: string, input: OutboundInput): MaterialRequestEntity
}
```

## 5. 关键业务逻辑

### 5.1 巡检提醒批量扫描

```typescript
/**
 * 批量扫描到期巡检任务并发送提醒
 * 
 * 业务规则：
 * 1. 扫描所有 status=scheduled 且 scheduledAt <= now 的任务
 * 2. 对每个到期任务调用 sendInspectionReminder
 * 3. 更新任务状态为 reminded
 * 4. 发送站内通知给负责人
 * 
 * 调度策略：
 * - 建议每 5 分钟执行一次
 * - 或在前端用户活跃时触发
 */
sweepDueInspectionReminders(now: string = new Date().toISOString()): {
  scanned: number      // 扫描到的到期任务数
  reminded: number     // 成功发送提醒数
  tasks: InspectionTaskEntity[]  // 被提醒的任务列表
}
```

### 5.2 维修工单闭环流程

```typescript
/**
 * 维修工单完整生命周期
 * 
 * 触发场景：
 * 1. 巡检发现设备故障 → 从巡检任务创建工单
 * 2. 门店主动报修 → 直接创建工单
 * 
 * 标准流程：
 * open → assigned → in_progress → completed → verified
 * 
 * 状态变更规则：
 * - open → assigned: 派单给维修工程师
 * - assigned → in_progress: 工程师开始维修
 * - in_progress → completed: 工程师提交完成说明
 * - completed → verified: 验收人确认修复
 * 
 * 数据完整性：
 * - completed 时必须填写 completionNote
 * - verified 时必须填写 verification.note
 */
```

### 5.3 物料申请审批链

```typescript
/**
 * 物料申请三级审批流程
 * 
 * 申请发起：
 * - 维修工程师在维修过程中发起物料申请
 * - 填写 purpose 和 items 明细
 * 
 * 审批流程：
 * 1. pending_approval → approved
 *    - 审批人: 门店主管 / 仓库管理员
 *    - 必填: approverId, approverName, note
 *    
 * 2. approved → outbound
 *    - 执行人: 仓库管理员
 *    - 必填: operatorId, operatorName, outboundAt
 *    - 可选: warehouseCode, note
 * 
 * 库存扣减：
 * - 在 outbound 时扣减对应 warehouse 的库存
 * - 每个 item 扣减对应 quantity
 */
```

## 6. 测试策略

### 6.1 单元测试覆盖

| 测试类别 | 覆盖率目标 | 关键测试场景 |
|----------|-----------|-------------|
| 状态机转换 | 100% | 所有状态转换路径 |
| 业务规则 | 100% | 边界条件、异常输入 |
| 通知触发 | 80% | 提醒发送、批量扫描 |

### 6.2 关键测试用例

```typescript
// 1. 巡检任务状态机测试
describe('InspectionTask State Machine', () => {
  it('should transition from scheduled to reminded', () => {
    // Given: