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
 * SSO 实体 ─────────────────────
 *   SsoProtocol             saml | oidc
 *   SsoConnectionStatus     active | disabled | pending_verification
 *   SamlConfig              SAML 配置
 *   OidcConfig              OIDC 配置
 *   SsoConnection           SSO 连接记录
 *   UserSsoIdentity         用户 SSO 身份映射
 *   ParsedSamlAssertion     SAML 断言解析结果
 *
 * 域名实体 ─────────────────────
 *   DomainScopeType         TENANT | BRAND | STORE
 *   DomainStatus            域名状态
 *   SslProvider             letsencrypt | custom
 *   DomainMapping           域名映射
 *
 * DTO 类型 ─────────────────────
 *   AddDomainRequest / ValidateDomainRequest / ValidateDomainResponse
 *   DomainVerifyHint / DomainSslInfo / DomainListItem
 *   DomainListResponse / DomainDetailResponse
 *   ResolveHostRequest / ResolveHostResponse
 *   RecommendPrimaryDomainRequest / RecommendPrimaryDomainResponse
 *
 * 工具函数 ─────────────────────
 *   generateConnectionId / generateIdentityId / generateSamlRequestId
 *   generateOidcState / generatePkceVerifier / deriveCodeChallenge
 *   extractEmailDomain / validateSamlConfig / validateOidcConfig
 *   buildSamlAuthnRequest / buildOidcAuthUrl / buildSamlLogoutRequest
 *   parseSamlAssertion
 *   generateVerificationToken / buildVerificationHost
 *   buildVerificationValue / isValidDomain / computeSslFingerprint
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
export type {
  SsoProtocol,
  SsoConnectionStatus,
  SamlConfig,
  OidcConfig,
  SsoConnection,
  UserSsoIdentity,
  ParsedSamlAssertion,
} from './sso.entity'
export {
  generateConnectionId,
  generateIdentityId,
  generateSamlRequestId,
  generateOidcState,
  generatePkceVerifier,
  deriveCodeChallenge,
  extractEmailDomain,
  validateSamlConfig,
  validateOidcConfig,
  buildSamlAuthnRequest,
  buildOidcAuthUrl,
  buildSamlLogoutRequest,
  parseSamlAssertion,
} from './sso.entity'

// ─── 自定义域名实体 ─────────────────────────────────────────────────────────
export type { DomainScopeType, DomainStatus, SslProvider, DomainMapping } from './custom-domain.entity'
export {
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  isValidDomain,
  computeSslFingerprint,
} from './custom-domain.entity'

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

// ─── SaaS 常量 ───────────────────────────────────────────────────────────────
export const DEFAULT_SSL_PROVIDER = 'letsencrypt'
export const DOMAIN_VERIFICATION_TTL_SECONDS = 300
export const MAX_CUSTOM_DOMAINS_PER_TENANT = 10
export const DNS_PROPAGATION_WAIT_MS = 60_000 // 1 min
export const SSO_SESSION_DURATION_HOURS = 24
