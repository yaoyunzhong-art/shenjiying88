import { ReservationEntity, ReservationStatus, ReservationType } from './reservation.entity';
export interface CreateReservationInput {
    tenantId: string;
    type: ReservationType;
    resourceId: string;
    resourceName: string;
    userId: string;
    userName: string;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    deposit: number;
    remark?: string;
}
export declare class ReservationService {
    private readonly reservationStore;
    create(input: CreateReservationInput): ReservationEntity;
    findAll(tenantId: string, filter?: {
        type?: ReservationType;
        resourceId?: string;
        userId?: string;
        status?: ReservationStatus;
        startDate?: string;
        endDate?: string;
    }): ReservationEntity[];
    findOne(id: string, tenantId: string): ReservationEntity | undefined;
    update(id: string, tenantId: string, data: {
        startTime?: string;
        endTime?: string;
        duration?: number;
        price?: number;
        deposit?: number;
        remark?: string;
        resourceName?: string;
    }): ReservationEntity;
    cancel(id: string, tenantId: string, reason?: string): ReservationEntity;
    confirm(id: string, tenantId: string): ReservationEntity;
    startProgress(id: string, tenantId: string): ReservationEntity;
    complete(id: string, tenantId: string): ReservationEntity;
    checkConflict(tenantId: string, resourceId: string, startTime: string, endTime: string, excludeId?: string): void;
    findByTimeRange(tenantId: string, startDate: string, endDate: string): ReservationEntity[];
    findByUser(tenantId: string, userId: string): ReservationEntity[];
    findByResource(tenantId: string, resourceId: string): ReservationEntity[];
    private assertOwned;
    private assertStatusTransition;
    private isOverlapping;
    resetStoreForTests(): void;
}
//# sourceMappingURL=reservation.service.d.ts.map