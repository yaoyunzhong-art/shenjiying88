# logistics-supplement — 后勤补充模块

> 版本: V24 | 维护人: 树哥B | 最后更新: 2026-07-29

## 概述

后勤补充模块（P-30）提供运输调度、货物装载、路线规划、司机排班、车辆维保、油耗记录、事故处理和物流成本核算等 **8 大后勤管理能力**。

**设计原则:**
- **运输全链路闭环** — 从调度单创建到成本核算一站式覆盖
- **状态机驱动** — 每个子域有明确的状态流转规则和校验
- **自动计算** — 油耗单价、运费总额、准时率、百公里油耗自动推导
- **异常防范** — 非法状态值、重复操作、非法删除全部拦截

## 核心能力

| 能力 | 说明 | 状态数 |
|------|------|--------|
| ✅ 运输调度单 | 创建/查询/列表(筛选)/更新/状态流转/删除 | 10 |
| ✅ 货物装载 | 创建/7 种状态更新/查询 | 7 |
| ✅ 路线规划 | 创建/优化(-15%/-10%)/更新/列表/删除 | 3 |
| ✅ 司机排班 | 创建/6 种状态流转/自动打卡/筛选 | 6 |
| ✅ 车辆维保 | 创建/5 种状态流转/历史/待维保查询 | 5 |
| ✅ 油耗记录 | 创建/效率统计(百公里)/日期筛选/删除 | — |
| ✅ 事故记录 | 创建/查询/解决闭环(防重复) | 4 级严重度 |
| ✅ 物流成本 | 按类型&车辆汇总/期间筛选 | 10 种类型 |
| ✅ 统计指标 | 准时率/平均配送时长/在途单数/事故数 | — |

## 技术架构

### 模块依赖

```
LogisticsSupplementModule
  └─ LogisticsSupplementController (@UseGuards(TrafficGovernanceGuard))
       └─ LogisticsSupplementService (内存 Map 存储)
```

- 模块独立导出（`index.ts`）
- 依赖 NestJS 公共组件 `TrafficGovernanceGuard`
- 通过 DTO 类型验证（`class-validator` + `ValidationPipe`）

### 存储设计

当前使用 **内存 Map 存储**，每个子域独立 Map：

```typescript
private transportOrders = new Map<string, TransportOrder>()
private cargoLoads = new Map<string, CargoLoad>()
private routePlans = new Map<string, RoutePlan>()
private driverSchedules = new Map<string, DriverSchedule>()
private vehicleMaintenance = new Map<string, VehicleMaintenanceRecord>()
private fuelRecords = new Map<string, FuelRecord>()
private accidentRecords = new Map<string, AccidentRecord>()
private costs = new Map<string, LogisticsCost>()
```

> 后续可替换为 Prisma/TypeORM 持久化，Service 接口保持兼容。

### 状态机流转

```
运输单:
  draft → pending_approval → approved → dispatched → loading
  → in_transit → arrived → unloading → completed
  (任意状态 → cancelled)

货物:
  pending → loaded → in_transit → delivered
           ↘ damaged / lost / returned

路线: active ↔ inactive → archived

排班:
  scheduled → checked_in → dispatched → on_break → completed
            ↘ absent

维保:
  pending → scheduled → in_progress → completed
          ↘ cancelled
```

### ID 生成

所有实体使用 `prefix-uuid` 格式：`to-xxx`, `cl-xxx`, `rp-xxx`, `ds-xxx`, `vm-xxx`, `fr-xxx`, `ac-xxx`, `lc-xxx`

## API Endpoints

### 运输调度单 `TransportOrder`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/transport-orders` | 创建运输单 |
| GET    | `/logistics-supplement/transport-orders` | 列表（支持 status/tenantId 筛选） |
| GET    | `/logistics-supplement/transport-orders/:id` | 详情 |
| PATCH  | `/logistics-supplement/transport-orders/:id` | 更新字段 |
| PATCH  | `/logistics-supplement/transport-orders/:id/status` | 更新状态 |
| DELETE | `/logistics-supplement/transport-orders/:id` | 删除（禁止删除 in_transit 单） |

### 货物装载 `CargoLoad`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/cargo-loads` | 添加货物 |
| GET    | `/logistics-supplement/cargo-loads?transportOrderId=` | 按单查询 |
| GET    | `/logistics-supplement/cargo-loads/:id` | 单笔查询 |
| PATCH  | `/logistics-supplement/cargo-loads/:id/status` | 更新货物状态 |

