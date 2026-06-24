"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNotificationTemplateContract = toNotificationTemplateContract;
exports.toNotificationDispatchContract = toNotificationDispatchContract;
function toNotificationTemplateContract(template) {
    return {
        id: template.id,
        code: template.code,
        channel: template.channel,
        scopeType: template.scopeType,
        tenantId: template.tenantId,
        brandId: template.brandId,
        storeId: template.storeId,
        marketCode: template.marketCode,
        locale: template.locale,
        titleTemplate: template.titleTemplate,
        bodyTemplate: template.bodyTemplate,
        variables: template.variables,
        enabled: template.enabled,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
    };
}
function toNotificationDispatchContract(dispatch) {
    return {
        id: dispatch.id,
        templateId: dispatch.templateId,
        channel: dispatch.channel,
        scopeType: dispatch.scopeType,
        tenantId: dispatch.tenantId,
        brandId: dispatch.brandId,
        storeId: dispatch.storeId,
        recipient: dispatch.recipient,
        payload: dispatch.payload,
        status: dispatch.status,
        scheduledAt: dispatch.scheduledAt,
        sentAt: dispatch.sentAt,
        providerResponse: dispatch.providerResponse,
        retryCount: dispatch.retryCount,
        createdAt: dispatch.createdAt,
        updatedAt: dispatch.updatedAt
    };
}
//# sourceMappingURL=notification.contract.js.map