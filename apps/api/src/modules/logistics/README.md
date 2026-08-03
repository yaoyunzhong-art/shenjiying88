# logistics — 后勤管理模块

> 版本: V23 (P-30 Phase 60% + 80%) | 维护人: 树哥A | 最后更新: 2026-07-28

## 概述

后勤管理模块是面向多租户的综合后勤管理引擎，涵盖设备巡检与维保、耗材请购与采购审批、供应商管理（含评价/合同）、库存预留、定时调度计划、维修反馈闭环与知识沉淀、场馆巡检记录、耗材库存预警，以及后勤报表汇总。

**设计原则:**
- 全生命周期管理 → 巡检→报修→维保→反馈→知识沉淀
- 审批流对接 → 耗材采购对接 P-37 审批流
- 数据驱动 → 供应商评价、工单统计、报表汇总
- 预警闭环 → 耗材库存预警自动触发与处置

## 核心能力

| 能力 | 子能力 | 说明 |
|------|--------|------|
| ✅ 设备巡检 | 巡检任务创建/分配/提醒/记录 | 定时巡检设备，支持到期自动提醒（NotificationService） |
| ✅ 清洁排班 | 排班/区域分配/签到 | 门店清洁人员班次管理 |
| ✅ 维修工单 | 报修→指派→处理→完成→验收 | 5 阶段状态机（open/assigned/in_progress/completed/verified） |
| ✅ 设备维保 | 维保→处理→验收 | 4 阶段状态机（pending/in_progress/pending_acceptance/completed） |
| ✅ 物料申领 | 申领→审批→出库 | 支持多品项明细、审批流、出库记录 |
| ✅ 耗材采购 | 草稿→审批→下单→收货 | 对接 P-37 审批流、采购单号、验收记录 |
| ✅ 供应商管理 | 新增/联系人/合同/评价 | 信用评级(A/B/C/D)、多维度评分、指标统计 |
| ✅ 库存预留 | 可用性检查→预留→取消/履行 | 对接物料申领和采购 |
| ✅ 定时调度 | Cron 计划/自动执行/日志 | 设备巡检计划、到期扫描执行 |
| ✅ 维修知识库 | 根本原因/解决方案/Tag | 维修沉淀复用、故障检索 |
| ✅ 耗材预警 | 规则配置→自动检查→告警→处置 | 低库存/超库存/过期预警 |
| ✅ 场馆巡检 | 检查→评分→问题追踪 | 环境/设备/安全三维度评分 |
| ✅ 后勤报表 | 费用/工单/供应商/巡检 汇总 | 多维度后勤数据看板 |

## 技术架构

### 模块依赖

```
LogisticsModule
├── LogisticsController     → REST API (TenantGuard + RBAC)
├── LogisticsService        → 核心业务逻辑 (2,331 行)
│   └── 数据存储: 17 个 Map 内存存储
│       ├── InspectionTaskStore
│       ├── CleanScheduleStore
│       ├── RepairOrderStore
│       ├── MaterialRequestStore
│       ├── MaintenanceOrderStore
│       ├── ProcurementRequestStore
│       ├── SupplierStore / SupplierContractStore / SupplierEvaluationStore
│       ├── InventoryReservationStore
│       ├── SchedulePlanStore / ScheduleTaskLogStore
│       ├── RepairFeedbackStore / RepairKnowledgeStore
│       ├── ConsumableAlertRuleStore / ConsumableAlertStore
│       └── VenueInspectionRecordStore
├── 实体文件:
│   ├── logistics.entity.ts             → 核心实体 (巡检/排班/维修/申领/采购)
│   ├── logistics.supplier.entity.ts    → 供应商管理实体
│   ├── logistics.inventory.entity.ts   → 库存预留实体
│   ├── logistics.schedule.entity.ts    → 定时调度实体
│   └── logistics.phase-p30-80.entity.ts→ P-30 扩展实体 (反馈/知识/预警/巡检/报表)
└── 外部依赖:
    ├── TenantGuard           → 多租户隔离守卫
    ├── IdentityAccess        → 权限装饰器
    └── NotificationService   → 通知推送 (巡检到期提醒)
```

