# 考勤模块 (Attendance)

考勤管理模块，提供门店员工的打卡记录、考勤统计汇总、请假申请与审批等核心功能。

## 一、模块概述

**业务定位**: 连锁门店场景下的员工考勤管理子系统，支撑门店员工日常打卡、考勤异常监控、请假审批管理等业务需求。

**业务目标**:
- 为门店员工和管理层提供标准化的打卡记录能力
- 实时统计各门店考勤状况（正常/迟到/早退/缺勤/加班）
- 支持完整的请假申请与审批流程（年假/病假/事假/婚假/产假/丧假）

**核心能力**:
| 能力 | 说明 |
|------|------|
| 打卡管理 | 上班打卡、下班打卡，自动判定迟到/早退/加班 |
| 考勤统计 | 按门店/时间段/状态维度汇总考勤数据 |
| 请假管理 | 请假申请、审批、取消，支持多种请假类型 |

**模块依赖**:
- 不依赖外部模块，独立运行
- 基于内存存储（`Map<string, ClockRecord>`），可替换为数据库持久化

---

## 二、架构图

```
┌──────────────────────────────────────────────────────┐
│                    AttendanceModule                   │
│                                                       │
│  ┌───────────────────────────────────────────────┐    │
│  │              AttendanceService                 │    │
│  │                                                 │    │
│  │  ┌──────────┐  ┌─────────────┐  ┌─────────┐  │    │
│  │  │ 打卡管理  │  │ 考勤统计    │  │ 请假管理 │  │    │
│  │  │ ──────── │  │ ─────────  │  │ ──────── │  │    │
│  │  │ clockIn  │  │ getSummary  │  │ createLeave│  │    │
│  │  │ clockOut │  │             │  │ approve   │  │    │
│  │  │ getRecord│  │             │  │ cancel    │  │    │
│  │  │ list     │  │             │  │ listLeaves│  │    │
│  │  └────┬─────┘  └──────┬──────┘  └─────┬─────┘  │    │
│  │       │               │               │         │    │
│  │       └───────┬───────┴───────┬───────┘         │    │
│  │               │               │                  │    │
│  │               ▼               ▼                  │    │
│  │        ┌───────────┐  ┌─────────────┐          │    │
│  │        │ records[] │  │ leaveReqs[] │          │    │
│  │        │ (Map)     │  │ (Map)       │          │    │
│  │        └───────────┘  └─────────────┘          │    │
│  └───────────────────────────────────────────────┘    │
│                                                       │
│  外部访问: 无 Controller                               │
│  (通过 exports: [AttendanceService] 暴露给其他模块)     │
└──────────────────────────────────────────────────────┘

数据流:
  打卡请求 ──→ clockIn() ──→ 创建 ClockRecord ──→ 存入 records Map
  打卡请求 ──→ clockOut() ──→ 更新 ClockRecord ──→ 计算早退/加班
  统计请求 ──→ getSummary() ──→ 过滤 records ──→ 汇总统计结果
  请假申请 ──→ createLeave() ──→ 创建 LeaveRequest ──→ 存入 leaveRequests Map
  审批动作 ──→ approveLeave() ──→ 更新状态（approve/reject）
```

---

## 三、核心表结构

### ClockRecord (打卡记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 记录 ID，自动生成 |
| employeeId | string | 员工 ID |
| employeeName | string | 员工姓名 |
| storeId | string | 门店 ID |
| date | string | 打卡日期（YYYY-MM-DD） |
| clockIn | string | 上班打卡时间（HH:mm） |
| clockOut | string \| null | 下班打卡时间（HH:mm） |
| status | AttendanceStatus | 考勤状态（见下方枚举） |
| lateMinutes | number | 迟到分钟数 |
| earlyLeaveMinutes | number | 早退分钟数 |
| overtimeMinutes | number | 加班分钟数 |
| note | string? | 备注 |
| createdAt / updatedAt | string | 时间戳 |

### AttendanceStatus 枚举

| 值 | 中文 |
|----|------|
| normal | 正常 |
| late | 迟到 |
| early_leave | 早退 |
| absent | 缺勤 |
| leave | 请假 |
| overtime | 加班 |

