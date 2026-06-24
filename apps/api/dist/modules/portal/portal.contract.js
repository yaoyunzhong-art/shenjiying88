"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTobPortalContract = toTobPortalContract;
exports.toStorePortalContract = toStorePortalContract;
function toTobPortalContract(portal) {
    const primaryDomain = portal.primaryDomain ?? `${portal.scopeCode}.${portal.marketCode}.b2b.local`;
    return {
        audience: portal.audience,
        scopeType: portal.scopeType,
        scopeCode: portal.scopeCode,
        tenantCode: portal.tenantCode,
        brandCode: portal.brandCode,
        marketCode: portal.marketCode,
        channel: portal.channel,
        name: portal.name,
        primaryDomain,
        supportedLanguages: portal.supportedLanguages,
        heroTitle: portal.heroTitle,
        heroSubtitle: portal.heroSubtitle,
        solutionTags: portal.solutionTags,
        loginEntry: portal.loginEntry
    };
}
function toStorePortalContract(portal) {
    const primaryDomain = portal.primaryDomain ?? `${portal.storeCode}.${portal.marketCode}.local`;
    return {
        audience: portal.audience,
        scopeType: portal.scopeType,
        scopeCode: portal.scopeCode,
        tenantCode: portal.tenantCode,
        brandCode: portal.brandCode,
        storeCode: portal.storeCode,
        storeName: portal.storeName,
        marketCode: portal.marketCode,
        channel: portal.channel,
        name: portal.name,
        primaryDomain,
        supportedLanguages: portal.supportedLanguages,
        supportedSurfaces: portal.supportedSurfaces
    };
}
//# sourceMappingURL=portal.contract.js.map