# 库存模块 (Inventory)

## 用途
全链路库存管理系统：商品管理、入库/出库/调拨、库存预警、供应商管理、采购订单管理。支持多租户隔离，覆盖门店级库存实时查询、低库存告警与采购审批流程。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST/GET /inventory/products` | 商品 CRUD |
| `POST /inventory/stock/in` | 入库操作 |
| `POST /inventory/stock/out` | 出库操作 |
| `POST /inventory/stock/adjust` | 库存调整 |
| `GET /inventory/stock/low-products` | 低库存商品列表 |
| `GET /inventory/stock/records` | 库存流水查询 |
| `POST/GET /inventory/suppliers` | 供应商管理 |
| `POST/GET /inventory/purchase-orders` | 采购订单管理 |

## 测试位置
`apps/api/src/modules/inventory/` — **25** 个测试文件：控制器单测、服务单测、DTO/Entity 测试、E2E (`.e2e.test.ts`)、角色权限测试、压力测试、模拟器测试、合约测试、采购订单测试。
