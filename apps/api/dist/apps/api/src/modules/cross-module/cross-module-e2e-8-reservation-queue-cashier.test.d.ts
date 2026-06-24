/**
 * E2E 跨模块 #8 — 预约 → 排队 → 收银 → 完成 全链路
 *
 * 链路:
 *   1. ReservationService.create (Pending)
 *   2. ReservationService.confirm (Confirmed)
 *   3. QueueService.create (Waiting)
 *   4. QueueService.complete
 *   5. ReservationService.startProgress (InProgress)
 *   6. CashierService.createOrder + createPayment + applyPaymentCallback(succeeded)
 *   7. ReservationService.complete (Completed)
 *
 * 验证:
 *   - 跨模块状态机流转正确
 *   - 排队序号生成 (B001/B002 per tenant+type)
 *   - estimated wait 随队列增长
 *   - 跨租户隔离
 *   - 取消路径一致性
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-8-reservation-queue-cashier.test.d.ts.map