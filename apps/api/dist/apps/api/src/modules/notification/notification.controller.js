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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const notification_contract_1 = require("./notification.contract");
const notification_dto_1 = require("./notification.dto");
const notification_entity_1 = require("./notification.entity");
const notification_service_1 = require("./notification.service");
let NotificationController = class NotificationController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    // ── Template endpoints ──
    registerTemplate(tenantContext, body) {
        const template = this.notificationService.registerTemplate({
            code: body.code,
            channel: body.channel,
            scopeType: body.scopeType,
            tenantId: body.tenantId ?? tenantContext.tenantId,
            brandId: body.brandId ?? tenantContext.brandId,
            storeId: body.storeId ?? tenantContext.storeId,
            marketCode: body.marketCode ?? tenantContext.marketCode,
            locale: body.locale,
            titleTemplate: body.titleTemplate,
            bodyTemplate: body.bodyTemplate,
            variables: body.variables,
            enabled: body.enabled
        });
        return (0, notification_contract_1.toNotificationTemplateContract)(template);
    }
    listTemplates(tenantContext, channel, scopeType, enabled) {
        return this.notificationService
            .listTemplates({
            channel,
            scopeType,
            tenantId: tenantContext.tenantId,
            enabled: enabled !== undefined ? enabled === 'true' : undefined
        })
            .map(notification_contract_1.toNotificationTemplateContract);
    }
    getTemplate(id) {
        const template = this.notificationService.getTemplate(id);
        return template ? (0, notification_contract_1.toNotificationTemplateContract)(template) : null;
    }
    updateTemplate(id, body) {
        const template = this.notificationService.updateTemplate(id, body);
        return template ? (0, notification_contract_1.toNotificationTemplateContract)(template) : null;
    }
    // ── Dispatch endpoints ──
    send(tenantContext, body) {
        const dispatch = this.notificationService.send({
            templateCode: body.templateCode,
            channel: body.channel,
            scopeType: body.scopeType,
            tenantId: body.tenantId ?? tenantContext.tenantId,
            brandId: body.brandId ?? tenantContext.brandId,
            storeId: body.storeId ?? tenantContext.storeId,
            recipient: body.recipient,
            payload: body.payload,
            scheduledAt: body.scheduledAt
        });
        return (0, notification_contract_1.toNotificationDispatchContract)(dispatch);
    }
    listDispatches(tenantContext, status, channel, recipient) {
        return this.notificationService
            .listDispatches({
            status,
            channel,
            tenantId: tenantContext.tenantId,
            recipient
        })
            .map(notification_contract_1.toNotificationDispatchContract);
    }
    getDispatch(id) {
        const dispatch = this.notificationService.getDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
    retryDispatch(id) {
        const dispatch = this.notificationService.retryDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
    cancelDispatch(id) {
        const dispatch = this.notificationService.cancelDispatch(id);
        return dispatch ? (0, notification_contract_1.toNotificationDispatchContract)(dispatch) : null;
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.RegisterNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "registerTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('channel')),
    __param(2, (0, common_1.Query)('scopeType')),
    __param(3, (0, common_1.Query)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_dto_1.UpdateNotificationTemplateDto]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.SendNotificationDto]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('dispatches'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('recipient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "listDispatches", null);
__decorate([
    (0, common_1.Get)('dispatches/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "getDispatch", null);
__decorate([
    (0, common_1.Post)('dispatches/:id/retry'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "retryDispatch", null);
__decorate([
    (0, common_1.Post)('dispatches/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "cancelDispatch", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map