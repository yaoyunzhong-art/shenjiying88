import { ReservationType, ReservationStatus } from './reservation.entity';
export declare class CreateReservationDto {
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
export declare class UpdateReservationDto {
    status?: ReservationStatus;
    startTime?: string;
    endTime?: string;
    duration?: number;
    price?: number;
    deposit?: number;
    remark?: string;
    resourceName?: string;
}
export declare class ReservationQueryDto {
    type?: ReservationType;
    resourceId?: string;
    userId?: string;
    status?: ReservationStatus;
    startDate?: string;
    endDate?: string;
}
//# sourceMappingURL=reservation.dto.d.ts.map