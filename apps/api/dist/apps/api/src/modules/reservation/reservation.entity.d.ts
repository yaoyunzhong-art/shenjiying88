export declare enum ReservationType {
    Venue = "venue",
    Equipment = "equipment",
    Service = "service",
    Class = "class"
}
export declare enum ReservationStatus {
    Pending = "pending",
    Confirmed = "confirmed",
    InProgress = "in_progress",
    Completed = "completed",
    Cancelled = "cancelled"
}
export declare const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]>;
export declare class ReservationEntity {
    id: string;
    tenantId: string;
    type: ReservationType;
    resourceId: string;
    resourceName: string;
    userId: string;
    userName: string;
    status: ReservationStatus;
    startTime: Date;
    endTime: Date;
    duration: number;
    price: number;
    deposit: number;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
    cancelledAt?: Date;
    cancelledReason?: string;
}
//# sourceMappingURL=reservation.entity.d.ts.map