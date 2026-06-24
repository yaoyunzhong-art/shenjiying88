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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkbenchController = void 0;
const common_1 = require("@nestjs/common");
const identity_access_decorator_1 = require("../foundation/identity-access/identity-access.decorator");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const workbench_service_1 = require("./workbench.service");
const workbench_dto_1 = require("./workbench.dto");
const WORKBENCH_READ_ROLES = [
    'SUPER_ADMIN',
    'TENANT_ADMIN',
    'BRAND_MANAGER',
    'STORE_MANAGER',
    'GUIDE',
    'CASHIER',
    'OPERATIONS',
    'SECURITY_ADMIN'
];
const WORKBENCH_READ_PERMISSION = 'workbench.read';
const WORKBENCH_RUNTIME_READ_PERMISSION = 'foundation.runtime-governance.read';
const WORKBENCH_RUNTIME_WRITE_PERMISSION = 'foundation.runtime-governance.write';
const WORKBENCH_ACTION_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'];
const WORKBENCH_SECRET_ROTATION_ROLES = ['SUPER_ADMIN', 'SECURITY_ADMIN'];
let WorkbenchController = class WorkbenchController {
    workbenchService;
    constructor(workbenchService) {
        this.workbenchService = workbenchService;
    }
    /**
     * 获取工作台引导数据（含完整 bootstrap 载荷）
     */
    getBootstrap(tenantContext) {
        return this.workbenchService.getBootstrap(tenantContext);
    }
    /**
     * 查询角色工作台列表（可按角色、渠道、初始化状态筛选）
     */
    getWorkbenches(query) {
        const workbenches = this.workbenchService.getRoleWorkbenches();
        let result = workbenches;
        if (query.role) {
            result = result.filter(w => w.role === query.role);
        }
        if (query.channel) {
            result = result.filter(w => w.channel === query.channel);
        }
        if (query.initialized !== undefined) {
            // initialized flag 只是一个过滤器示例：当 false 时返回空数组模拟未初始化
            if (!query.initialized)
                result = [];
        }
        return { workbenches: result, total: result.length };
    }
    /**
     * 获取导航项（可按角色、渠道、市场、能力筛选）
     */
    getNavItems(query) {
        const workbenches = this.workbenchService.getRoleWorkbenches();
        let navItems = workbenches.flatMap(w => w.navItems.map(item => ({ ...item, role: w.role, channel: w.channel, marketCodes: w.marketCodes })));
        if (query.role) {
            navItems = navItems.filter(n => n.role === query.role);
        }
        if (query.channel) {
            navItems = navItems.filter(n => n.channel === query.channel);
        }
        if (query.marketCode) {
            navItems = navItems.filter(n => n.marketCodes?.includes(query.marketCode));
        }
        if (query.capability) {
            navItems = navItems.filter(n => this.workbenchService.checkCapability(n.role, query.capability));
        }
        return { navItems, total: navItems.length };
    }
    /**
     * 检查角色是否拥有指定能力
     */
    checkCapability(query) {
        const has = this.workbenchService.checkCapability(query.role, query.capability);
        return { role: query.role, capability: query.capability, has };
    }
    executeApproval(body, tenantContext, actorContext) {
        return this.workbenchService.submitApprovalExecution(body, tenantContext, actorContext);
    }
    rotateSecret(body, tenantContext, actorContext) {
        return this.workbenchService.submitSecretRotation(body, tenantContext, actorContext);
    }
    submitRuntimeReplay(body, tenantContext, actorContext) {
        return this.workbenchService.submitRuntimeReplay(body, tenantContext, actorContext);
    }
    getActionReceipt(receiptCode) {
        return this.workbenchService.getActionReceipt(receiptCode);
    }
    syncHandlerReceipt(receiptCode, handlerName, body, tenantContext, actorContext) {
        return this.workbenchService.syncHandlerReceipt(receiptCode, handlerName, body, tenantContext, actorContext);
    }
    recordHandlerCallback(receiptCode, handlerName, body, tenantContext, actorContext) {
        return this.workbenchService.recordHandlerCallback(receiptCode, handlerName, body, tenantContext, actorContext);
    }
    replayActionReceipt(receiptCode, body, tenantContext, actorContext) {
        return this.workbenchService.replayActionReceipt(receiptCode, body, tenantContext, actorContext);
    }
};
exports.WorkbenchController = WorkbenchController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_READ_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_READ_PERMISSION),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)(),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_READ_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_READ_PERMISSION),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.WorkbenchQueryDto]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "getWorkbenches", null);
__decorate([
    (0, common_1.Get)('nav-items'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_READ_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_READ_PERMISSION),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.NavItemQueryDto]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "getNavItems", null);
__decorate([
    (0, common_1.Get)('capability-check'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_READ_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_READ_PERMISSION),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.CapabilityCheckDto]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "checkCapability", null);
__decorate([
    (0, common_1.Post)('approvals/execute'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.WorkbenchApprovalExecuteDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "executeApproval", null);
__decorate([
    (0, common_1.Post)('secrets/rotate'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_SECRET_ROTATION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.WorkbenchSecretRotationDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "rotateSecret", null);
__decorate([
    (0, common_1.Post)('actions/runtime-replay'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workbench_dto_1.WorkbenchRuntimeReplaySubmitDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "submitRuntimeReplay", null);
__decorate([
    (0, common_1.Get)('actions/:receiptCode'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_READ_PERMISSION),
    __param(0, (0, common_1.Param)('receiptCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "getActionReceipt", null);
__decorate([
    (0, common_1.Post)('handlers/:handlerName/receipts/:receiptCode/sync'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Param)('handlerName')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, tenant_decorator_1.TenantContext)()),
    __param(4, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, workbench_dto_1.WorkbenchHandlerSyncDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "syncHandlerReceipt", null);
__decorate([
    (0, common_1.Post)('handlers/:handlerName/receipts/:receiptCode/callback'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Param)('handlerName')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, tenant_decorator_1.TenantContext)()),
    __param(4, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, workbench_dto_1.WorkbenchHandlerCallbackDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "recordHandlerCallback", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/replay'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)(...WORKBENCH_ACTION_ROLES),
    (0, identity_access_decorator_1.RequirePermissions)(WORKBENCH_RUNTIME_WRITE_PERMISSION),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workbench_dto_1.WorkbenchActionReplayDto, Object, Object]),
    __metadata("design:returntype", void 0)
], WorkbenchController.prototype, "replayActionReceipt", null);
exports.WorkbenchController = WorkbenchController = __decorate([
    (0, common_1.Controller)('workbenches'),
    __metadata("design:paramtypes", [workbench_service_1.WorkbenchService])
], WorkbenchController);
//# sourceMappingURL=workbench.controller.js.map