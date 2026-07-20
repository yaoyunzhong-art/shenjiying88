# PRD-010: SSE后勤管理 — Logistics (P-30)

> 版本: v2.0 · 签发人: 🦞 龙虾哥 · 对接专家: E25 后勤
> 发布日期: 2026-07-14 · 修订日期: 2026-07-20 · 状态: 🟢 已签发
> 关联Phase: P-30
> 关联仓库: `apps/api/src/modules/logistics/`

## 1. 业务背景

店A每日需要后勤保障：设备巡检、清洁排班、维修工单、物料申领。当前无系统，用纸质记录。为实现门店运维数字化、关键设备巡检不漏检、清洁排班可追溯、维修工单闭环管理、物料消耗透明化，建设后勤管理模块。

### 1.1 解决的问题

| 问题 | 场景 | 当前方案 | 目标 |
|:-----|:-----|:---------|:-----|
| 设备漏检 | 每天18:00需巡检所有设备 | 人工记忆，存在遗漏 | 系统自动生成巡检任务+到期提醒 |
| 清洁缺位 | 门店各区域需要清洁排班 | 口头安排，无法查证 | 系统排班+区域分配+签到考勤 |
| 维修无跟踪 | 设备故障→报修→维修→验收 | 无记录，无法追溯 | 工单全生命周期闭环管理 |
| 物料管理粗放 | 清洁耗材/维修配件申领 | 口头申请，审批随意 | 申领→审批→出库标准化流程 |

### 1.2 目标用户

| 角色 | 使用场景 | 关键操作 |
|:-----|:---------|:---------|
| 👔 店长 | 门店管理 | 审批物料、催办巡检、验收维修 |
| 🎮 导玩员 | 设备巡检 | 创建/执行巡检、发现故障报修 |
| 🛒 前台 | 日常运维 | 报修故障、申领物料、确认清洁 |
| 🔧 安监 | 安全检查 | 执行巡检、处理维修任务 |
| 🎯 运行专员 | 后勤调度 | 排班、派单、出库、监控 |

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 | 状态 |
|:---|:-----|:------:|:---------|:----:|
| RQ-30-01 | 设备巡检 | P0 | 创建巡检计划→按时提醒→记录巡检结果 | ✅ 已完成 |
| RQ-30-02 | 清洁排班 | P0 | 排班表→分配清洁区域→考勤签到 | ✅ 已完成 |
| RQ-30-03 | 维修工单 | P0 | 上报故障→派单→维修→验收 | ✅ 已完成 |
| RQ-30-04 | 物料申领 | P1 | 后勤物料(纸巾/清洁剂)→申领→审批→出库 | ✅ 已完成 |

### 2.1 设备巡检 (RQ-30-01)

**功能描述**: 系统支持创建设备巡检任务，到期自动发送提醒给负责人，巡检后记录结果。

**状态机**: `scheduled → reminded → completed`

| 操作 | 前置状态 | 后置状态 | 触发条件 |
|:-----|:--------:|:--------:|:---------|
| 创建任务 | - | scheduled | 指定设备、负责人、计划时间 |
| 发送提醒 | scheduled | reminded | 到达计划时间或手动催办 |
| 批量扫描 | scheduled | reminded | sweep定时任务到期扫描 |
| 记录结果 | scheduled/reminded | completed | 巡检人提交结果(normal/warning/fault) |

**API端点**:
- `POST /logistics/inspections` — 创建巡检任务
- `GET /logistics/inspections` — 列表查询 (支持 status/equipmentId 过滤)
- `GET /logistics/inspections/:id` — 任务详情
- `POST /logistics/inspections/:id/remind` — 发送提醒
- `POST /logistics/inspections/sweep/reminders` — 批量到期扫描
- `POST /logistics/inspections/:id/result` — 记录巡检结果

### 2.2 清洁排班 (RQ-30-02)

**功能描述**: 系统支持创建清洁排班、分配清洁区域、保洁员签到打卡。

**状态机**: `scheduled → assigned → checked_in`

| 操作 | 前置状态 | 后置状态 | 触发条件 |
|:-----|:--------:|:--------:|:---------|
| 创建排班 | - | scheduled | 指定清洁人员、班次、日期 |
| 分配区域 | scheduled | assigned | 指定 areaCode/areaName |
| 重复分配 | assigned | assigned | 可重新分配区域 |
| 签到打卡 | assigned | checked_in | 保洁员本人签到 |

