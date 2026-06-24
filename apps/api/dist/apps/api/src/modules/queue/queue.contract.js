"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toQueueEntryContract = toQueueEntryContract;
function toQueueEntryContract(entry) {
    return {
        id: entry.id,
        tenantId: entry.tenantId,
        type: entry.type,
        queueNumber: entry.queueNumber,
        userId: entry.userId,
        userName: entry.userName,
        phone: entry.phone,
        partySize: entry.partySize,
        resourceId: entry.resourceId,
        resourceName: entry.resourceName,
        status: entry.status,
        priority: entry.priority,
        estimatedWaitMin: entry.estimatedWaitMin,
        actualWaitMin: entry.actualWaitMin,
        calledAt: entry.calledAt?.toISOString(),
        servedAt: entry.servedAt?.toISOString(),
        completedAt: entry.completedAt?.toISOString(),
        remark: entry.remark,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
    };
}
//# sourceMappingURL=queue.contract.js.map