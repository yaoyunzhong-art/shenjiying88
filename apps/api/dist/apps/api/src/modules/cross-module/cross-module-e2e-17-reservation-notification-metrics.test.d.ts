/**
 * E2E 跨模块 #17 — 预约管理 → 通知派发 → Metrics 指标追踪 联动
 *
 * 链路:
 *   ReservationService.create → confirm → cancel → complete
 *   → NotificationService.registerTemplate → send → getDispatch
 *   → MetricsService.registerCounter→incrementCounter, setGauge→render
 *
 * 验证:
 *   - 预约完整生命周期: Pending → Confirmed → Completed | Cancelled
 *   - 每次状态变更可派发通知
 *   - 失败通知可 retry
 *   - Metrics 计数器+仪表盘
 *   - 跨租户隔离
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-17-reservation-notification-metrics.test.d.ts.map