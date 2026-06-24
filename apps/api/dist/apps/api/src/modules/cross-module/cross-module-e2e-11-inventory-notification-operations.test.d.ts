/**
 * E2E 跨模块 #11 — 库存预警 → 运营通知 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → InventoryService
 *       · createProduct (设 minStock 阈值)
 *       · stockOut (出库) → currentStock 减少
 *       · getLowStockProducts → 触发 StockAlert { status: 'low' | 'out_of_stock' }
 *       · stockIn (补货) → 预警解除
 *     → NotificationService
 *       · registerTemplate (低库存告警模板)
 *       · send (派发给运营 ops@tenant.com)
 *       · simulateSend: 正常收件人 → status='SENT' / 含 'fail' → status='FAILED'
 *       · retryDispatch (FAILED → 重发)
 *       · cancelDispatch (取消)
 *       · listDispatches (按 status/tenantId 过滤)
 *
 * 验证:
 *   - 低库存告警 → 通知模板派发 → SENT 状态
 *   - 缺货告警 (stock=0) → out_of_stock 状态
 *   - 失败派发 → FAILED → retry 重新派发
 *   - 取消派发 → CANCELLED
 *   - 模板更新 (body / enabled 切换)
 *   - 补货 → 预警自动解除
 *   - 跨租户隔离
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-11-inventory-notification-operations.test.d.ts.map