export declare enum QueueType {
    Booking = "booking",
    Waiting = "waiting",
    Service = "service"
}
export declare enum QueueStatus {
    Waiting = "waiting",
    Called = "called",
    Serving = "serving",
    Completed = "completed",
    Cancelled = "cancelled",
    NoShow = "no_show"
}
export declare const QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, QueueStatus[]>;
export declare class QueueEntity {
    id: string;
    tenantId: string;
    type: QueueType;
    queueNumber: string;
    userId: string;
    userName: string;
    phone?: string;
    partySize: number;
    resourceId?: string;
    resourceName?: string;
    status: QueueStatus;
    priority: number;
    estimatedWaitMin: number;
    actualWaitMin?: number;
    calledAt?: Date;
    servedAt?: Date;
    completedAt?: Date;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=queue.entity.d.ts.map