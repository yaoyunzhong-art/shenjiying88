/**
 * E2E 跨模块 #9 — 采购 → 入库 → 应付账款 全链路
 *
 * 链路:
 *   1. InventoryService.createProduct (登记商品)
 *   2. InventoryService.createPurchaseOrder (Draft)
 *   3. InventoryService.confirmOrder (Confirmed)
 *   4. InventoryService.receiveOrder (Received, 自动 stockIn)
 *   5. FinanceService.recordLedger(type=Expense, PO 号关联) → 应付账款
 *
 * 验证:
 *   - PO 状态机: Draft → Confirmed → Received
 *   - 采购入库数量准确增加 stock
 *   - 财务 Expense ledger 关联 PO id
 *   - 余额计算: Revenue 1000 - Expense 300 = 700
 *   - 跨租户隔离: Tenant B 看不到 Tenant A 库存 / ledger
 *   - 库存阈值: low_stock / out_of_stock 状态
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-9-inventory-finance.test.d.ts.map