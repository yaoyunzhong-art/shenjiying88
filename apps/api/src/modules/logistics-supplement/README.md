# logistics-supplement — 后勤补充模块

> 版本: V24 | 维护人: 树哥B | 最后更新: 2026-07-29

## 概述

后勤补充模块（P-30）提供运输调度、货物装载、路线规划、司机排班、车辆维保、油耗记录、事故处理和物流成本核算等完整后勤管理能力。

**设计原则:**
- 运输全链路闭环 — 从调度单到成本核算一站式覆盖
- 状态机驱动 — 每个子域有明确的状态流转规则
- 自动计算 — 油耗单价、运费总额、准时率等自动计算
- 异常防范 — 非法状态、重复操作、非法删除均被拦截

## 核心能力

| 能力 | 说明 |
|------|------|
| ✅ 运输调度单 | 创建/查询/列表/更新/状态流转/删除 (10种状态) |
| ✅ 货物装载 | 创建/状态更新 (7种状态) /单笔查询 |
| ✅ 路线规划 | 创建/优化(-15%距离/-10%时间)/更新/列表/删除 |
| ✅ 司机排班 | 创建/状态流转 (6种状态)/自动打卡/删除 |
| ✅ 车辆维保 | 创建/状态流转 (4种状态)/历史/待维保查询 |
| ✅ 油耗记录 | 创建/效率统计 (百公里油耗)/日期筛选/删除 |
| ✅ 事故记录 | 创建/查询/解决闭环 (防重复) |
| ✅ 物流成本 | 记录/按类型和车辆汇总/删除 |
| ✅ 统计指标 | 准时率/平均配送时长/在途单数等聚合 |

## 技术架构

### 模块依赖

```
LogisticsSupplementModule
  └─ LogisticsSupplementController (IdentityAccessGuard)
       └─ LogisticsSupplementService
```

### 存储

当前使用内存 Map 存储（单元测试友好），后续可替换为 Prisma/TypeORM 持久化。

### 状态机

```
运输单: draft → pending_approval → approved → dispatched → loading → in_transit → arrived → unloading → completed
        任意状态 → cancelled

货物: pending → loaded → in_transit → delivered
          ↘ damaged / lost / returned

路线: active / inactive / archived

排班: scheduled → checked_in → dispatched → on_break → completed
          ↘ absent

维保: pending → in_progress → completed
          ↘ cancelled
```

## API Endpoints

| Method | Path | 说明 |
|--------|------|------|
| POST   | /logistics-supplement/transport-orders | 创建运输单 |
| GET    | /logistics-supplement/transport-orders | 列表(支持筛选) |
| GET    | /logistics-supplement/transport-orders/:id | 详情 |
| PATCH  | /logistics-supplement/transport-orders/:id | 更新字段 |
| PATCH  | /logistics-supplement/transport-orders/:id/status | 更新状态 |
| DELETE | /logistics-supplement/transport-orders/:id | 删除(禁止删除途中单) |
| POST   | /logistics-supplement/cargo-loads | 添加货物 |
| GET    | /logistics-supplement/cargo-loads?transportOrderId= | 按单查询 |
| GET    | /logistics-supplement/cargo-loads/:id | 单笔查询 |
| PATCH  | /logistics-supplement/cargo-loads/:id/status | 更新货物状态 |
| POST   | /logistics-supplement/route-plans | 创建路线 |
| GET    | /logistics-supplement/route-plans | 列表 |
| GET    | /logistics-supplement/route-plans/:id | 详情 |
| PATCH  | /logistics-supplement/route-plans/:id | 更新路线 |
| POST   | /logistics-supplement/route-plans/:id/optimize | 优化路线 |
| DELETE | /logistics-supplement/route-plans/:id | 删除路线 |
| POST   | /logistics-supplement/driver-schedules | 创建排班 |
| GET    | /logistics-supplement/driver-schedules | 列表(支持司机/日期筛选) |
| GET    | /logistics-supplement/driver-schedules/:id | 详情 |
| PATCH  | /logistics-supplement/driver-schedules/:id/status | 更新排班状态 |
| DELETE | /logistics-supplement/driver-schedules/:id | 删除排班 |
| POST   | /logistics-supplement/maintenance | 创建维保 |
| GET    | /logistics-supplement/maintenance/:id | 详情 |
| GET    | /logistics-supplement/maintenance/vehicle/:vehicleId/history | 历史维保 |
| GET    | /logistics-supplement/maintenance/upcoming | 待维保列表 |
| PATCH  | /logistics-supplement/maintenance/:id/status | 更新维保状态 |
| POST   | /logistics-supplement/fuel | 记录油耗 |
| GET    | /logistics-supplement/fuel/:id | 详情 |
| GET    | /logistics-supplement/fuel/:vehicleId | 按车查询(支持日期) |
| GET    | /logistics-supplement/fuel/:vehicleId/efficiency | 油耗效率 |
| DELETE | /logistics-supplement/fuel/:id | 删除记录 |
| POST   | /logistics-supplement/accidents | 记录事故 |
| GET    | /logistics-supplement/accidents | 列表(支持车牌筛选) |
| GET    | /logistics-supplement/accidents/:id | 详情 |
| POST   | /logistics-supplement/accidents/:id/resolve | 解决事故 |
| POST   | /logistics-supplement/costs | 记录成本 |
| GET    | /logistics-supplement/costs/:id | 详情 |
| GET    | /logistics-supplement/costs/summary | 成本汇总(起止日期) |
| DELETE | /logistics-supplement/costs/:id | 删除成本 |
| GET    | /logistics-supplement/metrics | 统计指标 |
