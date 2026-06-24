import {
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  LanguageCode,
  type BasePortal,
  type StorePortal,
  type TobPortal
} from '@m5/domain'

/**
 * 门户登录入口配置
 */
export interface PortalLoginEntry {
  /** 登录按钮文案 */
  label: string
  /** 登录路径 */
  loginPath: string
  /** 是否启用 SSO */
  ssoEnabled: boolean
}

/**
 * 基础门户实体 (与 domain BasePortal 对齐)
 * 用于持久化或跨层传递的门户核心信息
 */
export interface PortalEntity {
  /** 门户唯一标识 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 品牌 ID (品牌门户/门店门户) */
  brandId?: string
  /** 门店 ID (门店门户) */
  storeId?: string
  /** 门户受众: ToC / ToB */
  audience: PortalAudience
  /** 门户作用域类型: Tenant / Brand / Store */
  scopeType: PortalScopeType
  /** 作用域编码 */
  scopeCode: string
  /** 市场编码 */
  marketCode: string
  /** 渠道 */
  channel: PortalChannel
  /** 门户名称 */
  name: string
  /** 主域名 */
  primaryDomain?: string
  /** 支持的语言列表 */
  supportedLanguages: LanguageCode[]
  /** 主营标题 (ToB) */
  heroTitle?: string
  /** 副标题 (ToB) */
  heroSubtitle?: string
  /** 解决方案标签 (ToB) */
  solutionTags?: string[]
  /** 登录入口 */
  loginEntry?: PortalLoginEntry
  /** 支持的终端表面 (Store) */
  supportedSurfaces?: StorefrontSurface[]
  /** 门店名称 (Store) */
  storeName?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 从 BasePortal + 上下文构造 PortalEntity
 */
export function toPortalEntity(
  portal: BasePortal | StorePortal | TobPortal,
  overrides: {
    id: string
    tenantId: string
    brandId?: string
    storeId?: string
  }
): PortalEntity {
  const base: PortalEntity = {
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
  }

  if (portal.audience === PortalAudience.ToB) {
    const tobPortal = portal as TobPortal
    base.heroTitle = tobPortal.heroTitle
    base.heroSubtitle = tobPortal.heroSubtitle
    base.solutionTags = tobPortal.solutionTags
    base.loginEntry = tobPortal.loginEntry
  }

  if (portal.audience === PortalAudience.ToC) {
    const storePortal = portal as StorePortal
    base.supportedSurfaces = storePortal.supportedSurfaces
    base.storeName = storePortal.storeName
  }

  return base
}

/**
 * 判断是否是 ToB 门户
 */
export function isTobPortalEntity(entity: PortalEntity): boolean {
  return entity.audience === PortalAudience.ToB
}

/**
 * 判断是否是 Store 门户
 */
export function isStorePortalEntity(entity: PortalEntity): boolean {
  return entity.audience === PortalAudience.ToC
}

/**
 * 判断门户是否启用 SSO
 */
export function isSsoEnabled(entity: PortalEntity): boolean {
  return entity.loginEntry?.ssoEnabled ?? false
}
