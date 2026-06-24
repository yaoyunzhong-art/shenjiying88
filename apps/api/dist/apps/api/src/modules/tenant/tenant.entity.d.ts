/**
 * 租户上下文解析实体。
 *
 * 定义演员类型枚举、租户上下文实体接口，
 * 以及租户上下文构建与解析工具函数。
 */
import type { ResolvedActorContext, RequestTenantContext, RequestActorContext, RequestGovernanceContext, ActorType, TenantScopeRequirement } from './tenant.types';
export { type ActorType, type RequestTenantContext, type RequestActorContext, type RequestGovernanceContext, type ResolvedActorContext, type TenantScopeRequirement };
/**
 * 默认租户 ID
 */
export declare const DEFAULT_TENANT_ID = "tenant-demo";
/**
 * 默认市场代码
 */
export declare const DEFAULT_MARKET_CODE = "default";
/**
 * 演员类型枚举值
 */
export declare const ActorTypes: {
    readonly PlatformUser: "platform-user";
    readonly TenantUser: "tenant-user";
    readonly BrandUser: "brand-user";
    readonly StoreUser: "store-user";
    readonly EmployeeUser: "employee-user";
    readonly ServiceAccount: "service-account";
};
/**
 * 构造默认的请求租户上下文
 */
export declare function createDefaultTenantContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext;
/**
 * 构造默认的已解析演员上下文
 */
export declare function createEmptyResolvedActorContext(overrides?: Partial<ResolvedActorContext>): ResolvedActorContext;
/**
 * 确定有效的租户 ID：actor > tenant > 默认
 */
export declare function resolveEffectiveTenantId(actorContext?: RequestActorContext, tenantContext?: RequestTenantContext): string;
/**
 * 确定有效的品牌 ID：actor > tenant
 */
export declare function resolveEffectiveBrandId(actorContext?: RequestActorContext, tenantContext?: RequestTenantContext): string | undefined;
/**
 * 确定有效的门店 ID：actor > tenant
 */
export declare function resolveEffectiveStoreId(actorContext?: RequestActorContext, tenantContext?: RequestTenantContext): string | undefined;
/**
 * 确定有效的市场代码：从 tenantContext 取
 */
export declare function resolveEffectiveMarketCode(tenantContext?: RequestTenantContext): string;
/**
 * 检查演员是否已认证
 */
export declare function isActorAuthenticated(actorContext?: RequestActorContext): boolean;
/**
 * 将演员上下文格式化为摘要信息
 */
export declare function actorSummary(actorContext?: RequestActorContext): string | null;
/**
 * 判断租户作用域是否匹配
 */
export declare function matchesTenantScope(ctx: ResolvedActorContext, requirement?: TenantScopeRequirement): boolean;
//# sourceMappingURL=tenant.entity.d.ts.map