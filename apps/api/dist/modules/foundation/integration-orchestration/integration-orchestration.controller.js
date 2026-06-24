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
exports.IntegrationOrchestrationController = void 0;
const common_1 = require("@nestjs/common");
const integration_orchestration_dto_1 = require("./integration-orchestration.dto");
const integration_orchestration_service_1 = require("./integration-orchestration.service");
let IntegrationOrchestrationController = class IntegrationOrchestrationController {
    integrationOrchestrationService;
    constructor(integrationOrchestrationService) {
        this.integrationOrchestrationService = integrationOrchestrationService;
    }
    getWebhookSources() {
        return this.integrationOrchestrationService.getWebhookSourceCatalog();
    }
    async getEvents(query) {
        return this.integrationOrchestrationService.getEventEnvelopes(query.source);
    }
    async getIdempotencyRecords(query) {
        return this.integrationOrchestrationService.getIdempotencyRecords(query.source);
    }
    async publishEvent(body) {
        return this.integrationOrchestrationService.publishEvent(body.eventName, body.payload, {
            source: body.source,
            aggregateId: body.aggregateId,
            idempotencyKey: body.idempotencyKey
        });
    }
    async ingestWebhook(source, body) {
        return this.integrationOrchestrationService.acceptWebhook(source, body);
    }
};
exports.IntegrationOrchestrationController = IntegrationOrchestrationController;
__decorate([
    (0, common_1.Get)('webhooks/sources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], IntegrationOrchestrationController.prototype, "getWebhookSources", null);
__decorate([
    (0, common_1.Get)('events'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [integration_orchestration_dto_1.EventListQueryDto]),
    __metadata("design:returntype", Promise)
], IntegrationOrchestrationController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('idempotency-records'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [integration_orchestration_dto_1.EventListQueryDto]),
    __metadata("design:returntype", Promise)
], IntegrationOrchestrationController.prototype, "getIdempotencyRecords", null);
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [integration_orchestration_dto_1.PublishEventDto]),
    __metadata("design:returntype", Promise)
], IntegrationOrchestrationController.prototype, "publishEvent", null);
__decorate([
    (0, common_1.Post)('webhooks/:source/ingest'),
    __param(0, (0, common_1.Param)('source')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, integration_orchestration_dto_1.WebhookIngestDto]),
    __metadata("design:returntype", Promise)
], IntegrationOrchestrationController.prototype, "ingestWebhook", null);
exports.IntegrationOrchestrationController = IntegrationOrchestrationController = __decorate([
    (0, common_1.Controller)('foundation/integration-orchestration'),
    __metadata("design:paramtypes", [integration_orchestration_service_1.IntegrationOrchestrationService])
], IntegrationOrchestrationController);
//# sourceMappingURL=integration-orchestration.controller.js.map