### LeaveRequest (请假记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 请假单 ID，自动生成 |
| employeeId | string | 员工 ID |
| employeeName | string | 员工姓名 |
| storeId | string | 门店 ID |
| leaveType | LeaveType | 请假类型 |
| startDate / endDate | string | 请假起止日期 |
| reason | string | 请假原因 |
| status | LeaveStatus | 审批状态 |
| approverId / approverName | string? | 审批人信息 |
| approvalRemark | string? | 审批备注 |
| createdAt / updatedAt | string | 时间戳 |

### LeaveStatus 枚举

| 值 | 中文 |
|----|------|
| pending | 待审批 |
| approved | 已通过 |
| rejected | 已驳回 |
| cancelled | 已取消 |

### LeaveType 枚举

| 值 | 中文 |
|----|------|
| annual | 年假 |
| sick | 病假 |
| personal | 事假 |
| marriage | 婚假 |
| maternity | 产假 |
| bereavement | 丧假 |

---

## 四、关键 API / Service 接口

### AttendanceService

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `clockIn(input)` | `AttendanceCalcRequest` | `ClockRecord` | 上班打卡，自动判定是否迟到 |
| `clockOut(recordId, clockOutTime)` | `string, string` | `ClockRecord` | 下班打卡，自动计算早退/加班 |
| `getRecord(id)` | `string` | `ClockRecord \| null` | 查询单条打卡记录 |
| `listRecords(filter?)` | `{employeeId?, storeId?, date?, status?, from?, to?}` | `ClockRecord[]` | 多维度过滤列表查询 |
| `getSummary(period, from, to, storeId?)` | `string, string, string, string?` | `AttendanceSummary` | 考勤统计汇总（含门店维度） |
| `createLeave(input)` | `{employeeId, employeeName, storeId, leaveType, startDate, endDate, reason}` | `LeaveRequest` | 创建请假申请 |
| `approveLeave(id, approverId, approverName, action, remark?)` | `string, string, string, 'approve'\|'reject', string?` | `LeaveRequest` | 审批/驳回请假 |
| `cancelLeave(id)` | `string` | `LeaveRequest` | 取消请假 |
| `getLeave(id)` | `string` | `LeaveRequest \| null` | 查询请假单详情 |
| `listLeaves(filter?)` | `{employeeId?, storeId?, status?}` | `LeaveRequest[]` | 过滤查询请假列表 |

### 考勤自动判定规则

| 规则 | 条件 | 结果 |
|------|------|------|
| 迟到 | clockIn > 09:00 | lateMinutes += 差值, status = 'late' |
| 早退 | clockOut < 18:00 | earlyLeaveMinutes += 差值, status = 'early_leave' |
| 加班 | clockOut > 18:00 | overtimeMinutes += 差值, status = 'overtime' |
| 加班抢高 | 同时满足早退和加班 | 优先标记为 overtime |

---

## 五、配置 / 部署 / 测试指引

### 环境变量

当前模块无额外环境变量依赖。

### 运行配置

NestJS 模块自动注册，无需手动配置：

```typescript
// 在父模块中引入
import { AttendanceModule } from './attendance/attendance.module'

@Module({
  imports: [AttendanceModule],
})
export class SomeParentModule {}
```

### 测试命令

```bash
# 运行考勤模块全部测试
cd apps/api && npx jest attendance

# 运行角色扩展测试
cd apps/api && npx jest attendance.role-extended

# 运行完整 Service 测试
cd apps/api && npx jest attendance.service.full

# 带覆盖率报告
cd apps/api && npx jest attendance --coverage
```

### 测试文件说明

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `attendance.service.full.test.ts` | 单元测试 (Service) | 打卡/统计/请假全流程 |
| `attendance.role-extended.test.ts` | 角色扩展测试 | 多角色权限场景 |

### 部署注意事项

- 当前使用 `Map<string, ClockRecord>` 内存存储，生产环境应替换为数据库
- 下班时间（18:00）和上班时间（09:00）为硬编码，后续可改为配置项
- 模块无 `Controller`，通过 `exports: [AttendanceService]` 被其他模块引用
