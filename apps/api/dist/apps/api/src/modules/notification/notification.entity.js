"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoundationScopeType = exports.NotificationStatus = exports.NotificationChannelType = void 0;
exports.toNotificationTemplate = toNotificationTemplate;
exports.toNotificationDispatch = toNotificationDispatch;
var NotificationChannelType;
(function (NotificationChannelType) {
    NotificationChannelType["Email"] = "EMAIL";
    NotificationChannelType["Sms"] = "SMS";
    NotificationChannelType["Push"] = "PUSH";
    NotificationChannelType["InApp"] = "IN_APP";
    NotificationChannelType["Webhook"] = "WEBHOOK";
    NotificationChannelType["Social"] = "SOCIAL";
})(NotificationChannelType || (exports.NotificationChannelType = NotificationChannelType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["Pending"] = "PENDING";
    NotificationStatus["Sent"] = "SENT";
    NotificationStatus["Failed"] = "FAILED";
    NotificationStatus["Cancelled"] = "CANCELLED";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var FoundationScopeType;
(function (FoundationScopeType) {
    FoundationScopeType["Tenant"] = "TENANT";
    FoundationScopeType["Brand"] = "BRAND";
    FoundationScopeType["Store"] = "STORE";
})(FoundationScopeType || (exports.FoundationScopeType = FoundationScopeType = {}));
// ── Entity factories ──
let templateIdCounter = 0;
let dispatchIdCounter = 0;
function toNotificationTemplate(input) {
    const now = new Date().toISOString();
    return {
        id: `${input.code}-${Date.now()}-${++templateIdCounter}`,
        code: input.code,
        channel: input.channel,
        scopeType: input.scopeType,
        tenantId: input.tenantId,
        brandId: input.brandId,
        storeId: input.storeId,
        marketCode: input.marketCode,
        locale: input.locale,
        titleTemplate: input.titleTemplate,
        bodyTemplate: input.bodyTemplate,
        variables: input.variables ?? [],
        enabled: input.enabled ?? true,
        createdAt: now,
        updatedAt: now
    };
}
function toNotificationDispatch(input) {
    const now = new Date().toISOString();
    return {
        id: `dispatch-${Date.now()}-${++dispatchIdCounter}`,
        templateId: input.templateId,
        channel: input.channel,
        scopeType: input.scopeType,
        tenantId: input.tenantId,
        brandId: input.brandId,
        storeId: input.storeId,
        recipient: input.recipient,
        payload: input.payload,
        status: NotificationStatus.Pending,
        scheduledAt: input.scheduledAt ?? now,
        retryCount: 0,
        createdAt: now,
        updatedAt: now
    };
}
//# sourceMappingURL=notification.entity.js.map