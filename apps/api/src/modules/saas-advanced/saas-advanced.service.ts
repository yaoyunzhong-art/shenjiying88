/**
 * saas-advanced.service.ts — SaaS Advanced Service (canonical name)
 *
 * SaaS 高级功能模块入口 (自定义域名 + SSO)。
 * 统一导出多租户 SaaS 高级功能的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   CustomDomainService     自定义域名管理服务
 *   SsoService              SSO 单点登录服务
 *   DomainResolutionService 域名解析服务
 *
 * 实体类型 ─────────────────────
 *   SsoConfig               SSO 配置
 *   SsoProvider             SSO 提供商
 *   SsoConnection           SSO 连接记录
 *   CustomDomainConfig      域名配置
 *   CustomDomainEntity      域名实体
 *   DomainVerification      域名验证记录
 *   DomainDnsRecord         DNS 记录
 *
 * DTO 类型 ─────────────────────
 *   AddDomainRequest        添加域名请求
 *   ValidateDomainRequest   验证域名请求
 *   DomainVerifyHint        域名验证提示
 *   DomainSslInfo           SSL 信息
 *   DomainListItem          域名列表项
 *   DomainListResponse      域名列表响应
 *   ResolveHostRequest      解析主机请求
 *   ResolveHostResponse     解析主机响应
 *   RecommendPrimaryDomainRequest 推荐主域名请求
 *   RecommendPrimaryDomainResponse 推荐主域名响应
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { CustomDomainService, SsoService } from './saas-advanced.service'
 *   const domainSvc = app.get(CustomDomainService)
 *   const ssoSvc = app.get(SsoService)
 *   await domainSvc.addDomain(tenantId, { domain })
 *   await ssoSvc.initiateSso(tenantId, provider)
 *
 * @module SaasAdvanced
 */

export { CustomDomainService } from './custom-domain.service'
export { SsoService } from './sso.service'
export { DomainResolutionService } from './domain-resolution.service'

// ─── SSO 实体 ───────────────────────────────────────────────────────────────
export type { SsoConfig, SsoProvider, SsoConnection } from './sso.entity'

// ─── 自定义域名实体 ─────────────────────────────────────────────────────────
export type { CustomDomainConfig, CustomDomainEntity, DomainVerification, DomainDnsRecord } from './custom-domain.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export {
  AddDomainRequest,
  ValidateDomainRequest,
  ValidateDomainResponse,
  DomainVerifyHint,
  DomainSslInfo,
  DomainListItem,
  DomainListResponse,
  DomainDetailResponse,
  ResolveHostRequest,
  ResolveHostResponse,
  CurrentPrimaryDomainQueryRequest,
  CurrentPrimaryDomainResponse,
  BatchCurrentPrimaryDomainQueryItem,
  BatchCurrentPrimaryDomainRequest,
  BatchCurrentPrimaryDomainResponse,
  ActiveWithoutPrimaryScopeItem,
  ActiveWithoutPrimaryGovernanceResponse,
  ActiveWithoutPrimaryGovernanceQueryRequest,
  RecommendPrimaryDomainRequest,
  RecommendPrimaryDomainResponse,
} from './custom-domain.dto'
