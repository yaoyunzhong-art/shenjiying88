import type { RequestActorContext } from '../../tenant/tenant.types';
export interface TenantScopeMetadata {
    tenantIdParam?: string;
    brandIdParam?: string;
    storeIdParam?: string;
    useRequestTenant?: boolean;
}
export declare const ROLES_METADATA_KEY = "identity-access:roles";
export declare const PERMISSIONS_METADATA_KEY = "identity-access:permissions";
export declare const TENANT_SCOPE_METADATA_KEY = "identity-access:tenant-scope";
export declare const CurrentActor: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const RequireRoles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequirePermissions: (...permissions: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireTenantScope: (metadata?: TenantScopeMetadata) => import("@nestjs/common").CustomDecorator<string>;
export type CurrentActorValue = RequestActorContext | undefined;
//# sourceMappingURL=identity-access.decorator.d.ts.map