### 状态模型

**巡检任务状态:** `scheduled → reminded → completed`
**维修工单状态:** `open → assigned → in_progress → completed → verified`
**设备维保状态:** `pending → in_progress → pending_acceptance → completed`
**物料申领状态:** `pending_approval → approved → outbound`
**采购申请状态:** `draft → pending_approval → approved/rejected → ordered → received`
**供应商状态:** `active / inactive / suspended`
**库存预留状态:** `active → fulfilled / cancelled / expired`
**调度计划状态:** `active / paused / archived`
**预警告警级别:** `info / warning / critical`
**预警类型:** `low_stock / over_stock / expiry`

### 实体类型

| 实体文件 | 实体 | 说明 |
|----------|------|------|
| logistics.entity.ts | InspectionTaskEntity, CleanScheduleEntity, RepairOrderEntity, MaterialRequestEntity, MaintenanceOrderEntity, ProcurementRequestEntity | 6 个核心实体 |
| logistics.supplier.entity.ts | Supplier, SupplierContract, SupplierEvaluation, SupplierMetrics, SupplierContact | 供应商管理体系 |
| logistics.inventory.entity.ts | InventoryReservation, InventoryReservationItem, InventoryCheckResult | 库存预留 |
| logistics.schedule.entity.ts | SchedulePlan, ScheduleTaskLog, SchedulePlanMetrics | 定时调度 |
| logistics.phase-p30-80.entity.ts | RepairFeedback, RepairKnowledge, ConsumableAlertRule, ConsumableAlert, VenueInspectionRecord, VenueInspectionTrend, LogisticsReport, ExpenseSummary, WorkOrderStats, SupplierRanking | 10 个扩展实体 |

## 配置说明

### 隐式配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 数据存储 | 内存 Map | ⚠️ 所有 17 个 Store 均为内存存储，重启丢失 |
| 通知服务 | Optional Injection | 巡检/排班通知通过 NotificationService |
| 巡检提醒扫描 | sweepDueInspectionReminders | 手动触发，无定时调度 |
| 调度计划扫描 | sweepDueSchedules | 手动触发，无定时调度 |

### 环境变量

> 当前无独立环境变量。所有业务数据存储于内存，生产需迁移至数据库。

## API / 接口

### REST API 端点

#### 设备巡检

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/inspections` | `logistics:read` | 创建设备巡检任务 |
| GET | `/logistics/inspections` | `logistics:read` | 列表查询(支持 status/equipmentId) |
| GET | `/logistics/inspections/:id` | `logistics:read` | 获取详情 |
| POST | `/logistics/inspections/:id/remind` | `logistics:read` | 发送巡检提醒 |
| POST | `/logistics/inspections/sweep/reminders` | `logistics:read` | 批量发送到期提醒 |
| POST | `/logistics/inspections/:id/result` | `logistics:read` | 记录巡检结果 |

#### 清洁排班

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/clean-schedules` | `logistics:read` | 创建排班 |
| GET | `/logistics/clean-schedules` | `logistics:read` | 列表查询 |
| GET | `/logistics/clean-schedules/:id` | `logistics:read` | 详情 |
| POST | `/logistics/clean-schedules/:id/assign-area` | `logistics:read` | 分配区域 |
| POST | `/logistics/clean-schedules/:id/check-in` | `logistics:read` | 清洁签到 |

#### 维修工单

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/repairs` | `logistics:repairs:read` | 创建维修工单 |
| GET | `/logistics/repairs` | `logistics:repairs:read` | 列表查询 |
| GET | `/logistics/repairs/:id` | `logistics:repairs:id:read` | 详情 |
| POST | `/logistics/repairs/:id/assign` | `logistics:repairs:id:read` | 指派 |
| POST | `/logistics/repairs/:id/start` | `logistics:repairs:id:read` | 开始处理 |
| POST | `/logistics/repairs/:id/complete` | `logistics:repairs:id:read` | 完成 |
| POST | `/logistics/repairs/:id/verify` | `logistics:repairs:id:read` | 验收 |

#### 物料申领

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/material-requests` | `logistics:read` | 创建申领 |
| GET | `/logistics/material-requests` | `logistics:read` | 列表查询 |
| GET | `/logistics/material-requests/:id` | `logistics:read` | 详情 |
| POST | `/logistics/material-requests/:id/approve` | `logistics:read` | 审批通过 |
| POST | `/logistics/material-requests/:id/outbound` | `logistics:read` | 出库 |

