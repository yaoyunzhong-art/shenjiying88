import type { RequestTenantContext } from '../tenant/tenant.types';
import { RegisterNotificationTemplateDto, SendNotificationDto, UpdateNotificationTemplateDto } from './notification.dto';
import { FoundationScopeType, NotificationChannelType, NotificationStatus } from './notification.entity';
import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    registerTemplate(tenantContext: RequestTenantContext, body: RegisterNotificationTemplateDto): import("./notification.contract").NotificationTemplateContract;
    listTemplates(tenantContext: RequestTenantContext, channel?: NotificationChannelType, scopeType?: FoundationScopeType, enabled?: string): import("./notification.contract").NotificationTemplateContract[];
    getTemplate(id: string): import("./notification.contract").NotificationTemplateContract | null;
    updateTemplate(id: string, body: UpdateNotificationTemplateDto): import("./notification.contract").NotificationTemplateContract | null;
    send(tenantContext: RequestTenantContext, body: SendNotificationDto): import("./notification.contract").NotificationDispatchContract;
    listDispatches(tenantContext: RequestTenantContext, status?: NotificationStatus, channel?: NotificationChannelType, recipient?: string): import("./notification.contract").NotificationDispatchContract[];
    getDispatch(id: string): import("./notification.contract").NotificationDispatchContract | null;
    retryDispatch(id: string): import("./notification.contract").NotificationDispatchContract | null;
    cancelDispatch(id: string): import("./notification.contract").NotificationDispatchContract | null;
}
//# sourceMappingURL=notification.controller.d.ts.map