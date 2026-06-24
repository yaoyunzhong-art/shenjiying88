"use strict";
/**
 * 🐜 自动: [identity-access] [A] entity 补全
 *
 * identity-access 模块的核心实体类型定义：
 * - ActorIdentity: 经过认证的参与者身份
 * - AccessPolicy: 访问控制策略
 * - AuthorizationRequest: 授权请求
 * - AuthorizationResult: 授权结果
 * - TenantScopeBinding: 租户作用域绑定
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_SOURCES = exports.SYSTEM_PERMISSIONS = exports.SYSTEM_ROLES = void 0;
// ── Constants ──
/**
 * 预定义角色常量
 */
exports.SYSTEM_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    TENANT_ADMIN: 'TENANT_ADMIN',
    BRAND_MANAGER: 'BRAND_MANAGER',
    STORE_MANAGER: 'STORE_MANAGER',
    CASHIER: 'CASHIER',
    GUIDE: 'GUIDE',
    OPERATIONS: 'OPERATIONS',
    SECURITY_ADMIN: 'SECURITY_ADMIN',
    HR: 'HR',
    MARKETING: 'MARKETING',
    TEAMBUILDING: 'TEAMBUILDING',
};
/**
 * 预定义权限常量
 */
exports.SYSTEM_PERMISSIONS = {
    FOUNDATION_GOVERNANCE_READ: 'foundation.governance.read',
    FOUNDATION_GOVERNANCE_WRITE: 'foundation.governance.write',
    FOUNDATION_RUNTIME_GOVERNANCE_READ: 'foundation.runtime-governance.read',
    FOUNDATION_RUNTIME_GOVERNANCE_WRITE: 'foundation.runtime-governance.write',
    WORKBENCH_READ: 'workbench.read',
    WORKBENCH_WRITE: 'workbench.write',
    MEMBER_READ: 'member.read',
    MEMBER_WRITE: 'member.write',
    LOYALTY_READ: 'loyalty.read',
    LOYALTY_WRITE: 'loyalty.write',
    ANALYTICS_READ: 'analytics.read',
    CASHIER_READ: 'cashier.read',
    CASHIER_WRITE: 'cashier.write',
    MARKET_READ: 'market.read',
    MARKET_WRITE: 'market.write',
    CAMPAIGN_READ: 'campaign.read',
    CAMPAIGN_WRITE: 'campaign.write',
    AI_RULE_ENGINE_READ: 'ai-rule-engine.read',
    AI_RULE_ENGINE_WRITE: 'ai-rule-engine.write',
    TENANT_CROSS_SCOPE: 'tenant:cross-scope',
    TENANT_ALL: 'tenant:*',
};
/**
 * 认证来源常量
 */
exports.AUTH_SOURCES = {
    JWT: 'jwt',
    SESSION: 'session',
    DEVICE_TOKEN: 'device-token',
    API_KEY: 'api-key',
};
//# sourceMappingURL=identity-access.entity.js.map