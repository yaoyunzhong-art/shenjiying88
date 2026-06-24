"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchService = void 0;
const common_1 = require("@nestjs/common");
const workbench_entity_1 = require("./workbench.entity");
const types_1 = require("@m5/types");
const bootstrap_contract_1 = require("../bootstrap/bootstrap.contract");
const foundation_service_1 = require("../foundation/foundation.service");
const runtime_governance_service_1 = require("../foundation/runtime-governance/runtime-governance.service");
const market_service_1 = require("../market/market.service");
const market_contract_1 = require("../market/market.contract");
const portal_service_1 = require("../portal/portal.service");
const workbench_contract_1 = require("./workbench.contract");
let WorkbenchService = class WorkbenchService {
    marketService;
    portalService;
    foundationService;
    runtimeGovernanceService;
    constructor(marketService, portalService, foundationService, runtimeGovernanceService) {
        this.marketService = marketService;
        this.portalService = portalService;
        this.foundationService = foundationService;
        this.runtimeGovernanceService = runtimeGovernanceService;
    }
    getRoleWorkbenches() {
        return types_1.defaultRoleWorkbenchContracts.map(toRoleWorkbench);
    }
    getBootstrap(context) {
        const marketProfile = this.marketService.getMergedProfile(context);
        const portals = this.portalService.getBootstrap(context);
        const foundationDependency = this.foundationService.getDependencySummary('workbench');
        return {
            tenantContext: (0, workbench_contract_1.toTenantContextContract)(context),
            workbenches: this.getRoleWorkbenches().map(workbench_contract_1.toRoleWorkbenchContract),
            storePortals: [portals.storePortal],
            tenantPortal: portals.tenantPortal,
            brandPortal: portals.brandPortal,
            marketProfile: (0, market_contract_1.toMarketProfileContract)(marketProfile),
            regionalLoginPolicies: (0, bootstrap_contract_1.toRegionalLoginPolicyContract)(portals.tenantPortal.loginEntry.loginPath, portals.tenantPortal.loginEntry.ssoEnabled),
            supportedLocales: marketProfile.locale.supportedLanguages,
            supportedClients: [...types_1.foundationSupportedClients],
            ...(0, bootstrap_contract_1.toBootstrapFoundationMetadata)(foundationDependency)
        };
    }
    /**
     * 检查角色是否拥有指定能力
     */
    checkCapability(role, capability) {
        return (0, workbench_entity_1.hasCapability)(role, capability);
    }
    submitApprovalExecution(input, tenantContext, actorContext) {
        const preset = types_1.adminRuntimeActionPresetContractMap['approval-execution'];
        return this.runtimeGovernanceService.submitAction(buildWorkbenchSubmitRequest({
            action: preset.action,
            nextStep: preset.nextStep,
            recommendedAction: preset.recommendedAction,
            requestEndpoint: preset.requestEndpoint,
            handlerName: preset.handlerName,
            payload: {
                ...preset.payload,
                approvalCode: input.approvalCode,
                operatorNote: input.operatorNote,
                challengeProfile: input.challengeProfile ?? String(preset.payload.challengeProfile ?? 'step-up'),
                ...(input.payload ?? {})
            },
            idempotencyKey: input.idempotencyKey
        }, tenantContext, actorContext));
    }
    submitSecretRotation(input, tenantContext, actorContext) {
        const preset = types_1.adminRuntimeActionPresetContractMap['secret-rotation'];
        return this.runtimeGovernanceService.submitAction(buildWorkbenchSubmitRequest({
            action: preset.action,
            nextStep: preset.nextStep,
            recommendedAction: preset.recommendedAction,
            requestEndpoint: preset.requestEndpoint,
            handlerName: preset.handlerName,
            payload: {
                ...preset.payload,
                secretName: input.secretName,
                rotationReason: input.rotationReason,
                targetScope: input.targetScope ?? String(preset.payload.targetScope ?? 'tenant'),
                ...(input.payload ?? {})
            },
            idempotencyKey: input.idempotencyKey
        }, tenantContext, actorContext));
    }
    submitRuntimeReplay(input, tenantContext, actorContext) {
        const preset = types_1.adminRuntimeActionPresetContractMap['runtime-replay'];
        return this.runtimeGovernanceService.submitAction(buildWorkbenchSubmitRequest({
            action: preset.action,
            nextStep: preset.nextStep,
            recommendedAction: preset.recommendedAction,
            requestEndpoint: preset.requestEndpoint,
            handlerName: preset.handlerName,
            payload: {
                ...preset.payload,
                sourceReceiptCode: input.sourceReceiptCode,
                operatorNote: input.operatorNote,
                ...(input.payload ?? {})
            },
            idempotencyKey: input.idempotencyKey
        }, tenantContext, actorContext));
    }
    getActionReceipt(receiptCode) {
        return this.runtimeGovernanceService.getActionReceipt(receiptCode);
    }
    syncHandlerReceipt(receiptCode, handlerName, input, tenantContext, actorContext) {
        return this.runtimeGovernanceService.syncAction(receiptCode, buildWorkbenchSyncRequest(handlerName, input, tenantContext, actorContext));
    }
    recordHandlerCallback(receiptCode, _handlerName, input, tenantContext, actorContext) {
        return this.runtimeGovernanceService.recordCallback(receiptCode, buildWorkbenchCallbackRequest(input, tenantContext, actorContext));
    }
    /**
     * 获取角色扩展引导配置
     */
    getRoleBootstrapConfig(role) {
        return (0, workbench_entity_1.getRoleBootstrapConfig)(role);
    }
    /**
     * 获取所有已定义的引导配置角色列表
     */
    getBootstrappedRoles() {
        return Object.keys(workbench_entity_1.ROLE_BOOTSTRAP_CONFIGS);
    }
    /**
     * 检查角色是否可访问目标角色的菜单
     */
    checkMenuAccess(actorRole, targetMenuRole) {
        return (0, workbench_entity_1.canAccessRoleMenu)(actorRole, targetMenuRole);
    }
    replayActionReceipt(receiptCode, input, tenantContext, actorContext) {
        return this.runtimeGovernanceService.replayAction(receiptCode, buildWorkbenchReplayRequest(input, tenantContext, actorContext));
    }
};
exports.WorkbenchService = WorkbenchService;
exports.WorkbenchService = WorkbenchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [market_service_1.MarketService,
        portal_service_1.PortalService,
        foundation_service_1.FoundationService,
        runtime_governance_service_1.RuntimeGovernanceService])
], WorkbenchService);
function toRoleWorkbench(contract) {
    return {
        role: contract.role,
        channel: contract.channel,
        title: contract.title,
        description: contract.description,
        marketCodes: [...contract.marketCodes],
        navItems: contract.navItems.map((item) => ({
            key: item.key,
            label: item.label,
            href: item.href,
            description: item.description
        }))
    };
}
function buildWorkbenchSubmitRequest(input, tenantContext, actorContext) {
    return {
        app: 'admin-web',
        action: input.action,
        nextStep: input.nextStep,
        riskLevel: 'high',
        requestEndpoint: input.requestEndpoint,
        payload: input.payload,
        payloadSummary: JSON.stringify(input.payload),
        recommendedAction: input.recommendedAction,
        handlerName: input.handlerName,
        idempotencyKey: input.idempotencyKey,
        actorId: actorContext?.actorId,
        tenantId: tenantContext?.tenantId,
        brandId: tenantContext?.brandId,
        storeId: tenantContext?.storeId,
        marketCode: tenantContext?.marketCode
    };
}
function buildWorkbenchSyncRequest(handlerName, input, tenantContext, actorContext) {
    return {
        handlerName,
        ticketCode: input.ticketCode,
        idempotencyKey: input.idempotencyKey,
        actorId: actorContext?.actorId,
        tenantId: tenantContext?.tenantId
    };
}
function buildWorkbenchCallbackRequest(input, tenantContext, actorContext) {
    return {
        callbackStatus: input.callbackStatus,
        ackToken: input.ackToken,
        lastEvent: input.lastEvent,
        summary: input.summary,
        idempotencyKey: input.idempotencyKey,
        actorId: actorContext?.actorId,
        tenantId: tenantContext?.tenantId
    };
}
function buildWorkbenchReplayRequest(input, tenantContext, actorContext) {
    return {
        ledgerKey: input.ledgerKey,
        requestedFrom: input.requestedFrom,
        ticketCode: input.ticketCode,
        idempotencyKey: input.idempotencyKey,
        actorId: actorContext?.actorId,
        tenantId: tenantContext?.tenantId
    };
}
//# sourceMappingURL=workbench.service.js.map