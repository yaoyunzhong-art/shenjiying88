import type { StorePortal, TobPortal } from '@m5/domain'
import type { StorePortalContract, TobPortalContract } from '@m5/types'

export function toTobPortalContract(portal: TobPortal): TobPortalContract {
  const primaryDomain = portal.primaryDomain ?? `${portal.scopeCode}.${portal.marketCode}.b2b.local`

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
  }
}

export function toStorePortalContract(portal: StorePortal): StorePortalContract {
  const primaryDomain = portal.primaryDomain ?? `${portal.storeCode}.${portal.marketCode}.local`

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
  }
}

