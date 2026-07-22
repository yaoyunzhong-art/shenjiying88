# 库存管理 (Inventory)

## 功能概述

库存管理模块负责企业商品库存的全链路管理，涵盖入库、出库、库存调拨、库存盘点、库存预警、批次管理、序列号追踪等核心功能。支持多仓库、多货位管理，提供实时库存查询、库存流水追溯、库存成本核算。与采购、销售、订单、物流等模块深度联动，实现库存数据的实时同步和库存优化建议。支持先进先出(FIFO)、后进先出(LIFO)、移动加权平均等多种成本核算方式，满足不同业务场景的库存管理需求。

## 核心概念

- **库存 (Stock)**：商品在仓库中的实际存量，包括可用库存、在途库存、锁定库存、冻结库存
- **仓库 (Warehouse)**：物理或虚拟的存储空间，支持多层级结构（区域 → 货架 → 货位）
- **货位 (Location)**：仓库内最小的存储单元，用于精确定位商品存放位置
- **入库单 (Inbound Order)**：商品进入仓库的业务单据，包含采购入库、退货入库、调拨入库等类型
- **出库单 (Outbound Order)**：商品出库的业务单据，包含销售出库、调拨出库、报废出库等类型
- **库存调拨 (Transfer)**：仓库间或仓库内货位间的库存转移
- **库存盘点 (Stocktake)**：周期性或临时性的库存实物清查，用于核对系统库存与实际库存的一致性
- **批次管理 (Batch)**：按生产批次对库存进行追踪管理，适用于保质期、批次追溯场景
- **序列号 (Serial Number)**：对单个商品进行唯一标识，适用于高价值或需追溯的商品
- **安全库存 (Safety Stock)**：为避免缺货而设置的最低库存警戒线
- **库存流水 (Stock Ledger)**：每一次库存变动的详细记录，形成完整的审计追踪

## 主要页面/路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/inventory` | 库存总览 | 库存概览仪表盘，显示库存总量、预警、周转率等 |
| `/inventory/list` | 库存明细 | 按商品/仓库/货位查看库存明细，支持多维度筛选 |
| `/inventory/stock/:id` | 库存详情 | 单个SKU的库存详情，含批次、序列号、流水记录 |
| `/inventory/inbound` | 入库管理 | 入库单列表、创建入库单、入库执行 |
| `/inventory/inbound/:id` | 入库单详情 | 查看入库单明细、执行入库操作 |
| `/inventory/outbound` | 出库管理 | 出库单列表、创建出库单、出库执行 |
| `/inventory/outbound/:id` | 出库单详情 | 查看出库单明细、执行出库操作 |
| `/inventory/transfer` | 库存调拨 | 调拨单管理，含调拨申请、调拨执行 |
| `/inventory/stocktake` | 库存盘点 | 盘点计划管理、盘点任务执行、差异处理 |
| `/inventory/batches` | 批次管理 | 商品批次查询、批次追溯、过期预警 |
| `/inventory/settings` | 库存设置 | 库存策略配置（安全库存、预警规则、成本核算方式） |

## 相关服务/API

| 服务 | 用途 |
|------|------|
| `InventoryQueryService` | 实时库存查询、库存汇总、多维透视 |
| `InboundService` | 入库单创建、审批、执行、退货入库管理 |
| `OutboundService` | 出库单创建、审批、执行、分配策略 |
| `TransferService` | 调拨申请、调拨执行、调拨接收 |
| `StocktakeService` | 盘点计划、盘点任务、差异分析与调整 |
| `BatchService` | 批次创建、批次追踪、保质期管理 |
| `SerialNumberService` | 序列号分配、序列号查询、序列号追溯 |
| `InventoryLockService` | 库存锁定/解锁（订单占用、活动预留） |
| `StockLedgerService` | 库存流水记录、审计追踪 |
| `InventoryAlertService` | 安全库存预警、过期预警、滞销预警 |

## 使用示例

### 库存查询

```typescript
// 查询指定SKU的实时库存
const stock = await inventoryQueryService.queryStock({
  skuId: 'sku-001234',
  warehouseIds: ['wh-001', 'wh-002'],
  includeSubWarehouses: true,
});

console.log(stock);
// {
//   skuId: 'sku-001234',
//   skuName: 'iPhone 16 Pro Max 256GB 原色',
//   totalQuantity: 1250,
//   availableQuantity: 980,
//   lockedQuantity: 200,
//   inboundQuantity: 70,
//   warehouses: [
//     { warehouseId: 'wh-001', available: 600, locked: 120 },
//     { warehouseId: 'wh-002', available: 380, locked: 80 },
//   ]
// }
```

### 创建入库单

```typescript
// 采购入库
const inbound = await inboundService.create({
  type: 'purchase',
  warehouseId: 'wh-001',
  sourceOrderId: 'po-202607-0001', // 关联采购订单
  expectedDate: '2026-07-24',
  items: [
    {
      skuId: 'sku-001234',
      quantity: 500,
      batch: { batchNo: 'B20260701', productionDate: '2026-07-01' },
      locationId: 'loc-A-01-01',
    },
  ],
  remark: '采购入库-华为P70',
});
```

### 库存盘点流程

```typescript
// 1. 创建盘点计划
const stocktakePlan = await stocktakeService.createPlan({
  warehouseId: 'wh-001',
  type: 'full', // 全盘
  scheduledDate: '2026-07-25',
  scope: { categories: ['cat-01', 'cat-02'] },
});

// 2. 录入盘点数据
const result = await stocktakeService.record(stocktakePlan.id, [
  { skuId: 'sku-001234', systemQty: 600, actualQty: 598, diff: -2 },
  { skuId: 'sku-001235', systemQty: 200, actualQty: 200, diff: 0 },
]);

// 3. 处理差异
await stocktakeService.processDiff(stocktakePlan.id, {
  action: 'adjust', // 按实盘数量调整系统库存
  reason: '盘点差异调整',
});
```

### 安全库存预警设置

```typescript
await inventoryAlertService.setSafetyStock({
  skuId: 'sku-001234',
  warehouseId: 'wh-001',
  safetyStock: 100,
  alertLevels: [
    { threshold: 200, level: 'warning', notify: true },
    { threshold: 100, level: 'critical', notify: true, notifyUsers: ['admin'] },
  ],
});
```