### 路线规划 `RoutePlan`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/route-plans` | 创建路线 |
| GET    | `/logistics-supplement/route-plans` | 列表（支持 status 筛选） |
| GET    | `/logistics-supplement/route-plans/:id` | 详情 |
| PATCH  | `/logistics-supplement/route-plans/:id` | 更新路线 |
| POST   | `/logistics-supplement/route-plans/:id/optimize` | 优化路线（距离-15%, 时间-10%） |
| DELETE | `/logistics-supplement/route-plans/:id` | 删除路线 |

### 司机排班 `DriverSchedule`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/driver-schedules` | 创建排班 |
| GET    | `/logistics-supplement/driver-schedules?driverId=&date=` | 列表（支持司机/日期筛选） |
| GET    | `/logistics-supplement/driver-schedules/:id` | 详情 |
| PATCH  | `/logistics-supplement/driver-schedules/:id/status` | 更新排班状态 |
| DELETE | `/logistics-supplement/driver-schedules/:id` | 删除排班 |

### 车辆维保 `VehicleMaintenanceRecord`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/maintenance` | 创建维保记录 |
| GET    | `/logistics-supplement/maintenance/:id` | 详情 |
| GET    | `/logistics-supplement/maintenance/vehicle/:vehicleId/history` | 车辆维保历史 |
| GET    | `/logistics-supplement/maintenance/upcoming?vehicleId=` | 待维保列表 |
| PATCH  | `/logistics-supplement/maintenance/:id/status` | 更新维保状态 |

### 油耗记录 `FuelRecord`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/fuel-records` | 记录油耗 |
| GET    | `/logistics-supplement/fuel-records/:id` | 单条查询 |
| GET    | `/logistics-supplement/fuel-records?vehicleId=&startDate=&endDate=` | 按车辆/日期查询 |
| GET    | `/logistics-supplement/fuel-records/efficiency/:vehicleId` | 百公里油耗统计 |
| DELETE | `/logistics-supplement/fuel-records/:id` | 删除 |

### 事故记录 `AccidentRecord`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/accidents` | 记录事故 |
| GET    | `/logistics-supplement/accidents?vehicleId=` | 列表（支持车牌筛选） |
| GET    | `/logistics-supplement/accidents/:id` | 详情 |
| POST   | `/logistics-supplement/accidents/:id/resolve` | 解决事故 |

### 物流成本 `LogisticsCost`

| Method | Path | 说明 |
|--------|------|------|
| POST   | `/logistics-supplement/costs` | 记录成本 |
| GET    | `/logistics-supplement/costs/:id` | 详情 |
| GET    | `/logistics-supplement/costs/summary?startDate=&endDate=` | 成本汇总 |
| DELETE | `/logistics-supplement/costs/:id` | 删除 |

### 统计指标

| Method | Path | 说明 |
|--------|------|------|
| GET    | `/logistics-supplement/metrics` | 准时率/平均配送时长等聚合指标 |

## 测试覆盖

```
Test Files  5 passed (5)
     Tests  134 passed (134)
```

| 文件 | 数量 | 覆盖重心 |
|------|------|----------|
| `service.spec.ts` (root) | 16 | 8 个子域基础 CRUD |
| `service.supplement.spec.ts` (root) | 32 | 未覆盖方法补全 + 全部异常 |
| `__tests__/service.spec.ts` | 29 | 完整 CRUD + 统计指标 |
| `__tests__/service.edge.spec.ts` | 20 | 边界/异常深度覆盖 |
| `__tests__/controller.spec.ts` | 37 | 路由映射 |

## 使用示例

```typescript
// 创建运输调度单
const order = await service.createTransportOrder({
  tenantId: 't-001',
  orderNumber: 'TO-2026-001',
  transportType: 'normal',
  originWarehouseCode: 'WH-SH',
  destinationWarehouseCode: 'WH-SZ',
  items: [{ cargoId: 'c1', cargoName: '电子元器件', quantity: 100, unit: '箱', weightKg: 500 }],
  createdBy: 'u-001',
})

// 状态流转
await service.updateTransportOrderStatus(order.id, 'in_transit')

// 路线优化
const route = await service.createRoutePlan({ ... })
const optimized = await service.optimizeRoute(route.id)

// 统计指标
const metrics = await service.getMetrics()
console.log(metrics.onTimeDeliveryRate) // 准时率 %
```
