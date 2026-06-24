import 'reflect-metadata';
import { type RuntimeGovernanceCallbackEvent, type RuntimeGovernanceCallbackStatus, type RuntimeGovernanceReplaySource } from '@m5/types';
/** 角色引导配置查询 DTO */
export declare class RoleBootstrapConfigQueryDto {
    role: string;
}
/** 角色菜单越权检查 DTO */
export declare class RoleMenuAccessCheckDto {
    actorRole: string;
    targetMenuRole: string;
}
/**
 * 导航项查询 DTO
 */
export declare class NavItemQueryDto {
    role?: string;
    channel?: string;
    marketCode?: string;
    capability?: string;
}
/**
 * 工作台列表查询 DTO
 */
export declare class WorkbenchQueryDto {
    role?: string;
    channel?: string;
    initialized?: boolean;
}
/**
 * 租户上下文 DTO
 */
export declare class TenantContextDto {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    marketCode?: string;
}
/**
 * Bootstrap 请求 DTO
 */
export declare class WorkbenchBootstrapRequestDto {
    tenantContext: TenantContextDto;
}
/**
 * 角色能力检查 DTO
 */
export declare class CapabilityCheckDto {
    role: string;
    capability: string;
}
/**
 * 角色能力批量检查 DTO
 */
export declare class CapabilityBatchCheckDto {
    role: string;
    capabilities: string[];
}
export declare class WorkbenchApprovalExecuteDto {
    approvalCode: string;
    idempotencyKey: string;
    operatorNote?: string;
    challengeProfile?: string;
    payload?: Record<string, unknown>;
}
export declare class WorkbenchSecretRotationDto {
    secretName: string;
    idempotencyKey: string;
    rotationReason?: string;
    targetScope?: string;
    payload?: Record<string, unknown>;
}
export declare class WorkbenchRuntimeReplaySubmitDto {
    sourceReceiptCode: string;
    idempotencyKey: string;
    operatorNote?: string;
    payload?: Record<string, unknown>;
}
export declare class WorkbenchHandlerSyncDto {
    ticketCode: string;
    idempotencyKey: string;
}
export declare class WorkbenchHandlerCallbackDto {
    callbackStatus: RuntimeGovernanceCallbackStatus;
    ackToken: string;
    lastEvent: RuntimeGovernanceCallbackEvent;
    summary: string;
    idempotencyKey: string;
}
export declare class WorkbenchActionReplayDto {
    ledgerKey: string;
    requestedFrom: RuntimeGovernanceReplaySource;
    ticketCode: string;
    idempotencyKey: string;
}
//# sourceMappingURL=workbench.dto.d.ts.map