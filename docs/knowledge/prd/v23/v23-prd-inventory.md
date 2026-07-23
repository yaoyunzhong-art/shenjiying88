# V23 PRD 摘要卡 · 进销存基础 (WP-05A)

| 字段 | 值 |
|---|---|
| **模块** | Inventory (进销存) |
| **PBS** | WP-05A |
| **优先级** | P1 |
| **BS-Refs** | BS-0086, BS-0087, BS-0088, BS-0089, BS-0093 |
| **团队** | 底座开发组 |
| **状态** | 📋 现状扫描完成 |

---

## 1. 现有模块架构总览

进销存能力分散在 **7 个模块**、**20+ 服务**、**10+ 实体** 中，两条并行体系共存：

### 体系 A: `inventory/` 模块 (in-memory 原型, 最完整)

| 文件 | 职责 | DB |
|---|---|---|
| `inventory.service.ts` | 商品 CRUD + 出入库 + 供应商 + 采购单 (基础流) | 内存 Map |
| `inventory-item.service.ts` | SKU 维度库存 (InventoryItem) + 预留/释放/审计 | 内存 Map |
| `inventory-mgmt.service.ts` | 盘点 + 跨店调拨 + 采购单流转 | 内存 Map |
| `inventory-product.service.ts` | ProductService + SKUService (含 Redis Lua 原子锁模拟) | 内存 Map |
| `inventory-purchase.service.ts` | 采购单增强 (审批流/付款/退货/统计/预警) | 内存 Map |
| `purchase-order.service.ts` | 采购订单流转 + 历史记录 + 时间线 + 批量审批 | 内存 Map |
| `inventory.cron.ts` | Cron 过期预留清理 (InventoryReservationCron) | 内存 |
| `inventory.controller.ts` | REST 控制器 (products/stock/suppliers/purchase-orders) | — |
| `inventory-purchase.controller.ts` | 采购增强控制器 | — |
| `purchase-order.controller.ts` | 采购订单流转控制器 | — |

### 体系 B: `stock/` 模块 (TypeORM, 生产级)

| 文件 | 职责 | DB |
|---|---|---|
| `stock.service.ts` | 库存商品 CRUD + 出入库 (事务) + 低库存告警 | TypeORM Postgres |
| `stock.controller.ts` | REST 控制器 (Swagger) | — |
| `stock-item.entity.ts` | `stock_item` 表实体 | TypeORM |
| `stock-transaction.entity.ts` | `stock_transaction` 表实体 | TypeORM |

### 辅助模块

| 模块 | 职责 | 与进销存关系 |
|---|---|---|
| `supplier-manager/` | 供应商全管理 (状态/评级/24 家 mock) | 供应端参考 |
| `procurement-order/` | 采购订单 + 状态机 + 收货 | 采购流参考 |
| `warehouse-bin/` | 库位管理 (Shelf/Floor/Cold/Hazardous + 22 个 mock 库位) | 仓储物理层 |
| `logistics/` | 物流全链路 (维修/保养/巡检/库存预留) | 边缘关联 |

---

## 2. 核心链路现状

### 2.1 SKU → 商品体系 ✅

| 能力 | 现状 |
|---|---|
| 商品创建/更新 | ✅ `inventory.controller` → `inventory.service.createProduct` |
| SKU 变体 (颜色/尺码/规格) | ✅ `inventory-product.service.ts` — `SKUService.createSKU` |
| SKU 分类 (category) | ✅ Product 实体含 `category` 字段, 支持筛选 |
| 分类体系 (树形/层级) | ❌ 缺失层级分类; 仅有平面 category 字段 |
| ProductCategory 实体 | ✅ 已定义但未在业务流中使用 |

### 2.2 采购闭环

| 能力 | 现状 |
|---|---|
| 采购单创建 (Draft) | ✅ 两条并行: `inventory.service` (基础) + `inventory-purchase.service` (增强) |
| 审批流 | ✅ Draft → PendingApproval → Approved → Rejected |
| 下单 | ✅ Approved → Ordered |
| 收货 | ✅ Ordered/PartiallyReceived → Received (含自动库存更新) |
| 部分收货 | ✅ `PurchaseOrderStatus.PartiallyReceived` |
| 退货管理 | ✅ 退货创建/质检/审批/退款/换货/关闭 |
| 付款管理 | ✅ 分期/全额/逾期预警 |
| **supplier-manager ↔ procurement-order 未打通** | ❌ 供应链模块独立运行, 无 cross-module 依赖 |

### 2.3 库存闭环

