"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityAccessService = void 0;
const common_1 = require("@nestjs/common");
const PRIVILEGED_ROLES = new Set(['platform-admin', 'super-admin']);
const CROSS_SCOPE_PERMISSIONS = new Set(['tenant:cross-scope', 'tenant:*']);
let IdentityAccessService = class IdentityAccessService {
    normalizeList(values = []) {
        return Array.from(new Set(values
            .map((value) => value.trim())
            .filter(Boolean)));
    }
    normalizeActorContext(actorContext) {
        if (!actorContext?.actorId) {
            return null;
        }
        return {
            ...actorContext,
            roles: this.normalizeList(actorContext.roles),
            permissions: this.normalizeList(actorContext.permissions),
            authenticated: actorContext.authenticated !== false
        };
    }
    resolveActorContext(tenantContext, actorContext) {
        const actor = this.normalizeActorContext(actorContext);
        const roles = actor?.roles ?? [];
        const permissions = actor?.permissions ?? [];
        return {
            authenticated: Boolean(actor),
            actor,
            tenantContext,
            effectiveTenantId: actor?.tenantId ?? tenantContext.tenantId,
            effectiveBrandId: actor?.brandId ?? tenantContext.brandId,
            effectiveStoreId: actor?.storeId ?? tenantContext.storeId,
            effectiveMarketCode: tenantContext.marketCode ?? 'us-default',
            roles,
            permissions
        };
    }
    hasAnyRole(actorContext, requiredRoles = []) {
        if (requiredRoles.length === 0) {
            return true;
        }
        const actor = this.normalizeActorContext(actorContext);
        if (!actor) {
            return false;
        }
        return requiredRoles.some((role) => actor.roles.includes(role));
    }
    hasAllPermissions(actorContext, requiredPermissions = []) {
        if (requiredPermissions.length === 0) {
            return true;
        }
        const actor = this.normalizeActorContext(actorContext);
        if (!actor) {
            return false;
        }
        return requiredPermissions.every((permission) => actor.permissions.includes(permission) || actor.permissions.includes('*'));
    }
    isPrivilegedActor(actorContext) {
        const actor = this.normalizeActorContext(actorContext);
        if (!actor) {
            return false;
        }
        return (actor.roles.some((role) => PRIVILEGED_ROLES.has(role)) ||
            actor.permissions.some((permission) => CROSS_SCOPE_PERMISSIONS.has(permission)));
    }
    validateTenantScope(tenantContext, actorContext, requiredScope) {
        const resolved = this.resolveActorContext(tenantContext, actorContext);
        if (this.isPrivilegedActor(actorContext)) {
            return true;
        }
        return ((!requiredScope.tenantId || resolved.effectiveTenantId === requiredScope.tenantId) &&
            (!requiredScope.brandId || resolved.effectiveBrandId === requiredScope.brandId) &&
            (!requiredScope.storeId || resolved.effectiveStoreId === requiredScope.storeId));
    }
    authorizeAction(action, resourceScope, tenantContext, actorContext) {
        const resolved = tenantContext
            ? this.resolveActorContext(tenantContext, actorContext)
            : undefined;
        const permissionMatched = this.hasAllPermissions(actorContext, action ? [action] : []);
        const tenantScopeMatched = tenantContext
            ? this.validateTenantScope(tenantContext, actorContext, resourceScope)
            : true;
        return {
            status: permissionMatched && tenantScopeMatched ? 'allowed' : 'denied',
            action,
            resourceScope,
            actor: resolved?.actor ?? null,
            permissionMatched,
            tenantScopeMatched,
            enforcedBy: ['IdentityAccessGuard', 'IdentityAccessService.hasAllPermissions', 'tenant-scope-check']
        };
    }
    getDescriptor() {
        return {
            key: 'identity-access',
            name: 'Identity Access Module',
            purpose: '统一认证、授权与租户隔离入口，避免门户或业务模块直接拼接身份策略。',
            inboundContracts: [
                'HTTP headers / JWT / session claims / device credentials',
                'TenantMiddleware tenant context',
                'Portal / Workbench requested scope'
            ],
            outboundContracts: ['Resolved actor context', 'Authorization decision', 'Tenant isolation guardrails'],
            capabilities: [
                {
                    key: 'authentication',
                    name: '认证入口',
                    responsibilities: ['统一用户类型解析', '从请求头提取 actor/role/permissions', '输出标准访问上下文'],
                    entrypoints: ['IdentityAccessService.resolveActorContext'],
                    consumers: ['portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                },
                {
                    key: 'authorization',
                    name: '授权入口',
                    responsibilities: ['角色判定', '权限判定', 'Guard 元数据校验', '按市场和品牌差异化授权'],
                    entrypoints: ['IdentityAccessGuard.canActivate', 'IdentityAccessService.authorizeAction'],
                    consumers: ['portal', 'workbench'],
                    status: 'active'
                },
                {
                    key: 'tenant-isolation',
                    name: '租户隔离入口',
                    responsibilities: ['API 默认附加租户作用域', '按 tenant/brand/store 校验访问范围', '导出/缓存/文件链路隔离'],
                    entrypoints: ['TenantMiddleware.use', 'IdentityAccessGuard.canActivate'],
                    consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
                    status: 'active'
                }
            ]
        };
    }
};
exports.IdentityAccessService = IdentityAccessService;
exports.IdentityAccessService = IdentityAccessService = __decorate([
    (0, common_1.Injectable)()
], IdentityAccessService);
//# sourceMappingURL=identity-access.service.js.map