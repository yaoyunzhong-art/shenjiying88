import { type CurrentActorValue } from '../foundation/identity-access/identity-access.decorator';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { WorkbenchService } from './workbench.service';
import { CapabilityCheckDto, NavItemQueryDto, WorkbenchActionReplayDto, WorkbenchApprovalExecuteDto, WorkbenchHandlerCallbackDto, WorkbenchHandlerSyncDto, WorkbenchQueryDto, WorkbenchRuntimeReplaySubmitDto, WorkbenchSecretRotationDto } from './workbench.dto';
export declare class WorkbenchController {
    private readonly workbenchService;
    constructor(workbenchService: WorkbenchService);
    /**
     * 获取工作台引导数据（含完整 bootstrap 载荷）
     */
    getBootstrap(tenantContext: RequestTenantContext): import("@m5/types").WorkbenchBootstrapResponse;
    /**
     * 查询角色工作台列表（可按角色、渠道、初始化状态筛选）
     */
    getWorkbenches(query: WorkbenchQueryDto): {
        workbenches: import("@m5/domain").RoleWorkbench[];
        total: number;
    };
    /**
     * 获取导航项（可按角色、渠道、市场、能力筛选）
     */
    getNavItems(query: NavItemQueryDto): {
        navItems: {
            role: import("@m5/domain").UserRole;
            channel: import("@m5/domain").ClientChannel;
            marketCodes: string[] | undefined;
            key: string;
            label: string;
            href: string;
            description: string;
        }[];
        total: number;
    };
    /**
     * 检查角色是否拥有指定能力
     */
    checkCapability(query: CapabilityCheckDto): {
        role: string;
        capability: string;
        has: boolean;
    };
    executeApproval(body: WorkbenchApprovalExecuteDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    rotateSecret(body: WorkbenchSecretRotationDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    submitRuntimeReplay(body: WorkbenchRuntimeReplaySubmitDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    getActionReceipt(receiptCode: string): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    syncHandlerReceipt(receiptCode: string, handlerName: string, body: WorkbenchHandlerSyncDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    recordHandlerCallback(receiptCode: string, handlerName: string, body: WorkbenchHandlerCallbackDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
    replayActionReceipt(receiptCode: string, body: WorkbenchActionReplayDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<import("@m5/types").RuntimeGovernanceReceipt>;
}
//# sourceMappingURL=workbench.controller.d.ts.map