**API端点**:
- `POST /logistics/clean-schedules` — 创建排班
- `GET /logistics/clean-schedules` — 列表查询 (支持 status/scheduledDate/assigneeId/areaCode 过滤)
- `GET /logistics/clean-schedules/:id` — 排班详情
- `POST /logistics/clean-schedules/:id/assign-area` — 分配清洁区域
- `POST /logistics/clean-schedules/:id/check-in` — 签到打卡

### 2.3 维修工单 (RQ-30-03)

**功能描述**: 系统支持设备故障报修、派单给维修工程师、过程跟踪、验收闭环。

**状态机**: `open → assigned → in_progress → completed → verified`

| 操作 | 前置状态 | 后置状态 | 触发条件 |
|:-----|:--------:|:--------:|:---------|
| 创建工单 | - | open | 填写设备、问题描述、报修人 |
| 派单 | open/assigned | assigned | 指定维修工程师 |
| 开始维修 | assigned | in_progress | 工程师确认开始维修 |
| 完成维修 | in_progress | completed | 填写维修完成说明 |
| 验收确认 | completed | verified | 验收人确认修复 |

**API端点**:
- `POST /logistics/repairs` — 创建维修工单
- `GET /logistics/repairs` — 列表查询 (支持 status/equipmentId/assigneeId 过滤)
- `GET /logistics/repairs/:id` — 工单详情
- `POST /logistics/repairs/:id/assign` — 派单分配
- `POST /logistics/repairs/:id/start` — 开始维修
- `POST /logistics/repairs/:id/complete` — 完成维修
- `POST /logistics/repairs/:id/verify` — 验收确认

### 2.4 物料申领 (RQ-30-04)

**功能描述**: 系统支持填写物料申请单、审批、出库三级流程。

**状态机**: `pending_approval → approved → outbound`

| 操作 | 前置状态 | 后置状态 | 触发条件 |
|:-----|:--------:|:--------:|:---------|
| 创建申请 | - | pending_approval | 填写purpose和items明细 |
| 审批通过 | pending_approval | approved | 审批人填写审批意见 |
| 出库确认 | approved | outbound | 仓库管理员执行出库 |

**API端点**:
- `POST /logistics/material-requests` — 创建申请
- `GET /logistics/material-requests` — 列表查询 (支持 status/requesterId/category 过滤)
- `GET /logistics/material-requests/:id` — 申请详情
- `POST /logistics/material-requests/:id/approve` — 审批通过
- `POST /logistics/material-requests/:id/outbound` — 出库确认

## 3. 验收卡

| AC | 场景 | 预期 | 测试文件 |
|:---|:-----|:-----|:---------|
| AC-30-01 | 创建巡检任务(每日18:00, 设备A) | 任务创建成功, 到点提醒 | `logistics-ringbeam.test.ts` |
| AC-30-02 | 记录巡检结果(设备A=正常) | 记录保存, 展示"已巡检" | `logistics-ringbeam.test.ts` |
| AC-30-03 | 报修(机器B不转)→派单给维修工C | 工单创建→维修工收到通知 | `logistics-ringbeam.test.ts` |
| AC-30-04 | 维修完成→验收 | 工单状态=已验证 | `logistics-ringbeam.test.ts` |
| AC-30-05 | 清洁排班→分配区域→保洁签到 | 排班正常流转, 签到可查 | `logistics-ringbeam.test.ts` |
| AC-30-06 | 物料申领→审批→出库 | 申请单三态流转完成 | `logistics-ringbeam.test.ts` |

## 4. 数据模型

见 `apps/api/src/modules/logistics/logistics.entity.ts` 完整定义，核心实体:

### 4.1 InspectionTask（巡检任务）

```typescript
interface InspectionTaskEntity {
  id: string                    // inspection-${uuid}
  tenantId: string              // 租户隔离
  storeId?: string
  equipmentId: string           // 设备ID
  equipmentName: string         // 设备名称
  assigneeId: string            // 负责人
  assigneeName: string
  scheduledAt: string           // 计划执行时间 (ISO8601)
  status: 'scheduled' | 'reminded' | 'completed'
  reminderSentAt?: string
  completedAt?: string
  result?: InspectionTaskResult // {status, note, inspectorId, inspectorName, recordedAt}
  createdAt: string
  updatedAt: string
}
```

