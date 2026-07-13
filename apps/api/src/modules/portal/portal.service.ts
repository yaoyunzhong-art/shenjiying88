import { Injectable, Optional } from '@nestjs/common'
import {
  LanguageCode,
  PortalAudience,
  PortalChannel,
  PortalScopeType,
  StorefrontSurface,
  type StorePortal,
  type TobPortal
} from '@m5/domain'
import type { PortalBootstrapResponse } from '@m5/types'
import { toBootstrapFoundationMetadata } from '../bootstrap/bootstrap.contract'
import { FoundationService } from '../foundation/foundation.service'
import { MarketService } from '../market/market.service'
import { toMarketProfileContract, toRegionalConfigOverrideContract } from '../market/market.contract'
import { toStorePortalContract, toTobPortalContract } from './portal.contract'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TenantConfigService } from '../tenant-config/tenant-config.service'

const PORTAL_SUPPORTED_LANGUAGES = Object.values(LanguageCode)

@Injectable()
export class PortalService {
  constructor(
    private readonly marketService: MarketService,
    private readonly foundationService: FoundationService,
    @Optional() private readonly tenantConfigService?: TenantConfigService
  ) {}

  resolveTenantPortal(context: RequestTenantContext): TobPortal {
    const marketProfile = this.getEffectiveMarketProfile(context)
    return {
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Tenant,
      scopeCode: context.tenantId,
      tenantCode: context.tenantId,
      marketCode: marketProfile.marketCode,
      channel: PortalChannel.Web,
      name: `${context.tenantId} ToB 官网`,
      primaryDomain: `${context.tenantId}.${marketProfile.marketCode}.b2b.local`,
      supportedLanguages: marketProfile.locale.supportedLanguages,
      heroTitle: `${context.tenantId} 企业级经营门户`,
      heroSubtitle: '覆盖品牌、门店、会员、营销、赛事、财务与全球化配置的统一 SaaS 官网。',
      solutionTags: ['多租户', '多端门户', '国际化配置', '门店运营'],
      loginEntry: {
        label: '进入租户后台',
        loginPath: `/${marketProfile.marketCode}/${context.tenantId}/login`,
        ssoEnabled: true
      }
    }
  }

  resolveBrandPortal(context: RequestTenantContext): TobPortal {
    const brandCode = context.brandId ?? 'brand-demo'
    const marketProfile = this.getEffectiveMarketProfile(context)
    return {
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Brand,
      scopeCode: brandCode,
      tenantCode: context.tenantId,
      brandCode,
      marketCode: marketProfile.marketCode,
      channel: PortalChannel.Web,
      name: `${brandCode} 品牌 ToB 官网`,
      primaryDomain: `${brandCode}.${context.tenantId}.${marketProfile.marketCode}.b2b.local`,
      supportedLanguages: marketProfile.locale.supportedLanguages,
      heroTitle: `${brandCode} 品牌经营官网`,
      heroSubtitle: '面向品牌招商、加盟合作、渠道拓展、品牌能力展示和后台登录入口。',
      solutionTags: ['品牌招商', '品牌后台', '国际品牌站', '邮件与社媒触点'],
      loginEntry: {
        label: '进入品牌后台',
        loginPath: `/${marketProfile.marketCode}/${context.tenantId}/${brandCode}/login`,
        ssoEnabled: true
      }
    }
  }

  resolveStorePortal(context: RequestTenantContext): StorePortal {
    const brandCode = context.brandId ?? 'brand-demo'
    const storeCode = context.storeId ?? 'store-001'
    const marketProfile = this.getEffectiveMarketProfile(context)

    return {
      audience: PortalAudience.ToC,
      scopeType: PortalScopeType.Store,
      scopeCode: storeCode,
      tenantCode: context.tenantId,
      brandCode,
      storeCode,
      storeName: `${storeCode} 门店`,
      marketCode: marketProfile.marketCode,
      channel: PortalChannel.Web,
      name: `${storeCode} 门店门户`,
      primaryDomain: `${storeCode}.${brandCode}.${context.tenantId}.${marketProfile.marketCode}.local`,
      supportedLanguages: marketProfile.locale.supportedLanguages,
      supportedSurfaces: [
        StorefrontSurface.OfficialSite,
        StorefrontSurface.H5,
        StorefrontSurface.MiniApp,
        StorefrontSurface.App,
        StorefrontSurface.PcConsole,
        StorefrontSurface.PadConsole
      ]
    }
  }

  getBootstrap(context: RequestTenantContext): PortalBootstrapResponse {
    const foundationDependency = this.foundationService.getDependencySummary('portal')
    const marketProfile = this.getEffectiveMarketProfile(context)
    const tenantPortal = this.resolveTenantPortal(context)
    const brandPortal = this.resolveBrandPortal(context)
    const storePortal = this.resolveStorePortal(context)

    return {
      tenantPortal: toTobPortalContract(tenantPortal),
      brandPortal: toTobPortalContract(brandPortal),
      storePortal: toStorePortalContract(storePortal),
      marketProfile: toMarketProfileContract(marketProfile),
      regionalOverrides: this.marketService.getOverrides(context).map(toRegionalConfigOverrideContract),
      ...toBootstrapFoundationMetadata(foundationDependency)
    }
  }

  private getEffectiveMarketProfile(context: RequestTenantContext) {
    const marketProfile = this.marketService.getMergedProfile(context)
    const resolvedLocale = this.tenantConfigService?.resolveLocalePolicyForContext(context, {
      defaultLanguage: marketProfile.locale.defaultLanguage,
      supportedLanguages: marketProfile.locale.supportedLanguages,
    }) ?? marketProfile.locale
    const normalizedSupportedLanguages = [
      ...new Set([
        ...resolvedLocale.supportedLanguages,
        ...marketProfile.locale.supportedLanguages,
      ]),
    ].filter((locale): locale is LanguageCode =>
      PORTAL_SUPPORTED_LANGUAGES.includes(locale as LanguageCode),
    )
    const normalizedDefaultLanguage = PORTAL_SUPPORTED_LANGUAGES.includes(
      resolvedLocale.defaultLanguage as LanguageCode,
    )
      ? (resolvedLocale.defaultLanguage as LanguageCode)
      : marketProfile.locale.defaultLanguage

    if (!normalizedSupportedLanguages.includes(normalizedDefaultLanguage)) {
      normalizedSupportedLanguages.unshift(normalizedDefaultLanguage)
    }

    return {
      ...marketProfile,
      locale: {
        defaultLanguage: normalizedDefaultLanguage as typeof marketProfile.locale.defaultLanguage,
        supportedLanguages: normalizedSupportedLanguages as typeof marketProfile.locale.supportedLanguages,
      },
    }
  }
}
