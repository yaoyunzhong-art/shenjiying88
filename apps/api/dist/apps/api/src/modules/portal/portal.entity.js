"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPortalEntity = toPortalEntity;
exports.isTobPortalEntity = isTobPortalEntity;
exports.isStorePortalEntity = isStorePortalEntity;
exports.isSsoEnabled = isSsoEnabled;
const domain_1 = require("@m5/domain");
/**
 * 从 BasePortal + 上下文构造 PortalEntity
 */
function toPortalEntity(portal, overrides) {
    const base = {
        id: overrides.id,
        tenantId: overrides.tenantId,
        brandId: overrides.brandId,
        storeId: overrides.storeId,
        audience: portal.audience,
        scopeType: portal.scopeType,
        scopeCode: portal.scopeCode,
        marketCode: portal.marketCode,
        channel: portal.channel,
        name: portal.name,
        primaryDomain: portal.primaryDomain,
        supportedLanguages: portal.supportedLanguages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    if (portal.audience === domain_1.PortalAudience.ToB) {
        const tobPortal = portal;
        base.heroTitle = tobPortal.heroTitle;
        base.heroSubtitle = tobPortal.heroSubtitle;
        base.solutionTags = tobPortal.solutionTags;
        base.loginEntry = tobPortal.loginEntry;
    }
    if (portal.audience === domain_1.PortalAudience.ToC) {
        const storePortal = portal;
        base.supportedSurfaces = storePortal.supportedSurfaces;
        base.storeName = storePortal.storeName;
    }
    return base;
}
/**
 * 判断是否是 ToB 门户
 */
function isTobPortalEntity(entity) {
    return entity.audience === domain_1.PortalAudience.ToB;
}
/**
 * 判断是否是 Store 门户
 */
function isStorePortalEntity(entity) {
    return entity.audience === domain_1.PortalAudience.ToC;
}
/**
 * 判断门户是否启用 SSO
 */
function isSsoEnabled(entity) {
    return entity.loginEntry?.ssoEnabled ?? false;
}
//# sourceMappingURL=portal.entity.js.map