"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const queue_contract_1 = require("./queue.contract");
const queue_dto_1 = require("./queue.dto");
const queue_service_1 = require("./queue.service");
let QueueController = class QueueController {
    queueService;
    constructor(queueService) {
        this.queueService = queueService;
    }
    joinQueue(tenantContext, body) {
        const entry = this.queueService.joinQueue({
            tenantId: tenantContext.tenantId,
            queueType: body.queueType,
            resourceId: body.resourceId,
            resourceName: body.resourceName,
            memberId: body.memberId,
            memberName: body.memberName,
            priority: body.priority,
            remark: body.remark
        });
        return (0, queue_contract_1.toQueueEntryContract)(entry);
    }
    leaveQueue(tenantContext, entryId) {
        const entry = this.queueService.leaveQueue(entryId, tenantContext.tenantId);
        return (0, queue_contract_1.toQueueEntryContract)(entry);
    }
    callNext(tenantContext, body) {
        const entry = this.queueService.callNext(body.resourceId, tenantContext.tenantId);
        return entry ? (0, queue_contract_1.toQueueEntryContract)(entry) : null;
    }
    startService(tenantContext, entryId) {
        const entry = this.queueService.startService(entryId, tenantContext.tenantId);
        return (0, queue_contract_1.toQueueEntryContract)(entry);
    }
    completeService(tenantContext, entryId) {
        const entry = this.queueService.completeService(entryId, tenantContext.tenantId);
        return (0, queue_contract_1.toQueueEntryContract)(entry);
    }
    markNoShow(tenantContext, entryId) {
        const entry = this.queueService.markNoShow(entryId, tenantContext.tenantId);
        return (0, queue_contract_1.toQueueEntryContract)(entry);
    }
    getQueueStatus(tenantContext, resourceId) {
        return this.queueService.getQueueStatus(resourceId, tenantContext.tenantId);
    }
    getMyPosition(tenantContext, query) {
        if (!query.memberId || !query.resourceId) {
            return { position: -1, estimatedWaitMinutes: 0, entry: null };
        }
        return this.queueService.getMyPosition(query.memberId, query.resourceId, tenantContext.tenantId);
    }
};
exports.QueueController = QueueController;
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, queue_dto_1.JoinQueueDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "joinQueue", null);
__decorate([
    (0, common_1.Post)(':entryId/leave'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "leaveQueue", null);
__decorate([
    (0, common_1.Post)('call-next'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, queue_dto_1.CallNextDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "callNext", null);
__decorate([
    (0, common_1.Post)(':entryId/start-service'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "startService", null);
__decorate([
    (0, common_1.Post)(':entryId/complete'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "completeService", null);
__decorate([
    (0, common_1.Post)(':entryId/no-show'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('entryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "markNoShow", null);
__decorate([
    (0, common_1.Get)('status/:resourceId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Get)('position'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, queue_dto_1.QueueQueryDto]),
    __metadata("design:returntype", void 0)
], QueueController.prototype, "getMyPosition", null);
exports.QueueController = QueueController = __decorate([
    (0, common_1.Controller)('queue'),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], QueueController);
//# sourceMappingURL=queue.controller.js.map