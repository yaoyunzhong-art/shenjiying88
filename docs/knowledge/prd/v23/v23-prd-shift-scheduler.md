# 🗺️ PRD: 排班/考勤管理模块 (Phase 1)
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(64 tests) E2E✅(#56) PRD补写

**用途**: 门店排班核心管理——Controller(9端点)+Service+DTO+Entity+模块化设计
**产出**: `apps/api/src/modules/shift-scheduler/`
**作用**: V23 Phase 1 门店运营基础能力

## 🎯 目标

为门店提供完整的排班/考勤管理能力，支撑门店日常运营中的班次安排、员工签到/签退、换班审批等场景。

### 核心功能

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 排班CRUD | 排班创建的增删改查 | P0 |
| 考勤状态管理 | 签到/签退/缺勤/换班状态流转 | P0 |
| 周视图查询 | 按维度(员工/门店)查看周度排班 | P1 |
| 租户隔离 | 多门店数据隔离 | P0 |

## 📐 架构设计

```
Controller ──→ Service ──→ InMemory Store (Phase 1)
    │                │
    │                └── DTO Validation (class-validator)
    │
    └── TenantGuard (多租户隔离)
```

### 模块结构

```
shift-scheduler/
├── shift-scheduler.controller.ts     # 9 个 REST 端点
├── shift-scheduler.service.ts        # 业务逻辑 + 内存存储
├── shift-scheduler.dto.ts            # 请求/查询 DTO
├── shift-scheduler.entity.ts         # 实体类型 + 枚举
├── shift-scheduler.module.ts         # NestJS 模块注册
├── shift-scheduler.controller.test.ts  # 22 tests
├── shift-scheduler.service.test.ts   # 19 tests
├── shift-scheduler.module.test.ts    # 11 tests
├── shift-scheduler.role.test.ts      # 12 tests 角色旅程
```

### 数据模型

```typescript
enum ShiftType {
  Morning   = 'MORNING',    // 早班 08:00-16:00
  Afternoon = 'AFTERNOON',  // 午班 13:00-21:00
  Night     = 'NIGHT',      // 夜班 21:00-06:00
  FullDay   = 'FULL_DAY',   // 全天班
}

enum ShiftStatus {
  Scheduled   = 'SCHEDULED',   // 已排班
  CheckedIn   = 'CHECKED_IN',  // 已签到
  CheckedOut  = 'CHECKED_OUT', // 已签退
  Absent      = 'ABSENT',      // 缺勤
  Swapped     = 'SWAPPED',     // 已换班
}

interface ShiftSchedule {
  id: string
  employeeId: string
  employeeName: string
  date: string          // YYYY-MM-DD
  shiftType: ShiftType
  startTime: string     // HH:mm
  endTime: string       // HH:mm
  status: ShiftStatus
  location: string
  remark?: string
  tenantId: string
  createdAt: string
}
```

## 🛣️ 接口设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/shift-schedules` | 创建排班 |
| GET | `/shift-schedules` | 列表查询(支持筛选) |
| GET | `/shift-schedules/:shiftId` | 获取单条排班 |
| PATCH | `/shift-schedules/:shiftId` | 更新排班 |
| DELETE | `/shift-schedules/:shiftId` | 删除排班 |
| PATCH | `/shift-schedules/:shiftId/status` | 更新状态 |
| GET | `/shift-schedules/analysis/weekly` | 周视图 |
| GET | `/shift-schedules/analysis/employee-weekly` | 员工周视图 |
| POST | `/shift-schedules/seed` | Mock数据填充 |

### 查询筛选参数

- `shiftType` — 班次类型
- `status` — 状态
- `employeeId` — 员工ID
- `date` — 日期 YYYY-MM-DD
- `location` — 门店/位置

## 🏪 场景覆盖

### 正例
1. 创建排班 → 自动标记 SCHEDULED 状态
2. 按多种条件组合查询
3. 更新班次时间/地点
4. 状态流转(签到→签退)
5. 删除排班
6. 周视图/员工周视图分页

### 反例
1. 查询不存在的排班 → 抛出异常
2. 更新不存在的排班 → 抛出异常
3. 删除不存在的排班 → 抛出异常
4. 跨租户访问 → 隔离安全
5. 不存在跨租户泄漏

### 边界
1. 空数据列表 → 返回 []
2. 单条记录查询
3. 全量筛选条件下的精确匹配

## 👥 角色权限

| 角色 | 查看 | 创建 | 修改 | 换班 | 审批 |
|------|------|------|------|------|------|
| 👔店长 | ✅ | ✅ | ✅ | — | ✅ |
| 👥HR | ✅ | ✅ | ✅ | — | ✅ |
| 🛒前台 | ✅ | — | — | ✅ | — |
| 🎮导玩员 | ✅ | — | — | ✅ | — |
| 🎯运行专员 | ✅ | — | — | ✅ | — |
| 🔧安监 | ✅ | — | — | ✅ | — |
| 🤝团建 | ✅ | — | — | ✅ | — |
| 📢营销 | ✅ | — | — | ✅ | — |

## 📊 测试覆盖

| 文件 | 数量 | 覆盖内容 |
|------|------|----------|
| Controller | 22 | 9路由元数据 + 创建/查询/更新/删除/状态/周视图/种子 |
| Service | 19 | CRUD + 筛选 + 删除 + 周视图 + 种子 |
| Module | 11 | 实例化/元数据/方法签名/反例/边界 |
| Role | 12 | 8角色旅程 + 跨角色闭环 |

## 🔐 安全设计

- TenantGuard 确保多租户隔离
- 所有查询自动过滤 tenantId
- 删除/更新校验租户所有权

## 📋 后续计划

| 版本 | 功能 | 状态 |
|------|------|------|
| Phase 1 | 排班CRUD + 内存存储 | ✅ 已完成 |
| Phase 2 | 数据库持久化 | 📅 待规划 |
| Phase 3 | 换班审批流程 | 📅 待规划 |
| Phase 4 | 考勤统计报表 | 📅 待规划 |
| Phase 5 | 智能排班推荐 | 📅 待规划 |