#### 设备维保

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/maintenance-orders` | `logistics:read` | 创建维保工单 |
| GET | `/logistics/maintenance-orders` | `logistics:read` | 列表查询 |
| GET | `/logistics/maintenance-orders/:id` | `logistics:read` | 详情 |
| POST | `/logistics/maintenance-orders/:id/start` | `logistics:read` | 开始维保 |
| POST | `/logistics/maintenance-orders/:id/complete` | `logistics:read` | 完成维保 |
| POST | `/logistics/maintenance-orders/:id/accept` | `logistics:read` | 验收 |

#### 耗材采购

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/procurement-requests` | `logistics:read` | 创建采购申请 |
| GET | `/logistics/procurement-requests` | `logistics:read` | 列表查询 |
| GET | `/logistics/procurement-requests/:id` | `logistics:read` | 详情 |
| POST | `/logistics/procurement-requests/:id/submit` | `logistics:read` | 提交审批 |
| POST | `/logistics/procurement-requests/:id/approve` | `logistics:read` | 审批通过 |
| POST | `/logistics/procurement-requests/:id/reject` | `logistics:read` | 驳回 |
| POST | `/logistics/procurement-requests/:id/order` | `logistics:read` | 下单采购 |
| POST | `/logistics/procurement-requests/:id/receive` | `logistics:read` | 收货 |

#### 供应商管理

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/suppliers` | `suppliers:form:read` | 新增供应商 |
| GET | `/logistics/suppliers` | `suppliers:read` | 列表查询 |
| GET | `/logistics/suppliers/:id` | `suppliers:id:read` | 详情 |
| PATCH | `/logistics/suppliers/:id` | `suppliers:form:read` | 更新 |
| DELETE | `/logistics/suppliers/:id` | `suppliers:form:read` | 删除 |
| POST | `/logistics/suppliers/:id/contacts` | `suppliers:form:read` | 添加联系人 |
| POST | `/logistics/suppliers/:id/contracts` | `suppliers:form:read` | 添加合同 |
| GET | `/logistics/suppliers/:id/contracts` | `suppliers:id:read` | 合同列表 |
| POST | `/logistics/suppliers/:id/evaluations` | `suppliers:form:read` | 评价供应商 |
| GET | `/logistics/suppliers/:id/evaluations` | `suppliers:id:read` | 评价列表 |
| GET | `/logistics/suppliers/metrics` | `suppliers:read` | 供应商统计指标 |

#### 库存预留 + 定时调度

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/inventory/check` | `logistics:read` | 库存可用性检查 |
| POST | `/logistics/inventory/reservations` | `logistics:read` | 创建预留 |
| GET | `/logistics/inventory/reservations` | `logistics:read` | 预留列表 |
| GET | `/logistics/inventory/reservations/:id` | `logistics:read` | 预留详情 |
| POST | `/logistics/inventory/reservations/:id/cancel` | `logistics:read` | 取消预留 |
| POST | `/logistics/inventory/reservations/:id/fulfill` | `logistics:read` | 履行预留 |
| POST | `/logistics/schedule-plans` | `logistics:read` | 创建调度计划 |
| GET | `/logistics/schedule-plans` | `logistics:read` | 计划列表 |
| GET | `/logistics/schedule-plans/:id` | `logistics:read` | 计划详情 |
| PATCH | `/logistics/schedule-plans/:id` | `logistics:read` | 更新计划 |
| DELETE | `/logistics/schedule-plans/:id` | `logistics:read` | 删除计划 |
| POST | `/logistics/schedule-plans/:id/compute-next-run` | `logistics:read` | 计算下次执行 |
| POST | `/logistics/schedule-plans/sweep` | `logistics:read` | 到期扫描 |
| POST | `/logistics/schedule-plans/:id/execute` | `logistics:read` | 手动执行 |
| GET | `/logistics/schedule-plans/:id/logs` | `logistics:read` | 执行日志 |
| GET | `/logistics/schedule-plans/metrics` | `logistics:read` | 计划统计 |

