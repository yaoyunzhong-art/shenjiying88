import 'reflect-metadata';
import { QueueType, QueueStatus } from './queue.entity';
export declare class CreateQueueDto {
    type: QueueType;
    userId: string;
    userName: string;
    phone?: string;
    partySize: number;
    resourceId?: string;
    resourceName?: string;
    remark?: string;
}
export declare class UpdateQueueDto {
    partySize?: number;
    phone?: string;
    resourceName?: string;
    remark?: string;
}
export declare class QueueQueryDto {
    type?: QueueType;
    status?: QueueStatus;
    resourceId?: string;
    memberId?: string;
    userId?: string;
    queueNumber?: string;
    pageSize?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class JoinQueueDto {
    queueType: QueueType;
    memberId: string;
    memberName?: string;
    resourceId?: string;
    resourceName?: string;
    priority?: number;
    remark?: string;
}
export declare class CallNextDto {
    resourceId: string;
    type?: QueueType;
}
//# sourceMappingURL=queue.dto.d.ts.map