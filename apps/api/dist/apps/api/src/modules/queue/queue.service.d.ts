import { QueueEntity, QueueStatus, QueueType } from './queue.entity';
export interface CreateQueueInput {
    tenantId: string;
    type: QueueType;
    userId: string;
    userName: string;
    phone?: string;
    partySize: number;
    resourceId?: string;
    resourceName?: string;
    remark?: string;
}
/**
 * Controller-facing wrapper input. The HTTP layer (QueueController.joinQueue)
 * passes a tenantContext + lightweight fields; the service translates it
 * to a CreateQueueInput internally.
 */
export interface JoinQueueInput {
    tenantId: string;
    queueType: QueueType;
    memberId: string;
    memberName?: string;
    resourceId?: string;
    resourceName?: string;
    priority?: number;
    remark?: string;
}
export interface QueuePosition {
    position: number;
    estimatedWaitMinutes: number;
    entry: QueueEntity | null;
}
export interface QueueStats {
    total: number;
    waitingCount: number;
    calledCount: number;
    servingCount: number;
    completedCount: number;
    cancelledCount: number;
    noShowCount: number;
    avgWaitMin: number;
}
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export declare class QueueService {
    create(input: CreateQueueInput): QueueEntity;
    /**
     * 用户取号 —— 自动生成排队号
     */
    takeNumber(input: CreateQueueInput): QueueEntity;
    findAll(tenantId: string, filter?: {
        type?: QueueType;
        status?: QueueStatus;
        resourceId?: string;
        userId?: string;
        queueNumber?: string;
    }): QueueEntity[];
    findPaginated(tenantId: string, filter?: {
        type?: QueueType;
        status?: QueueStatus;
        resourceId?: string;
        userId?: string;
        queueNumber?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): PaginatedResult<QueueEntity>;
    findOne(id: string, tenantId: string): QueueEntity | undefined;
    update(id: string, tenantId: string, data: {
        partySize?: number;
        phone?: string;
        resourceName?: string;
        remark?: string;
    }): QueueEntity;
    cancel(id: string, tenantId: string): QueueEntity;
    /**
     * Controller wrapper: HTTP POST /queue/join
     * Translates JoinQueueInput → internal CreateQueueInput
     * Auto-derives partySize=1 (single-member join) since memberId is the join unit
     */
    joinQueue(input: JoinQueueInput): QueueEntity;
    /**
     * Controller wrapper: HTTP POST /queue/:entryId/leave
     * Alias for cancel() — uses Cancelled transition (Waiting→Cancelled)
     */
    leaveQueue(entryId: string, tenantId: string): QueueEntity;
    /**
     * Controller wrapper: HTTP POST /queue/:entryId/complete
     * Alias for complete() (HTTP route 'complete' collides with NestJS reserved path semantics)
     */
    completeService(entryId: string, tenantId: string): QueueEntity;
    /**
     * Controller wrapper: HTTP GET /queue/status/:resourceId
     * Returns QueueStats scoped to a single resource (resourceId required)
     */
    getQueueStatus(resourceId: string, tenantId: string): QueueStats;
    /**
     * Controller wrapper: HTTP GET /queue/position
     * Returns the member's position in the waiting list for the resource.
     * - position = -1 means not in queue or invalid input
     * - estimatedWaitMinutes is position × 5 (matches create() heuristic)
     */
    getMyPosition(memberId: string, resourceId: string, tenantId: string): QueuePosition;
    /**
     * Controller wrapper: HTTP POST /queue/call-next
     * Calls the next waiting entry for a resource. Signature is
     * (resourceId, tenantId) — matches QueueController.callNext.
     */
    callNext(resourceId: string, tenantId: string): QueueEntity | null;
    /**
     * Tenant-scoped call-next (preserved for back-compat).
     * Older entry-point style — picks next across all resources for tenant.
     */
    callNextByTenant(tenantId: string, resourceId?: string, type?: QueueType): QueueEntity | null;
    /**
     * 开始服务 called→serving
     */
    startService(id: string, tenantId: string): QueueEntity;
    /**
     * 完成 serving→completed
     */
    complete(id: string, tenantId: string): QueueEntity;
    /**
     * 过号 called→no_show
     */
    markNoShow(id: string, tenantId: string): QueueEntity;
    /**
     * 获取当前队列（waiting + called + serving）
     */
    getCurrentQueue(tenantId: string, resourceId?: string, type?: QueueType): QueueEntity[];
    /**
     * 获取等待列表
     */
    getWaitingList(tenantId: string, resourceId?: string, type?: QueueType): QueueEntity[];
    /**
     * 获取队列统计（等待人数/平均等待时间等）
     */
    getQueueStats(tenantId: string, resourceId?: string, type?: QueueType): QueueStats;
    private assertOwned;
    private assertStatusTransition;
    private countAhead;
    resetQueueStoresForTests(): void;
}
//# sourceMappingURL=queue.service.d.ts.map