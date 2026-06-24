export declare enum NotificationChannelType {
    Email = "EMAIL",
    Sms = "SMS",
    Push = "PUSH",
    InApp = "IN_APP",
    Webhook = "WEBHOOK",
    Social = "SOCIAL"
}
export declare enum NotificationStatus {
    Pending = "PENDING",
    Sent = "SENT",
    Failed = "FAILED",
    Cancelled = "CANCELLED"
}
export declare enum FoundationScopeType {
    Tenant = "TENANT",
    Brand = "BRAND",
    Store = "STORE"
}
export interface NotificationTemplate {
    id: string;
    code: string;
    channel: NotificationChannelType;
    scopeType: FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    locale: string;
    titleTemplate?: string;
    bodyTemplate: string;
    variables: string[];
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface NotificationDispatch {
    id: string;
    templateId?: string;
    channel: NotificationChannelType;
    scopeType: FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    recipient: string;
    payload: Record<string, unknown>;
    status: NotificationStatus;
    scheduledAt?: string;
    sentAt?: string;
    providerResponse?: Record<string, unknown>;
    retryCount: number;
    createdAt: string;
    updatedAt: string;
}
export declare function toNotificationTemplate(input: {
    code: string;
    channel: NotificationChannelType;
    scopeType: FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
    locale: string;
    titleTemplate?: string;
    bodyTemplate: string;
    variables?: string[];
    enabled?: boolean;
}): NotificationTemplate;
export declare function toNotificationDispatch(input: {
    templateId?: string;
    channel: NotificationChannelType;
    scopeType: FoundationScopeType;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    recipient: string;
    payload: Record<string, unknown>;
    scheduledAt?: string;
}): NotificationDispatch;
//# sourceMappingURL=notification.entity.d.ts.map