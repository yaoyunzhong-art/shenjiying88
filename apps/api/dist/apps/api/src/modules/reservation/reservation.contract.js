"use strict";
/**
 * 预约模块跨边界通信契约
 *
 * 定义其他模块消费预约数据的稳定表面层。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toReservationContract = toReservationContract;
exports.toReservationStatsContract = toReservationStatsContract;
/**
 * 将内部 ReservationEntity 转换为跨模块契约
 */
function toReservationContract(entity) {
    return {
        id: entity.id,
        tenantId: entity.tenantId,
        type: entity.type,
        resourceId: entity.resourceId,
        resourceName: entity.resourceName,
        userId: entity.userId,
        userName: entity.userName,
        status: entity.status,
        startTime: entity.startTime instanceof Date ? entity.startTime.toISOString() : entity.startTime,
        endTime: entity.endTime instanceof Date ? entity.endTime.toISOString() : entity.endTime,
        duration: entity.duration,
        price: entity.price,
        deposit: entity.deposit,
        remark: entity.remark,
        createdAt: entity.createdAt instanceof Date ? entity.createdAt.toISOString() : entity.createdAt,
        updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt
    };
}
/**
 * 构建预约统计
 */
function toReservationStatsContract(reservations) {
    return {
        total: reservations.length,
        pendingCount: reservations.filter((r) => r.status === 'pending').length,
        confirmedCount: reservations.filter((r) => r.status === 'confirmed').length,
        inProgressCount: reservations.filter((r) => r.status === 'in_progress').length,
        completedCount: reservations.filter((r) => r.status === 'completed').length,
        cancelledCount: reservations.filter((r) => r.status === 'cancelled').length
    };
}
//# sourceMappingURL=reservation.contract.js.map