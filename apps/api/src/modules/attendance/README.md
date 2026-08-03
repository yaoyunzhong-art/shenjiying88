# attendance — 考勤管理模块

> 版本: V23 | 维护人: 树哥A | 最后更新: 2026-07-28

## 概述

考勤管理模块提供门店员工打卡、考勤统计和请假审批的完整闭环。支持迟到/早退/加班自动计算，按门店维度汇总考勤数据，以及多类型请假申请与审批流。

**设计原则:**
- 打卡即考勤 → 实时记录，状态自动判定
- 门店维度聚合 → 支持多门店统一管理
- 请假闭环 → 创建→审批→取消 全生命周期
- 数据安全 → 租户隔离（TenantGuard），RBAC 权限

## 核心能力

| 能力 | 说明 |
|------|------|
| ✅ 打卡记录 | 上班打卡、下班打卡、迟到/早退/加班自动计算 |
| ✅ 考勤统计 | 日/周/月维度汇总，迟到/早退/缺勤/加班 分项统计 |
| ✅ 请假管理 | 年假/病假/事假/婚假/产假/丧假多类型，审批流 |
| ✅ 门店维度 | 按门店聚合考勤数据，支持跨店管理 |
| ✅ 权限控制 | 基于 RBAC 的打卡/查询/统计/审批权限分离 |

## 技术架构

### 模块依赖

```
AttendanceModule
├── AttendanceController  → REST API 端点 (TenantGuard + RBAC)
├── AttendanceService     → 核心业务逻辑 (内存存储)
│   └── 数据存储: Map<string, ClockRecord> + Map<string, LeaveRequest>
└── 外部依赖:
    └── TenantGuard        → 多租户隔离守卫
    └── IdentityAccess     → 权限装饰器 (RequirePermissions)
```

### 状态模型

**考勤状态机:**
```
打卡in → normal (准时) / late (迟到)
打卡out → early_leave (早退) / overtime (加班)
```

**请假状态机:**
```
pending → approved / rejected / cancelled
```

### 实体类型

| 实体 | 字段 | 说明 |
|------|------|------|
| `ClockRecord` | id, employeeId, storeId, date, clockIn, clockOut, status, lateMinutes, earlyLeaveMinutes, overtimeMinutes | 打卡记录 |
| `AttendanceSummary` | period, from, to, totalEmployees, totalDays, normalCount, lateCount, earlyLeaveCount, absentCount, leaveCount, overtimeCount, totalOvertimeMinutes, byStore | 考勤汇总 |
| `LeaveRequest` | id, employeeId, storeId, leaveType, startDate, endDate, reason, status, approverId | 请假申请 |

## 配置说明

### 隐式配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 上班时间 | 09:00 | 打卡异常判定的基准时间 |
| 下班时间 | 18:00 | 早退/加班判定的基准时间 |
| 数据存储 | 内存 Map | ⚠️ 当前使用内存存储，生产需迁移至 Prisma/数据库 |

### 环境变量

> 当前无独立环境变量。定价策略和业务参数均为硬编码，后续应迁移至配置中心。

## API / 接口

