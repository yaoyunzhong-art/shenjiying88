import type { NotificationDispatch, NotificationTemplate } from './notification.entity';
export interface NotificationTemplateContract {
    id: string;
    code: string;
    channel: string;
    scopeType: string;
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
export interface NotificationDispatchContract {
    id: string;
    templateId?: string;
    channel: string;
    scopeType: string;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    recipient: string;
    payload: Record<string, unknown>;
    status: string;
    scheduledAt?: string;
    sentAt?: string;
    providerResponse?: Record<string, unknown>;
    retryCount: number;
    createdAt: string;
    updatedAt: string;
}
export declare function toNotificationTemplateContract(template: NotificationTemplate): NotificationTemplateContract;
export declare function toNotificationDispatchContract(dispatch: NotificationDispatch): NotificationDispatchContract;
//# sourceMappingURL=notification.contract.d.ts.map