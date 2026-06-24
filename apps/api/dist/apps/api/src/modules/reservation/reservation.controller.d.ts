import type { RequestTenantContext } from '../tenant/tenant.types';
import { CreateReservationDto, ReservationQueryDto, UpdateReservationDto } from './reservation.dto';
import { ReservationService } from './reservation.service';
export declare class ReservationController {
    private readonly reservationService;
    constructor(reservationService: ReservationService);
    createReservation(tenantContext: RequestTenantContext, body: CreateReservationDto): import("./reservation.entity").ReservationEntity;
    findAll(tenantContext: RequestTenantContext, query: ReservationQueryDto): import("./reservation.entity").ReservationEntity[];
    findOne(tenantContext: RequestTenantContext, id: string): import("./reservation.entity").ReservationEntity;
    findByUser(tenantContext: RequestTenantContext, userId: string): import("./reservation.entity").ReservationEntity[];
    findByResource(tenantContext: RequestTenantContext, resourceId: string): import("./reservation.entity").ReservationEntity[];
    findByTimeRange(tenantContext: RequestTenantContext, startDate: string, endDate: string): import("./reservation.entity").ReservationEntity[];
    checkConflict(tenantContext: RequestTenantContext, resourceId: string, startTime: string, endTime: string): {
        hasConflict: boolean;
    };
    updateReservation(tenantContext: RequestTenantContext, id: string, body: UpdateReservationDto): import("./reservation.entity").ReservationEntity;
    cancelReservation(tenantContext: RequestTenantContext, id: string, reason?: string): import("./reservation.entity").ReservationEntity;
}
//# sourceMappingURL=reservation.controller.d.ts.map