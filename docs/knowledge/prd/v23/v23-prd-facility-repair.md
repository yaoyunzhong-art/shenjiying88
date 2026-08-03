# V23 PRD: 物品报修/设备维修管理模块

## 1. 概述

### 1.1 背景
电竞馆/网咖日常运营中，设备（电脑、外设、空调、家具等）出现故障时需要快速响应和闭环处理。现有维修保养计划模块（maintenance-plan）侧重定期保养，缺乏从报修到维修完成的完整工单流程。

### 1.2 目标
建立一个完整的物品报修/设备维修管理模块，支持：
- 用户提交报修请求（含位置、设备、紧急程度等信息）
- 管理员派单给维修人员
- 维修人员开始维修、完成维修
- 报修人取消报修
- 按状态、分类、紧急程度等维度筛选
- 统计看板：报修完成率、平均维修成本、待处理紧急工单数

### 1.3 与 maintenance-plan 的区别
| 维度 | maintenance-plan (保养计划) | repair (报修) |
|------|---------------------------|---------------|
| 触发方式 | 管理员定期安排 | 用户/员工主动报修 |
| 状态流 | Scheduled→InProgress→Completed | Pending→Accepted→InProgress→Completed |
| 成本 | 可选 | 有预估成本和实际成本 |
| 紧急性 | Priority枚举 | Urgency枚举（LOW/MEDIUM/HIGH/URGENT）|
| 报修人 | 不记录 | 记录报修人姓名和电话 |

## 2. 状态流转

```
提交(PENDING) → 派单(ACCEPTED) → 开始维修(IN_PROGRESS) → 完成(COMPLETED)
                              ↘       ↙                    ↗
                              (CANCELLED) ← 任何非终态可取消
```

## 3. API 设计

### 3.1 报修提交
- **POST** `repair-requests`
- 字段: title, description, category, urgency, reporterName, reporterPhone, location, deviceName?, deviceId?, remark?

### 3.2 报修列表
- **GET** `repair-requests`
- 查询参数: status?, category?, urgency?, reporterName?, assignedTo?, location?, deviceName?

### 3.3 报修详情
- **GET** `repair-requests/:requestId`

### 3.4 更新报修
- **PATCH** `repair-requests/:requestId`

### 3.5 派单/接单
- **PATCH** `repair-requests/:requestId/dispatch`
- 字段: status=ACCEPTED, assignedTo, estimatedCost?

### 3.6 开始维修
- **PATCH** `repair-requests/:requestId/start`

### 3.7 完成维修
- **PATCH** `repair-requests/:requestId/complete`
- 字段: status=COMPLETED, result?, actualCost?, remark?

### 3.8 取消报修
- **PATCH** `repair-requests/:requestId/cancel`
- 字段: remark?

### 3.9 统计分析
- **GET** `repair-requests/analysis/stats`
- 查询参数: fromDate?, toDate?
- 返回值: total, byStatus, byCategory, byUrgency, totalCost, avgCost, pendingUrgent, completionRate

### 3.10 Mock种子数据
- **POST** `repair-requests/seed`
- 15条覆盖各种状态的示例数据

## 4. 数据模型

```typescript
enum RepairStatus { PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED }
enum RepairCategory { ELECTRONIC, MECHANICAL, FURNITURE, PLUMBING, ELECTRIC, AC, OTHER }
enum UrgencyLevel { LOW, MEDIUM, HIGH, URGENT }

interface RepairRequest {
  id: string          // repair-{uuid}
  requestNo: string   // RR{yyMMdd}{4位序列号}
  title: string
  description: string
  category: RepairCategory
  urgency: UrgencyLevel
  status: RepairStatus
  reporterName: string
  reporterPhone: string
  location: string
  deviceName?: string
  deviceId?: string
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  completedAt?: string
  result?: string
  remark?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}
```

## 5. 租户隔离

所有数据通过 `tenantId` 隔离，使用 `@UseGuards(TenantGuard)` 和 `@TenantContext()` 装饰器。

## 6. 测试覆盖

### 6.1 Controller 测试（≥10个）
- 路由元数据验证（11个路由方法）
- 创建、列表、详情、更新、派单、开始、完成、取消、统计、种子数据

### 6.2 接口覆盖
- 正常流程：提交→派单→维修→完成
- 异常流程：重复派单、跳过状态、取消已完成工单
- 边界条件：非存在ID、跨租户隔离

## 7. 依赖

- NestJS Controller/Service pattern
- class-validator DTO
- @nestjs/common decorators
- vitest for testing