#### 维修反馈 + 耗材预警 + 场馆巡检 + 报表

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/logistics/repair-feedbacks` | `logistics:read` | 提交维修反馈 |
| GET | `/logistics/repair-feedbacks` | `logistics:read` | 反馈列表 |
| GET | `/logistics/repair-feedbacks/:id` | `logistics:read` | 反馈详情 |
| POST | `/logistics/repair-knowledge` | `logistics:read` | 录入维修知识 |
| GET | `/logistics/repair-knowledge` | `logistics:read` | 知识库查询 |
| GET | `/logistics/repair-knowledge/:id` | `logistics:read` | 知识详情 |
| PATCH | `/logistics/repair-knowledge/:id` | `logistics:read` | 更新知识 |
| POST | `/logistics/consumable-alert-rules` | `logistics:read` | 创建预警规则 |
| GET | `/logistics/consumable-alert-rules` | `logistics:read` | 规则列表 |
| PATCH | `/logistics/consumable-alert-rules/:id` | `logistics:read` | 更新规则 |
| DELETE | `/logistics/consumable-alert-rules/:id` | `logistics:read` | 删除规则 |
| POST | `/logistics/consumable-alerts/check` | `logistics:read` | 触发预警检查 |
| GET | `/logistics/consumable-alerts` | `logistics:read` | 告警列表 |
| POST | `/logistics/consumable-alerts/:id/resolve` | `logistics:read` | 处置告警 |
| POST | `/logistics/venue-inspections` | `logistics:read` | 场馆巡检记录 |
| GET | `/logistics/venue-inspections` | `logistics:read` | 巡检列表 |
| GET | `/logistics/venue-inspections/trend` | `logistics:read` | 趋势数据 |
| GET | `/logistics/reports` | `logistics:read` | 后勤报表汇总 |

### RBAC 角色权限说明

| 权限标识 | 适用范围 | 说明 |
|----------|----------|------|
| `logistics:read` | 基础后勤操作 | 巡检/排班/申领/维保/采购/库存/调度/反馈/预警/报表 |
| `logistics:repairs:read` | 维修工单读 | 可查看维修工单列表 |
| `logistics:repairs:id:read` | 维修工单详情+操作 | 可查看和操作具体工单(指派/开始/完成/验收) |
| `suppliers:read` | 供应商列表+统计 | 可查看供应商列表和指标 |
| `suppliers:id:read` | 供应商详情 | 可查看供应商详情/合同/评价 |
| `suppliers:form:read` | 供应商管理操作 | 可新增/编辑/删除供应商、添加联系人/合同/评价 |

### 数据安全注意事项

- 所有端点强制 `@UseGuards(TenantGuard)` + `@RequireTenantScope()` 实现租户隔离
- 维修工单权限精细到读/详情+操作两级
- 供应商管理权限分离为 列表/详情/操作 三级
- ⚠️ 所有数据存储于内存 `Map`，无持久化，重启后数据全部丢失
- 通知服务为 `@Optional()` 注入，生产需确保 NotificationModule 已导入

## 监控指标

### 关键监控指标

| 指标 | 类型 | 说明 | 建议阈值 |
|------|------|------|----------|
| `logistics.inspection.pending` | Gauge | 待巡检任务 | 🟡 > 50 |
| `logistics.repair.open` | Gauge | 未处理维修工单 | 🟡 > 20 |
| `logistics.maintenance.progress` | Gauge | 进行中维保 | 🔴 > 10 且超过 7 天 |
| `logistics.procurement.pending` | Gauge | 待审批采购 | 🟡 > 15 |
| `logistics.supplier.avg.score` | Gauge | 供应商平均分 | 🔴 < 6.0 |
| `logistics.inventory.reservation` | Gauge | 有效预留数 | 🟡 > 100 |
| `logistics.schedule.due` | Gauge | 到期未执行计划 | 🔴 > 10 |
| `logistics.alert.critical` | Gauge | 严重预警未处理 | 🔴 > 5 |
| `logistics.report.accuracy` | Gauge | 报表数据一致性 | 🟡 < 100% |

### 告警规则

| 告警名称 | 条件 | 级别 | 响应 |
|----------|------|------|------|
| 巡检堆积 | 待巡检 > 50 | P3 | 提醒巡检人员 |
| 维修超时 | 未处理工单 > 20 | P2 | 协调技术人员 |
| 维保停滞 | 进行中 > 7 天 > 10 | P1 | 升级管理层 |
| 采购审批堆积 | 待审批 > 15 | P3 | 提醒审批人 |
| 供应商评分过低 | 平均分 < 6.0 | P2 | 重新评估合作 |
| 库存预警堆积 | 严重预警 > 5 | P2 | 通知采购紧急补货 |
| 调度计划过期 | 到期未执行 > 10 | P2 | 手动触发 sweep |

## 运维要求

### 健康检查

```bash
# 巡检创建接口存活检测
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/logistics/inspections \
  -H "x-tenant-id: health-check" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "store-001",
    "equipmentId": "eq-001",
    "equipmentName": "空调",
    "assigneeId": "tech-001",
    "assigneeName": "张三",
    "scheduledAt": "2026-07-30T09:00:00.000Z"
  }'
