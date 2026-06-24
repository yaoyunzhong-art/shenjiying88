import { type RoleBootstrapConfig } from './workbench.entity';
import { type RoleWorkbench } from '@m5/domain';
import { type RuntimeGovernanceReceipt, type WorkbenchBootstrapResponse } from '@m5/types';
import { FoundationService } from '../foundation/foundation.service';
import { type CurrentActorValue } from '../foundation/identity-access/identity-access.decorator';
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service';
import { MarketService } from '../market/market.service';
import { PortalService } from '../portal/portal.service';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { type WorkbenchActionReplayDto, type WorkbenchApprovalExecuteDto, type WorkbenchHandlerCallbackDto, type WorkbenchHandlerSyncDto, type WorkbenchRuntimeReplaySubmitDto, type WorkbenchSecretRotationDto } from './workbench.dto';
export declare class WorkbenchService {
    private readonly marketService;
    private readonly portalService;
    private readonly foundationService;
    private readonly runtimeGovernanceService;
    constructor(marketService: MarketService, portalService: PortalService, foundationService: FoundationService, runtimeGovernanceService: RuntimeGovernanceService);
    getRoleWorkbenches(): RoleWorkbench[];
    getBootstrap(context: RequestTenantContext): WorkbenchBootstrapResponse;
    /**
     * 检查角色是否拥有指定能力
     */
    checkCapability(role: string, capability: string): boolean;
    submitApprovalExecution(input: WorkbenchApprovalExecuteDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
    submitSecretRotation(input: WorkbenchSecretRotationDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
    submitRuntimeReplay(input: WorkbenchRuntimeReplaySubmitDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
    getActionReceipt(receiptCode: string): Promise<RuntimeGovernanceReceipt>;
    syncHandlerReceipt(receiptCode: string, handlerName: string, input: WorkbenchHandlerSyncDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
    recordHandlerCallback(receiptCode: string, _handlerName: string, input: WorkbenchHandlerCallbackDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
    /**
     * 获取角色扩展引导配置
     */
    getRoleBootstrapConfig(role: string): RoleBootstrapConfig | undefined;
    /**
     * 获取所有已定义的引导配置角色列表
     */
    getBootstrappedRoles(): string[];
    /**
     * 检查角色是否可访问目标角色的菜单
     */
    checkMenuAccess(actorRole: string, targetMenuRole: string): boolean;
    replayActionReceipt(receiptCode: string, input: WorkbenchActionReplayDto, tenantContext: RequestTenantContext | undefined, actorContext: CurrentActorValue): Promise<RuntimeGovernanceReceipt>;
}
//# sourceMappingURL=workbench.service.d.ts.map