### REST API 端点

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/attendance/clock-in` | `att:clock` | 员工打卡签到 |
| POST | `/attendance/records` | `att:list` | 打卡记录查询(支持 employeeId/storeId/date/status/from/to 筛选) |
| POST | `/attendance/summary` | `att:summary` | 考勤统计汇总(日/周/月) |
| POST | `/attendance/leave/approve` | `att:leave:approve` | 请假审批通过 |
| POST | `/attendance/leave/reject` | `att:leave:approve` | 请假驳回 |

### RBAC 角色权限说明

| 权限标识 | 适用范围 | 分配对象 |
|----------|----------|----------|
| `att:clock` | 打卡操作 | 门店员工 |
| `att:list` | 查询打卡记录 | 门店管理员 / 区域经理 |
| `att:summary` | 查看考勤统计 | 区域经理 / HR |
| `att:leave:approve` | 请假审批/驳回 | 门店店长 / 区域经理 |

### 数据安全注意事项

- 所有端点强制 `@UseGuards(TenantGuard)` 实现租户隔离
- 查询接口默认只返回当前租户数据
- 请假审批需校验权限，未授权用户无法操作
- ⚠️ 内存存储无数据持久化，重启后数据丢失

## 监控指标

### 关键监控指标

| 指标 | 类型 | 说明 | 建议阈值 |
|------|------|------|----------|
| `attendance.clock_in.count` | Counter | 打卡次数 | - |
| `attendance.late.rate` | Gauge | 迟到率 = lateCount / totalDays | 🔴 > 20% |
| `attendance.early_leave.rate` | Gauge | 早退率 = earlyLeaveCount / totalDays | 🔴 > 15% |
| `attendance.absent.rate` | Gauge | 缺勤率 = absentCount / totalDays | 🔴 > 5% |
| `attendance.overtime.hours` | Gauge | 加班总时长(分钟) | 🟡 > 5000min/周 |
| `attendance.leave.pending` | Gauge | 待审批请假数 | 🟡 > 10 |
| `attendance.leave.approval.time` | Histogram | 请假审批响应时间(ms) | 🔴 > 60000ms |

### 告警规则

| 告警名称 | 条件 | 级别 | 响应 |
|----------|------|------|------|
| 高迟到率 | 迟到率 > 20% | P2 | 通知区域经理排查原因 |
| 高缺勤率 | 缺勤率 > 5% | P1 | 通知HR确认员工状态 |
| 请假堆积 | 待审批 > 10 | P3 | 提醒审批人及时处理 |
| 长审批滞后 | 审批时间 > 24h | P3 | 升级通知上级审批人 |

## 运维要求

### 健康检查

```bash
# 模块存活检测
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/attendance/clock-in \
  -H "x-tenant-id: test-tenant" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"e1","employeeName":"test","storeId":"s1","date":"2026-07-28","clockIn":"09:00"}'
# 预期: 200

# 统计接口存活检测
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/attendance/summary \
  -H "x-tenant-id: test-tenant" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"period":"daily","from":"2026-07-01","to":"2026-07-28"}'
# 预期: 200
```

### 故障恢复

| 场景 | 影响 | 恢复步骤 |
|------|------|----------|
| 内存数据丢失 | 所有打卡/请假记录丢失 | 1. 迁移至 Prisma 持久化存储<br>2. 重构 seed 数据逻辑<br>3. 从数据库重建考勤数据 |
| 权限配置错误 | API 返回 403 | 1. 检查 `att:clock` 等权限在 RBAC 中正确定义<br>2. 验证 TenantGuard 正确注入 |
| 时区偏差 | 迟到/加班计算异常 | 1. 确认所有时间戳按 UTC+8 存储<br>2. 验证 clockIn/clockOut 时间比较逻辑 |
| 接口超时 | 统计接口返回缓慢 | 1. 大数据量时添加分页<br>2. 增加索引/缓存 |

### 测试指引

```bash
# 单元测试
npx jest apps/api/src/modules/attendance/attendance.service.spec.ts
npx jest apps/api/src/modules/attendance/attendance.service.edge.test.ts
npx jest apps/api/src/modules/attendance/attendance.service.full.test.ts
npx jest apps/api/src/modules/attendance/attendance.service-extended.spec.ts
npx jest apps/api/src/modules/attendance/attendance.service.bonus.spec.ts
npx jest apps/api/src/modules/attendance/attendance.controller.metadata.test.ts

# E2E + 角色测试
npx jest apps/api/src/modules/attendance/attendance.role-extended.test.ts
npx jest apps/api/src/modules/attendance/attendance.zz-boost-25.test.ts
npx jest apps/api/src/modules/attendance/attendance.entity.boost.test.ts
npx jest apps/api/src/modules/attendance/zz-attendance.service-boost.test.ts
```

> 共 10 个测试文件，覆盖 Service 核心逻辑、边界条件、RBAC 角色权限、E2E 集成路径。
