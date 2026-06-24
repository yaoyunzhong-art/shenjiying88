/**
 * 🐜 自动: [reservation] E2E 基础测试
 *
 * E2E 链路: HTTP → ReservationController → ReservationService → ReservationEntity
 *
 * 覆盖:
 *   - Reservation CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Pending → Confirmed → InProgress → Completed
 *   - 冲突检测: 同 resource 同时段 → 拒绝
 *   - 取消 + cancelledReason
 *   - 按时间范围 / 用户 / 资源 查询
 *   - 跨租户隔离
 *   - 错误处理
 */
import 'reflect-metadata';
//# sourceMappingURL=reservation.e2e.test.d.ts.map