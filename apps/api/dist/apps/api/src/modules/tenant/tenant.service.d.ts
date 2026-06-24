import type { RequestActorContext, RequestGovernanceContext, RequestTenantContext, ResolvedActorContext } from './tenant.types';
/**
 * 多租户上下文解析服务。
 *
 * 合并规则：
 *  - effectiveTenantId: actor > tenant > 默认 'tenant-demo'
 *  - effectiveBrandId / effectiveStoreId: actor > tenant
 *  - effectiveMarketCode: 直接从 tenantContext 取
 */
export declare class TenantService {
    resolveTenantContext(tenantContext: RequestTenantContext, actorContext?: RequestActorContext, _governanceContext?: RequestGovernanceContext): ResolvedActorContext;
}
//# sourceMappingURL=tenant.service.d.ts.map