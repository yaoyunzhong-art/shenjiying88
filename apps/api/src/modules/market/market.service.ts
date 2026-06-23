import { Injectable } from '@nestjs/common'
import {
  ConfigInheritanceMode,
  CountryCode,
  CurrencyCode,
  EmailProvider,
  LanguageCode,
  NetworkRegion,
  PortalScopeType,
  SocialPlatform,
  TaxMode,
  type MarketProfile,
  type RegionalConfigOverride
} from '@m5/domain'
import type { MarketBootstrapResponse } from '@m5/types'
import { toBootstrapFoundationMetadata } from '../bootstrap/bootstrap.contract'
import { FoundationService } from '../foundation/foundation.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { toMarketProfileContract } from './market.contract'

@Injectable()
export class MarketService {
  constructor(private readonly foundationService: FoundationService) {}

  private readonly marketProfiles: MarketProfile[] = [
    {
      marketCode: 'cn-mainland',
      marketName: '中国大陆',
      countryCode: CountryCode.China,
      locale: {
        defaultLanguage: LanguageCode.ZhCn,
        supportedLanguages: [LanguageCode.ZhCn]
      },
      timezone: {
        timezone: 'Asia/Shanghai'
      },
      currency: {
        currencyCode: CurrencyCode.Cny,
        symbol: '¥'
      },
      tax: {
        taxMode: TaxMode.Included,
        taxRate: 6,
        taxLabel: '增值税'
      },
      network: {
        networkRegion: NetworkRegion.MainlandChina,
        apiBaseUrl: 'https://cn-api.m5.local',
        cdnBaseUrl: 'https://cn-cdn.m5.local',
        callbackBaseUrl: 'https://cn-hooks.m5.local'
      },
      email: {
        provider: EmailProvider.AliyunDm,
        fromName: 'M5 China',
        fromAddress: 'hello-cn@m5.local',
        replyTo: 'support-cn@m5.local'
      },
      social: {
        primaryPlatforms: [SocialPlatform.Wechat, SocialPlatform.Xiaohongshu],
        supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Weibo, SocialPlatform.Douyin]
      }
    },
    {
      marketCode: 'us-default',
      marketName: 'United States',
      countryCode: CountryCode.UnitedStates,
      locale: {
        defaultLanguage: LanguageCode.EnUs,
        supportedLanguages: [LanguageCode.EnUs]
      },
      timezone: {
        timezone: 'America/New_York'
      },
      currency: {
        currencyCode: CurrencyCode.Usd,
        symbol: '$'
      },
      tax: {
        taxMode: TaxMode.Excluded,
        taxRate: 8.25,
        taxLabel: 'Sales Tax'
      },
      network: {
        networkRegion: NetworkRegion.NorthAmerica,
        apiBaseUrl: 'https://us-api.m5.local',
        cdnBaseUrl: 'https://us-cdn.m5.local',
        callbackBaseUrl: 'https://us-hooks.m5.local'
      },
      email: {
        provider: EmailProvider.SendGrid,
        fromName: 'M5 US',
        fromAddress: 'hello-us@m5.local',
        replyTo: 'support-us@m5.local'
      },
      social: {
        primaryPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.Instagram],
        supportPlatforms: [SocialPlatform.LinkedIn, SocialPlatform.Instagram, SocialPlatform.Facebook, SocialPlatform.X]
      }
    }
  ]

  getBootstrap(): MarketBootstrapResponse {
    const foundationDependency = this.foundationService.getDependencySummary('market')

    return {
      defaultDomesticMarketCode: 'cn-mainland',
      defaultInternationalMarketCode: 'us-default',
      supportedMarkets: this.marketProfiles.map(toMarketProfileContract),
      ...toBootstrapFoundationMetadata(foundationDependency)
    }
  }

  getByMarketCode(marketCode?: string): MarketProfile {
    const matched = this.marketProfiles.find((market) => market.marketCode === marketCode)
    const defaultInternational = this.marketProfiles.find((market) => market.marketCode === 'us-default')
    const fallback = this.marketProfiles[0]

    if (matched) {
      return matched
    }

    if (defaultInternational) {
      return defaultInternational
    }

    if (fallback) {
      return fallback
    }

    throw new Error('No market profiles configured')
  }

  getOverrides(context: RequestTenantContext): RegionalConfigOverride[] {
    const marketCode = context.marketCode ?? 'us-default'

    return [
      {
        scopeType: PortalScopeType.Tenant,
        scopeCode: context.tenantId,
        inheritanceMode: ConfigInheritanceMode.TenantDefault,
        marketCode,
        email: {
          fromName: `${context.tenantId} HQ`
        }
      },
      {
        scopeType: PortalScopeType.Brand,
        scopeCode: context.brandId ?? 'brand-demo',
        inheritanceMode: ConfigInheritanceMode.BrandOverride,
        marketCode,
        social: {
          primaryPlatforms:
            marketCode === 'cn-mainland'
              ? [SocialPlatform.Wechat, SocialPlatform.Douyin]
              : [SocialPlatform.LinkedIn, SocialPlatform.Instagram]
        }
      },
      {
        scopeType: PortalScopeType.Store,
        scopeCode: context.storeId ?? 'store-001',
        inheritanceMode: ConfigInheritanceMode.StoreOverride,
        marketCode,
        timezone: {
          timezone: marketCode === 'cn-mainland' ? 'Asia/Shanghai' : 'America/Los_Angeles'
        }
      }
    ]
  }

  getMergedProfile(context: RequestTenantContext): MarketProfile {
    const baseProfile = this.getByMarketCode(context.marketCode)
    const overrides = this.getOverrides(context)

    return overrides.reduce<MarketProfile>((acc, override) => {
      return {
        ...acc,
        locale: { ...acc.locale, ...(override.locale ?? {}) },
        timezone: { ...acc.timezone, ...(override.timezone ?? {}) },
        currency: { ...acc.currency, ...(override.currency ?? {}) },
        tax: { ...acc.tax, ...(override.tax ?? {}) },
        network: { ...acc.network, ...(override.network ?? {}) },
        email: { ...acc.email, ...(override.email ?? {}) },
        social: { ...acc.social, ...(override.social ?? {}) }
      }
    }, baseProfile)
  }
}
