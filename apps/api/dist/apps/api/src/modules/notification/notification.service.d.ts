import { FoundationScopeType, NotificationChannelType, NotificationStatus, type NotificationDispatch, type NotificationTemplate } from './notification.entity';
export declare function resetNotificationServiceTestState(): void;
export declare class NotificationService {
    registerTemplate(input: {
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
    getTemplate(id: string): NotificationTemplate | undefined;
    findTemplateByCode(code: string): NotificationTemplate | undefined;
    listTemplates(filters?: {
        channel?: NotificationChannelType;
        scopeType?: FoundationScopeType;
        tenantId?: string;
        enabled?: boolean;
    }): NotificationTemplate[];
    updateTemplate(id: string, patch: {
        titleTemplate?: string;
        bodyTemplate?: string;
        variables?: string[];
        enabled?: boolean;
    }): NotificationTemplate | undefined;
    send(input: {
        templateCode?: string;
        channel: NotificationChannelType;
        scopeType: FoundationScopeType;
        tenantId?: string;
        brandId?: string;
        storeId?: string;
        recipient: string;
        payload: Record<string, unknown>;
        scheduledAt?: string;
    }): NotificationDispatch;
    getDispatch(id: string): NotificationDispatch | undefined;
    listDispatches(filters?: {
        status?: NotificationStatus;
        channel?: NotificationChannelType;
        tenantId?: string;
        recipient?: string;
    }): NotificationDispatch[];
    retryDispatch(id: string): NotificationDispatch | undefined;
    cancelDispatch(id: string): NotificationDispatch | undefined;
    private simulateSend;
}
//# sourceMappingURL=notification.service.d.ts.map