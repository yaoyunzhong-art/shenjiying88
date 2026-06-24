import { PortalAudience, PortalScopeType, PortalChannel, StorefrontSurface, LanguageCode } from '@m5/domain';
/**
 * 门户登录入口 DTO
 */
export declare class PortalLoginEntryDto {
    label: string;
    loginPath: string;
    ssoEnabled: boolean;
}
/**
 * 创建门户请求 DTO
 */
export declare class CreatePortalDto {
    tenantId: string;
    brandId?: string;
    storeId?: string;
    audience: PortalAudience;
    scopeType: PortalScopeType;
    scopeCode: string;
    marketCode: string;
    channel: PortalChannel;
    name: string;
    primaryDomain?: string;
    supportedLanguages: LanguageCode[];
    heroTitle?: string;
    heroSubtitle?: string;
    solutionTags?: string[];
    loginEntry?: PortalLoginEntryDto;
    supportedSurfaces?: StorefrontSurface[];
    storeName?: string;
}
/**
 * 更新门户请求 DTO
 */
export declare class UpdatePortalDto {
    name?: string;
    primaryDomain?: string;
    supportedLanguages?: LanguageCode[];
    heroTitle?: string;
    heroSubtitle?: string;
    solutionTags?: string[];
    loginEntry?: PortalLoginEntryDto;
    supportedSurfaces?: StorefrontSurface[];
    storeName?: string;
}
/**
 * 门户查询参数 DTO
 */
export declare class PortalQueryDto {
    tenantId?: string;
    brandId?: string;
    storeId?: string;
    audience?: PortalAudience;
    scopeType?: PortalScopeType;
    marketCode?: string;
}
//# sourceMappingURL=portal.dto.d.ts.map