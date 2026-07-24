# 后勤管理模块 (Logistics Management)

## 模块概述

门店后勤管理模块，提供门店运营所需的采购订单、供应商管理、库存物品管理及设备维护任务全生命周期管理。当前为 P-30 骨架阶段，数据存储在 in-memory Map 中，后续替换为 Prisma 持久化。

## 功能范围

| 功能域 | 说明 |
|--------|------|
| 采购订单管理 | 创建/查询/更新/删除采购订单，支持订单状态流转 |
| 供应商管理 | 供应商注册、资质评估、联系人管理、等级评级 |
| 库存物品管理 | 物品入库/出库/盘点、低库存预警、库存物品分类 |
| 设备维护任务 | 维护任务创建、指派、排期、完成闭环，支持多种任务类型 |
| 后勤统计指标 | 聚合展示订单/供应商/库存/维护任务概况 |

## 目录结构

```
logistics-management/
├── logistics-management.module.ts         — NestJS 模块 (Controller + Service)
├── logistics-management.controller.ts     — REST 控制器 (4 组 CRUD + 统计)
├── logistics-management.service.ts        — 核心业务逻辑 (in-memory 存储)
├── logistics-management.entity.ts         — TypeScript 类型定义 + ID 生成器
├── logistics-management.dto.ts            — 请求/响应 DTO (class-validator)
├── logistics-management.module.test.ts    — 模块加载测试
├── logistics-management.controller.test.ts— 控制器测试
├── logistics-management.service.test.ts   — 服务测试
├── logistics-management.dto.test.ts       — DTO 验证测试
└── logistics-management.entity.test.ts    — 实体类型测试
```

## 核心数据结构

### 采购订单 (SupplyOrder)

```typescript
interface SupplyOrder {
  id: string            // 格式: so-{uuid}
  tenantId: string
  storeId?: string
  orderNumber: string   // 订单编号
  vendorId: string
  vendorName: string
  items: SupplyOrderItem[]  // 订单行 { inventoryItemId, itemName, unit, quantity, unitPrice, totalPrice }
  totalAmount: number   // 总金额（分）
  status: SupplyOrderStatus  // draft → pending_approval → approved → ordered → partial_received → received
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  notes?: string
}
```

### 供应商 (SupplyVendor)

```typescript
interface SupplyVendor {
  id: string            // 格式: sv-{uuid}
  tenantId: string
  code: string          // 供应商编码
  name: string
  category: string      // 主营品类
  status: VendorStatus  // active | inactive | suspended
  grade: VendorGrade    // A | B | C | D
  contacts: VendorContact[]
  cooperationYears: number
  averageScore: number
}
```

### 库存物品 (InventoryItem)

```typescript
interface InventoryItem {
  id: string            // 格式: inv-{uuid}
  tenantId: string
  itemCode: string
  name: string
  category: InventoryCategory  // consumable | spare_part | tool | equipment | cleaning_supply | office_supply | other
  unit: string
  quantity: number
  minQuantity: number
  unitCost?: number
  warehouseCode?: string
  location?: string
}
```

### 维护任务 (MaintenanceTask)

```typescript
interface MaintenanceTask {
  id: string            // 格式: mt-{uuid}
  tenantId: string
  equipmentName: string
  taskType: MaintenanceTaskType  // routine_inspection | repair | preventive_maintenance | emergency_repair | cleaning
  priority: MaintenanceTaskPriority  // low | medium | high | critical
  status: MaintenanceTaskStatus  // pending → assigned → in_progress → completed
  assigneeId?: string
  scheduledAt?: string
  description: string
}
```

## REST 接口

### 采购订单

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/logistics-management/supply-orders` | 创建采购订单 |
| `GET` | `/api/logistics-management/supply-orders` | 查询采购订单列表 |
| `GET` | `/api/logistics-management/supply-orders/:id` | 查询单个采购订单 |
| `PATCH` | `/api/logistics-management/supply-orders/:id` | 更新采购订单 |
| `DELETE` | `/api/logistics-management/supply-orders/:id` | 删除采购订单 |

### 供应商

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/logistics-management/supply-vendors` | 创建供应商 |
| `GET` | `/api/logistics-management/supply-vendors` | 查询供应商列表 |
| `GET` | `/api/logistics-management/supply-vendors/:id` | 查询单个供应商 |
| `PATCH` | `/api/logistics-management/supply-vendors/:id` | 更新供应商 |
| `DELETE` | `/api/logistics-management/supply-vendors/:id` | 删除供应商 |