| 能力 | 现状 |
|---|---|
| 入库 | ✅ `stockIn` (inventory.service) + `adjustStock` (stock.service 事务) |
| 出库 | ✅ `stockOut` + 库存充足校验 |
| 库存调整 | ✅ `adjustStock` |
| 出入库流水 | ✅ `StockRecord` (内存) + `StockTransaction` (TypeORM) |
| 盘点 | ✅ `InventoryCheckService` — 开始/录入/提交/差异计算/调整 |
| 跨店调拨 | ✅ `CrossStoreTransferService` — 申请/审批/出库/入库/成本计算 |
| **两套数据源共存** | ⚠️ in-memory 原型 (`inventory.service`) 和 TypeORM (`stock.service`) 互不连接 |

### 2.4 预警机制

| 预警类型 | 实现 | 位置 |
|---|---|---|
| 低库存预警 | ✅ `getLowStockProducts` (inventory.controller) | `inventory.service.ts` L192 |
| 低库存告警 (TypeORM) | ✅ `getLowStockItems` | `stock.service.ts` L163 |
| 库存导出 alers (contract) | ✅ `StockAlert` / `StockAlertContract` | `inventory.entity.ts` + `inventory.contract.ts` |
| 采购审批待办预警 | ✅ `PENDING_APPROVAL` | `inventory-purchase.service.ts` L917 |
| 采购逾期预警 | ✅ `OVERDUE` 按 expectedDeliveryAt | `inventory-purchase.service.ts` L930 |
| **高库存预警** | ❌ 不存在 | — |
| **库存周转预警** | ❌ 不存在 | — |
| **预警通知推送** | ❌ 暂无通知集成 | — |

---

## 3. 技术债务与门禁缺失

### 3.1 双体系并行 (风险高)

- `inventory/` → 6 个 service 全是内存 Map, 测试用 `reset*TestState()` 清除
- `stock/` → TypeORM + PostgreSQL, `stock.service.ts` 功能齐全有事务保障
- **无数据同步机制**: 两条体系各有 CRUD, 线上应只走 TypeORM 体系

### 3.2 缺失门禁

| 门禁 | 状态 | 原因 |
|---|---|---|
| SKU 唯一性校验 | ✅ 内存层有 | `inventory.service.ts` 创建 Product 时未严格 SKU 唯一; `inventory-product.service.ts` 有 |
| 库存不能为负 | ✅ | `checkProductStock` / `adjustStock` 有校验 |
| 并发库存扣减乐观锁 | ⚠️ partial | `stock.service.ts` 用 TypeORM EUQ (quantity 条件) |
| 多租户 RLS 隔离 | ✅ | `tenantId` + `TenantGuard` |
| 翻页/排序 | ✅ | 大多数 `list*` 方法实现 |
| **高库存预警 (overstock)** | ❌ 缺失 | 只有低库存, 无 `maxStock` 检查 |
| **库存预警 cron 定时扫描** | ❌ 缺失 | `inventory.cron.ts` 仅处理预留过期, 无库存水位扫描 |
| **分类树层级管理** | ❌ 缺失 | `ProductCategory` 实体已定义但未启用 |
| **in-memory → DB 迁移计划** | ❌ 缺失 | 6 个内存 service 未规划迁移 |

---

## 4. 测试覆盖

| 维度 | 数量 |
|---|---|
| 测试文件总数 | 25+ (inventory) + 7 (stock) + 4 (supplier-manager) + 11 (procurement-order) + 10 (warehouse-bin) + 10+ (logistics) |
| E2E 测试 | `inventory.e2e.test.ts` + `inventory-quota-integration.e2e.test.ts` |
| 角色权限测试 | `inventory.role*.test.ts`, `stock.role-extended.test.ts` |
| 压力/模拟测试 | `inventory.stress.test.ts`, `inventory.simulator.test.ts` |
| 合约测试 | `inventory.contract.test.ts` |
| Ringbeam | `inventory-ringbeam.test.ts`, `logistics-ringbeam.test.ts` |
| **TSC 状态** | ✅ 零错误 |

---

## 5. 结论与建议

### 现状评分
- **产品分类**: ⚠️ 平面 category, 无树形
- **采购闭环**: ✅ 完整 (Draft → 审批 → 下单 → 收货 → 退货)
- **库存闭环**: ✅ 完整 (入库/出库/调整/盘点/调拨/流水)
- **预警机制**: ⚠️ 有低库存 + 采购逾期, 缺高库存 + 周转预警
- **数据持久化**: ❌ 双体系并行, inventory 服务未接 TypeORM

### 优先建议
1. 补充**高库存预警** — 基于 `maxStock` 的超量告警
2. 补充**库存 cron 定时扫描** — 定期检查低库存/高库存水位, 可推通知
3. 激活 `ProductCategory` 层级分类 — 已有实体定义, 需接业务流
4. 规划 `inventory/` 内存服务迁移到 `stock/` TypeORM 体系

---

*生成日期: 2026-07-23 · 扫描范围: inventory/supplier-manager/procurement-order/warehouse-bin/stock/logistics*