### 4.2 CleanSchedule（清洁排班）

```typescript
interface CleanScheduleEntity {
  id: string                    // clean-${uuid}
  tenantId: string
  storeId?: string
  assigneeId: string            // 清洁人员
  assigneeName: string
  shiftName: string             // 早班/晚班
  shiftTime: string             // 08:00-12:00
  scheduledDate: string         // YYYY-MM-DD
  areaCode?: string             // 区域编码
  areaName?: string             // 区域名称
  status: 'scheduled' | 'assigned' | 'checked_in'
  assignedAt?: string
  checkIn?: CleanScheduleCheckIn
  createdAt: string
  updatedAt: string
}
```

### 4.3 RepairOrder（维修工单）

```typescript
interface RepairOrderEntity {
  id: string                    // repair-${uuid}
  tenantId: string
  storeId?: string
  inspectionTaskId?: string     // 关联巡检
  equipmentId: string
  equipmentName: string
  issueDescription: string      // 问题描述
  reporterId: string
  reporterName: string
  assigneeId?: string           // 维修工程师
  assigneeName?: string
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'verified'
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  completionNote?: string
  verification?: RepairVerification
  createdAt: string
  updatedAt: string
}
```

### 4.4 MaterialRequest（物料申请）

```typescript
interface MaterialRequestEntity {
  id: string                    // material-${uuid}
  tenantId: string
  storeId?: string
  requesterId: string           // 申请人
  requesterName: string
  department?: string
  purpose: string               // 申请用途
  status: 'pending_approval' | 'approved' | 'outbound'
  items: MaterialRequestItem[]  // 物料明细
  totalQuantity: number         // 自动计算
  approval?: MaterialRequestApproval
  outbound?: MaterialOutboundRecord
  createdAt: string
  updatedAt: string
}
```

## 5. 非功能需求

| 指标 | 要求 | 实现方式 |
|:-----|:-----|:---------|
| 租户隔离 | 每个tenant数据完全隔离 | `x-tenant-id` + private Map store |
| 数据一致性 | 状态转换可预测 | 严格状态机验证 |
| 可测试性 | 单元测试覆盖所有状态路径 | In-memory store + resetStoreForTests |
| 可扩展性 | 支持后续持久化 | Service层与存储解耦 |
| 通知集成 | 通过NotificationService发送 | @Optional注入 |

## 6. 测试策略

| 测试类型 | 文件 | 数量 | 覆盖内容 |
|:---------|:-----|:----:|:---------|
| 单元测试 | `logistics.service.test.ts` | 66 | 正例/反例/边界 |
| 主圈梁 | `logistics-ringbeam.test.ts` | 8 | AC验收闭环 |
| E2E测试 | `logistics.e2e.test.ts` | 10 | HTTP全链路 |
| 角色测试 | `logistics.role.test.ts` | 32 | 8角色旅程+交叉场景 |
| 角色扩展 | `logistics.role-extended.test.ts` | 8 | 4角色扩展+边界 |
| **合计** | | **124** | |

> **注**: 运行时输出 108 tests passed (5 files) 因为部分定义在 `role-extended` 中合并在 `role.test.ts` 中不重复执行。

## 7. 实现位置

```
apps/api/src/modules/logistics/
├── logistics.entity.ts              # 领域类型定义 (4实体 + 9子类型)
├── logistics.service.ts             # 业务逻辑 (~20个公有方法 + 4个内存储存)
├── logistics.controller.ts          # REST控制器 (~20个HTTP端点)
├── logistics.module.ts              # NestJS模块
├── logistics.service.test.ts        # 深度单元测试
├── logistics-ringbeam.test.ts       # 主圈梁验收测试
├── logistics.e2e.test.ts            # E2E HTTP测试
├── logistics.role.test.ts           # 角色旅程测试
└── logistics.role-extended.test.ts  # 角色扩展测试
```

## 8. 版本记录

| 版本 | 日期 | 变更内容 | 作者 |
|:-----|:-----|:---------|:-----|
| v1.0 | 2026-07-14 | 初始版本，定义4个RQ和AC | 🦞 龙虾哥 |
| v2.0 | 2026-07-20 | 细化全部API/状态机/数据模型/测试策略 | 🌲 树哥 |
