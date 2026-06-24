import 'reflect-metadata';
import { FoundationScopeType, NotificationChannelType } from './notification.entity';
export declare class RegisterNotificationTemplateDto {
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
}
export declare class SendNotificationDto {
    templateCode?: string;
    channel: NotificationChannelType;
    scopeType: FoundationScopeType;
    recipient: string;
    payload: Record<string, unknown>;
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    scheduledAt?: string;
}
export declare class UpdateNotificationTemplateDto {
    titleTemplate?: string;
    bodyTemplate?: string;
    variables?: string[];
    enabled?: boolean;
}
//# sourceMappingURL=notification.dto.d.ts.map