# 预期: 201

# 报表接口存活检测
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/logistics/reports \
  -H "x-tenant-id: health-check" \
  -H "Authorization: Bearer <token>"
# 预期: 200
```

### 故障恢复

| 场景 | 影响 | 恢复步骤 |
|------|------|----------|
| 内存数据丢失 | 所有后勤记录丢失 | 1. 迁移至数据库持久化<br>2. 配置定时数据快照<br>3. 从业务系统重建后勤数据 |
| 通知服务未注入 | 巡检提醒不发送 | 1. 确认 NotificationModule 已 import<br>2. 检查 NotificationService 可用性 |
| 超时/大负载 | 供应商列表/报表响应慢 | 1. 添加数据分页<br>2. 引入缓存策略<br>3. 异步处理报表计算 |
| 权限错误 | 操作返回 403 | 1. 检查 `logistics:*` 权限定义<br>2. 验证 RBAC 角色配置<br>3. 确认 TenantGuard 正确注入 |
| 定时调度失效 | 计划未触发 | 1. 手动调用 sweepDueSchedules<br>2. 检查 cronExpression 格式<br>3. 配置定时任务触发器 |

### 测试指引

```bash
# 服务层核心测试
npx jest apps/api/src/modules/logistics/logistics.service.test.ts

# 专项测试
npx jest apps/api/src/modules/logistics/logistics.ringbeam.test.ts
npx jest apps/api/src/modules/logistics/logistics.maintenance.test.ts
npx jest apps/api/src/modules/logistics/logistics.procurement.test.ts
npx jest apps/api/src/modules/logistics/logistics.phase-p30-80.test.ts
npx jest apps/api/src/modules/logistics/logistics.phase60.test.ts

# 控制器 + E2E
npx jest apps/api/src/modules/logistics/logistics.controller.test.ts
npx jest apps/api/src/modules/logistics/logistics.controller.metadata.test.ts
npx jest apps/api/src/modules/logistics/logistics.e2e.test.ts

# 角色权限测试
npx jest apps/api/src/modules/logistics/logistics.role.test.ts
npx jest apps/api/src/modules/logistics/logistics.role-extended.test.ts
```

> 共 11 个测试文件，覆盖 Service、E2E、RingBeam、Maintenance、Procurement、Phase P-30/60/80、Controller、RBAC 角色等全链路。
