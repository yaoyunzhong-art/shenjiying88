/**
 * 🐜 自动: [inventory] E2E 基础测试
 *
 * E2E 链路: HTTP → InventoryController → InventoryService → Product/Stock/Supplier/PurchaseOrder
 *
 * 覆盖:
 *   - Product CRUD: 创建 / 详情 / 列表 / 关键词搜索
 *   - 库存操作: stockIn / stockOut / adjustStock / 库存检查
 *   - 库存预警: 低库存 / 缺货
 *   - 库存记录: 出入库记录查询
 *   - 供应商: 创建 / 列表
 *   - 采购订单: 创建 / 确认 / 收货 (自动入库)
 *   - 跨租户隔离
 *   - 错误处理 (404/400)
 */
import 'reflect-metadata';
//# sourceMappingURL=inventory.e2e.test.d.ts.map