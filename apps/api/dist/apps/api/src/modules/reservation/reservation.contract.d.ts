/**
 * 预约模块跨边界通信契约
 *
 * 定义其他模块消费预约数据的稳定表面层。
 */
import type { ReservationEntity, ReservationType, ReservationStatus } from './reservation.entity';
/** 预约信息契约（跨模块安全子集） */
export interface ReservationContract {
    id: string;
    tenantId: string;
    type: ReservationType;
    resourceId: string;
    resourceName: string;
    userId: string;
    userName: string;
    status: ReservationStatus;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    deposit: number;
    remark?: string;
    createdAt: string;
    updatedAt: string;
}
/** 预约统计契约 */
export interface ReservationStatsContract {
    total: number;
    pendingCount: number;
    confirmedCount: number;
    inProgressCount: number;
    completedCount: number;
    cancelledCount: number;
}
/**
 * 将内部 ReservationEntity 转换为跨模块契约
 */
export declare function toReservationContract(entity: ReservationEntity): ReservationContract;
/**
 * 构建预约统计
 */
export declare function toReservationStatsContract(reservations: ReservationEntity[]): ReservationStatsContract;
/**
 * 预约统计契约别名（导出 for 其他模块消费）
 */
export type ReservationStatusContract = ReservationStatus;
export type ReservationTypeContract = ReservationType;
//# sourceMappingURL=reservation.contract.d.ts.map