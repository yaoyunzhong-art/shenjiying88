/**
 * Phase 96 自定义域名 DTO (V10 Sprint 2 Day 22)
 *
 * 定义请求/响应数据结构
 */

/**
 * 添加域名请求
 */
export interface AddDomainRequest {
  domain: string
}

/**
 * 域名格式校验请求
 */
export interface ValidateDomainRequest {
  domain: string
}

/**
 * 域名格式校验响应
 */
export interface ValidateDomainResponse {
  valid: boolean
  error?: string
}

/**
 * 域名详情提示
 */
export interface DomainVerifyHint {
  host: string
  value: string
  type: 'TXT'
  instructions: string
}

/**
 * 域名列表单项
 */
export interface DomainListItem {
  id: string
  tenantId: string
  domain: string
  status: string
  verificationFailCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

/**
 * 域名列表响应
 */
export interface DomainListResponse {
  items: DomainListItem[]
  total: number
}

/**
 * 域名详情响应
 */
export interface DomainDetailResponse extends DomainListItem {
  ssl?: {
    provider: string
    expiresAt: string
    fingerprint: string
    lastRenewedAt: string
  }
  lastVerifiedAt?: string
  hint: DomainVerifyHint
}

/**
 * Host 解析请求
 */
export interface ResolveHostRequest {
  host: string
}

/**
 * Host 解析响应
 */
export interface ResolveHostResponse {
  host: string
  tenantId: string | null
  resolved: boolean
}
