"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
exports.resetNotificationServiceTestState = resetNotificationServiceTestState;
const common_1 = require("@nestjs/common");
const notification_entity_1 = require("./notification.entity");
const templateStore = new Map();
const dispatchStore = new Map();
function resetNotificationServiceTestState() {
    templateStore.clear();
    dispatchStore.clear();
}
let NotificationService = class NotificationService {
    // ── Template management ──
    registerTemplate(input) {
        const template = (0, notification_entity_1.toNotificationTemplate)(input);
        templateStore.set(template.id, template);
        return template;
    }
    getTemplate(id) {
        return templateStore.get(id);
    }
    findTemplateByCode(code) {
        for (const t of templateStore.values()) {
            if (t.code === code && t.enabled)
                return t;
        }
        return undefined;
    }
    listTemplates(filters) {
        let results = Array.from(templateStore.values());
        if (filters?.channel)
            results = results.filter(t => t.channel === filters.channel);
        if (filters?.scopeType)
            results = results.filter(t => t.scopeType === filters.scopeType);
        if (filters?.tenantId)
            results = results.filter(t => t.tenantId === filters.tenantId);
        if (filters?.enabled !== undefined)
            results = results.filter(t => t.enabled === filters.enabled);
        return results;
    }
    updateTemplate(id, patch) {
        const existing = templateStore.get(id);
        if (!existing)
            return undefined;
        const updated = {
            ...existing,
            ...patch,
            updatedAt: new Date().toISOString()
        };
        templateStore.set(id, updated);
        return updated;
    }
    // ── Dispatch management ──
    send(input) {
        let templateId;
        if (input.templateCode) {
            const tpl = this.findTemplateByCode(input.templateCode);
            templateId = tpl?.id;
        }
        const dispatch = (0, notification_entity_1.toNotificationDispatch)({
            templateId,
            channel: input.channel,
            scopeType: input.scopeType,
            tenantId: input.tenantId,
            brandId: input.brandId,
            storeId: input.storeId,
            recipient: input.recipient,
            payload: input.payload,
            scheduledAt: input.scheduledAt
        });
        dispatchStore.set(dispatch.id, dispatch);
        this.simulateSend(dispatch);
        return dispatchStore.get(dispatch.id);
    }
    getDispatch(id) {
        return dispatchStore.get(id);
    }
    listDispatches(filters) {
        let results = Array.from(dispatchStore.values());
        if (filters?.status)
            results = results.filter(d => d.status === filters.status);
        if (filters?.channel)
            results = results.filter(d => d.channel === filters.channel);
        if (filters?.tenantId)
            results = results.filter(d => d.tenantId === filters.tenantId);
        if (filters?.recipient)
            results = results.filter(d => d.recipient === filters.recipient);
        return results;
    }
    retryDispatch(id) {
        const dispatch = dispatchStore.get(id);
        if (!dispatch)
            return undefined;
        if (dispatch.status !== notification_entity_1.NotificationStatus.Failed)
            return dispatch;
        const updated = {
            ...dispatch,
            status: notification_entity_1.NotificationStatus.Pending,
            retryCount: dispatch.retryCount + 1,
            updatedAt: new Date().toISOString()
        };
        dispatchStore.set(id, updated);
        this.simulateSend(updated);
        return dispatchStore.get(id);
    }
    cancelDispatch(id) {
        const dispatch = dispatchStore.get(id);
        if (!dispatch)
            return undefined;
        if (dispatch.status === notification_entity_1.NotificationStatus.Sent)
            return dispatch;
        const updated = {
            ...dispatch,
            status: notification_entity_1.NotificationStatus.Cancelled,
            updatedAt: new Date().toISOString()
        };
        dispatchStore.set(id, updated);
        return updated;
    }
    // ── Internal ──
    simulateSend(dispatch) {
        // Simulate async sending: mark as sent after small delay, or failed randomly
        const shouldFail = dispatch.recipient.includes('fail');
        const updated = {
            ...dispatch,
            status: shouldFail ? notification_entity_1.NotificationStatus.Failed : notification_entity_1.NotificationStatus.Sent,
            sentAt: new Date().toISOString(),
            providerResponse: shouldFail
                ? { error: 'PROVIDER_REJECTED', message: 'Recipient rejected by provider' }
                : { providerId: `prov-${Date.now()}`, status: 'delivered' },
            updatedAt: new Date().toISOString()
        };
        dispatchStore.set(dispatch.id, updated);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)()
], NotificationService);
//# sourceMappingURL=notification.service.js.map