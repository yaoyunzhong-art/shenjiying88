import type { RequestTenantContext } from '../tenant/tenant.types';
import { CallNextDto, JoinQueueDto, QueueQueryDto } from './queue.dto';
import { QueueService } from './queue.service';
export declare class QueueController {
    private readonly queueService;
    constructor(queueService: QueueService);
    joinQueue(tenantContext: RequestTenantContext, body: JoinQueueDto): import("./queue.contract").QueueEntryContract;
    leaveQueue(tenantContext: RequestTenantContext, entryId: string): import("./queue.contract").QueueEntryContract;
    callNext(tenantContext: RequestTenantContext, body: CallNextDto): import("./queue.contract").QueueEntryContract | null;
    startService(tenantContext: RequestTenantContext, entryId: string): import("./queue.contract").QueueEntryContract;
    completeService(tenantContext: RequestTenantContext, entryId: string): import("./queue.contract").QueueEntryContract;
    markNoShow(tenantContext: RequestTenantContext, entryId: string): import("./queue.contract").QueueEntryContract;
    getQueueStatus(tenantContext: RequestTenantContext, resourceId: string): import("./queue.service").QueueStats;
    getMyPosition(tenantContext: RequestTenantContext, query: QueueQueryDto): import("./queue.service").QueuePosition;
}
//# sourceMappingURL=queue.controller.d.ts.map