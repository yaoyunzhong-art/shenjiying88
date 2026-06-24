"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toWorkbenchNavItemContract = toWorkbenchNavItemContract;
exports.toRoleWorkbenchContract = toRoleWorkbenchContract;
exports.toTenantContextContract = toTenantContextContract;
function toWorkbenchNavItemContract(item) {
    return {
        key: item.key,
        label: item.label,
        href: item.href,
        description: item.description
    };
}
function toRoleWorkbenchContract(workbench) {
    return {
        role: workbench.role,
        channel: workbench.channel,
        title: workbench.title,
        description: workbench.description,
        marketCodes: workbench.marketCodes ?? [],
        navItems: workbench.navItems.map(toWorkbenchNavItemContract)
    };
}
function toTenantContextContract(context) {
    return {
        tenantId: context.tenantId,
        ...(context.brandId ? { brandId: context.brandId } : {}),
        ...(context.storeId ? { storeId: context.storeId } : {}),
        ...(context.marketCode ? { marketCode: context.marketCode } : {})
    };
}
//# sourceMappingURL=workbench.contract.js.map