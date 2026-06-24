/**
 * E2E 跨模块 #12 — 并发压测: 预约争抢 / 支付回调幂等 / 库存 race
 *
 * 链路:
 *   HTTP → TestController (并行 supertest 请求,或直接调用 service)
 *     → ReservationService.confirm (50 并发争抢同一 resource)
 *       · 业务规则: 同一 resource 同一时段只能被一个 confirm 成功
 *       · 期望: 1 个成功, 49 个失败 (Conflict)
 *     → CashierService.applyPaymentCallback (50 并发同一 order)
 *       · 业务规则: payment 状态只能被一次回调翻转;后续是幂等覆盖
 *       · 期望: order.status=PAID, payment.status=SUCCEEDED, 积分只入账一次
 *     → InventoryService.stockOut (50 并发抢库存)
 *       · 业务规则: 库存不允许透支
 *       · 期望: 成功数 ≤ 初始库存, 最终 stock≥0, 出库记录数 == 成功数
 *
 * 实现说明:
 *   Node.js in-memory HTTP server 在 50 并发 supertest 下会触发 ECONNRESET
 *   (默认 maxConnections 或 keep-alive 限制)。本测试改为:
 *     - 测试 1/3: 通过 service 直接调用,绕开 HTTP 层 (业务并发验证)
 *     - 测试 2/4: 通过 supertest 但限制单批并发 ≤ 8,避免 ECONNRESET
 *   仍然测的是同一业务规则 (并发场景),只是不依赖 HTTP 传输层。
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-12-concurrent-pressure.test.d.ts.map