### 库存物品

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/logistics-management/inventory-items` | 创建库存物品 |
| `GET` | `/api/logistics-management/inventory-items` | 查询库存物品列表 |
| `GET` | `/api/logistics-management/inventory-items/:id` | 查询单个物品 |
| `PATCH` | `/api/logistics-management/inventory-items/:id` | 更新物品信息 |
| `DELETE` | `/api/logistics-management/inventory-items/:id` | 删除物品 |
| `POST` | `/api/logistics-management/inventory-items/:id/stocktake` | 库存盘点 |
| `GET` | `/api/logistics-management/inventory-items/low-stock` | 低库存物品预警 |

### 维护任务

| 方法 | 路由 | 说明 |
|------|------|------|
| `POST` | `/api/logistics-management/maintenance-tasks` | 创建维护任务 |
| `GET` | `/api/logistics-management/maintenance-tasks` | 查询维护任务列表 |
| `GET` | `/api/logistics-management/maintenance-tasks/:id` | 查询单个任务 |
| `PATCH` | `/api/logistics-management/maintenance-tasks/:id` | 更新任务状态/指派 |
| `DELETE` | `/api/logistics-management/maintenance-tasks/:id` | 删除任务 |
| `GET` | `/api/logistics-management/maintenance-tasks/due` | 到期未完成维护任务 |

### 统计

| 方法 | 路由 | 说明 |
|------|------|------|
| `GET` | `/api/logistics-management/metrics` | 后勤管理总计指标 |

## 使用示例

### 创建采购订单

```bash
curl -X POST http://localhost:3000/api/logistics-management/supply-orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "orderNumber": "PO-202607-001",
    "vendorId": "sv-xxx",
    "vendorName": "供应商A",
    "items": [{"inventoryItemId": "inv-xxx", "itemName": "纸巾", "unit": "箱", "quantity": 10, "unitPrice": 5000}]
  }'
```

### 创建库存物品

```bash
curl -X POST http://localhost:3000/api/logistics-management/inventory-items \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "itemCode": "TOWEL-001",
    "name": "擦手纸",
    "category": "consumable",
    "unit": "包",
    "quantity": 100,
    "minQuantity": 20,
    "unitCost": 1500
  }'
```

### 创建维护任务

```bash
curl -X POST http://localhost:3000/api/logistics-management/maintenance-tasks \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "equipmentName": "按摩椅#03",
    "taskType": "routine_inspection",
    "priority": "medium",
    "description": "月度检查按摩椅安全及功能正常性",
    "scheduledAt": "2026-07-25T09:00:00Z"
  }'
```

### 库存盘点

```bash
curl -X POST http://localhost:3000/api/logistics-management/inventory-items/inv-xxx/stocktake \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"quantity": 95, "note": "月盘点，损耗5包"}'
```

### 查询统计指标

```bash
curl http://localhost:3000/api/logistics-management/metrics \
  -H "x-tenant-id: tenant-demo"
```

## 依赖关系

| 依赖 | 说明 |
|------|------|
| NestJS (Common/Core) | 框架基础 |
| `@nestjs/common` (ValidationPipe) | DTO 验证管道 |
| `class-validator` / `class-transformer` | 请求参数校验 |
| `agent/tenant.guard` | 多租户守卫（所有端点强制租户隔离） |
| 当前: in-memory Map | 骨架阶段临时存储 |
| 后续: Prisma | 计划替换为数据库持久化 |

## 运行测试

```bash
npx jest apps/api/src/modules/logistics-management/logistics-management.module.test.ts
npx jest apps/api/src/modules/logistics-management/logistics-management.service.test.ts
npx jest apps/api/src/modules/logistics-management/logistics-management.controller.test.ts
npx jest apps/api/src/modules/logistics-management/logistics-management.dto.test.ts
npx jest apps/api/src/modules/logistics-management/logistics-management.entity.test.ts
```
