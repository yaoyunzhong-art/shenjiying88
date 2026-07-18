/**
 * Phase 96 高级 SaaS - 自定义域名 Service (V10 Sprint 2 Day 22)
 *
 * 核心能力:
 * 1. CRUD custom domain
 * 2. DNS TXT 校验 (mock DNS 查询)
 * 3. SSL 证书申请 (mock Let's Encrypt)
 * 4. Host → tenantId 解析
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import { PrismaService } from '../../prisma/prisma.service'
import type { DomainListQueryRequest } from './custom-domain.dto'
import {
  DomainMapping,
  DomainScopeType,
  DomainStatus,
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  isValidDomain,
  computeSslFingerprint,
} from './custom-domain.entity'
import { DomainResolutionService } from './domain-resolution.service'

/**
 * DNS 查询接口 (可注入 - 测试用 mock)
 */
export interface DnsResolver {
  /** 查询 TXT 记录 */
  queryTxt(host: string): Promise<string[]>
}

/**
 * 默认 DNS Resolver (使用 Node.js dns/promises)
 */
class DefaultDnsResolver implements DnsResolver {
  async queryTxt(host: string): Promise<string[]> {
    try {
      const dns = await import('node:dns/promises')
      const records = await dns.resolveTxt(host)
      return records.map((chunks) => chunks.join(''))
    } catch {
      return []
    }
  }
}

/**
 * SSL Provider 接口 (可注入 - 测试用 mock)
 */
export interface SslProvider {
  issue(domain: string): Promise<{
    certPem: string
    expiresAt: string
    fingerprint: string
  }>
}

/**
 * Mock SSL Provider (开发环境)
 */
class MockSslProvider implements SslProvider {
  async issue(domain: string) {
    // 模拟 Let's Encrypt 签发延迟
    await new Promise((r) => setTimeout(r, 100))
    const certPem = [
      '-----BEGIN CERTIFICATE-----',
      `MOCK-${domain}-${Date.now().toString(36)}`,
      '-----END CERTIFICATE-----',
    ].join('\n')
    return {
      certPem,
      expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(), // 90 天
      fingerprint: computeSslFingerprint(certPem),
    }
  }
}

@Injectable()
export class CustomDomainService {
  private readonly domains = new Map<string, DomainMapping>()
  /** domain → mappingId */
  private readonly domainsByName = new Map<string, string>()
  /** tenantId → Set<mappingId> */
  private readonly domainsByTenant = new Map<string, Set<string>>()

  private dnsResolver: DnsResolver = new DefaultDnsResolver()
  private sslProvider: SslProvider = new MockSslProvider()
  /** 注入 DNS TXT 记录 (测试用) */
  private dnsOverrides = new Map<string, string[]>()

  constructor(
    @Optional() private readonly prisma?: PrismaService,
    @Optional() private readonly domainResolution?: DomainResolutionService,
  ) {}

  // ============ 注入 (测试用) ============
  setDnsResolver(r: DnsResolver): void {
    this.dnsResolver = r
  }
  setSslProvider(s: SslProvider): void {
    this.sslProvider = s
  }
  /** 注入 mock TXT 记录: domain → value[] */
  setDnsTxtOverride(host: string, values: string[]): void {
    this.dnsOverrides.set(host, values)
  }

  // ============ 1. CRUD ============

  async addDomain(domain: string): Promise<DomainMapping> {
    const ctx = requireTenantContext()
    const normalizedDomain = normalizeDomain(domain)
    const valid = isValidDomain(normalizedDomain)
    if (!valid.valid) {
      throw new BadRequestException(valid.error)
    }

    const token = generateVerificationToken()
    const host = buildVerificationHost(normalizedDomain)

    if (this.canUsePersistence()) {
      const existing = await this.customDomains().findUnique({
        where: { domain: normalizedDomain },
      })
      if (existing) {
        throw new BadRequestException(`Domain ${domain} already registered`)
      }

      const row = await this.customDomains().create({
        data: {
          domain: normalizedDomain,
          scopeType: inferScopeType(ctx),
          tenantId: ctx.tenantId,
          brandId: ctx.brandId,
          storeId: ctx.storeId,
          verificationHost: host,
          verificationToken: token,
          createdBy: ctx.userId ?? 'system',
        },
      })
      return this.rowToMapping(row)
    }

    // 防止重复 (全平台唯一)
    if (this.domainsByName.has(normalizedDomain)) {
      throw new BadRequestException(`Domain ${domain} already registered`)
    }

    const mapping: DomainMapping = {
      id: `dom-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`,
      scopeType: inferScopeType(ctx),
      tenantId: ctx.tenantId,
      brandId: ctx.brandId,
      storeId: ctx.storeId,
      domain: normalizedDomain,
      verificationToken: token,
      verificationHost: host,
      status: 'pending_verification',
      verificationFailCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: ctx.userId ?? 'system',
    }
    this.domains.set(mapping.id, mapping)
    this.domainsByName.set(mapping.domain, mapping.id)
    if (!this.domainsByTenant.has(ctx.tenantId)) {
      this.domainsByTenant.set(ctx.tenantId, new Set())
    }
    this.domainsByTenant.get(ctx.tenantId)!.add(mapping.id)
    return mapping
  }

  async list(query: DomainListQueryRequest = {} as DomainListQueryRequest): Promise<DomainMapping[]> {
    return (await this.listPage(query)).items
  }

  async listPage(query: DomainListQueryRequest = {} as DomainListQueryRequest): Promise<{
    items: DomainMapping[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    sortBy: DomainSortField
    sortOrder: DomainSortOrder
  }> {
    const ctx = requireTenantContext()
    const page = Math.max(query.page ?? 1, 1)
    const pageSize = Math.max(query.pageSize ?? 10, 1)
    const sortBy = (query.sortBy ?? 'createdAt') as DomainSortField
    const sortOrder = (query.sortOrder ?? 'desc') as DomainSortOrder
    const offset = (page - 1) * pageSize

    let items: DomainMapping[]
    if (this.canUsePersistence()) {
      const rows = await this.customDomains().findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
      })
      items = rows.map((row: PersistedCustomDomainRow) => this.rowToMapping(row))
    } else {
      const ids = this.domainsByTenant.get(ctx.tenantId) ?? new Set()
      items = Array.from(ids)
        .map((id) => this.domains.get(id)!)
        .filter((d) => d != null)
    }

    const filtered = this.applyListQuery(items, query)
    const sorted = this.sortMappings(filtered, sortBy, sortOrder)
    const total = sorted.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)

    return {
      items: sorted.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
      sortBy,
      sortOrder,
    }
  }

  async getById(id: string): Promise<DomainMapping> {
    const ctx = requireTenantContext()
    if (this.canUsePersistence()) {
      const row = await this.customDomains().findFirst({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
      })
      if (!row) {
        throw new NotFoundException(`Domain ${id} not found`)
      }
      return this.rowToMapping(row)
    }
    const m = this.domains.get(id)
    if (!m || m.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${id} not found`)
    }
    return m
  }

  async remove(id: string): Promise<void> {
    const ctx = requireTenantContext()
    if (this.canUsePersistence()) {
      const row = await this.customDomains().findFirst({
        where: {
          id,
          tenantId: ctx.tenantId,
        },
      })
      if (!row) {
        throw new NotFoundException(`Domain ${id} not found`)
      }
      await this.customDomains().delete({
        where: { id },
      })
      this.domainResolution?.removeHost(row.domain)
      return
    }

    const m = this.domains.get(id)
    if (!m || m.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${id} not found`)
    }
    this.domains.delete(id)
    this.domainsByName.delete(m.domain)
    this.domainsByTenant.get(ctx.tenantId)?.delete(id)
  }

  async setPrimary(id: string): Promise<DomainMapping> {
    const current = await this.getById(id)
    if (current.status !== 'active' && current.status !== 'active_ssl') {
      throw new BadRequestException(
        `Domain must be active before primary switch. Current: ${current.status}`,
      )
    }

    if (this.canUsePersistence()) {
      await this.customDomains().updateMany({
        where: this.buildScopeWhere(current),
        data: { isPrimary: false },
      })
      const updated = this.rowToMapping(
        await this.customDomains().update({
          where: { id: current.id },
          data: { isPrimary: true },
        }),
      )
      const scopedRows = await this.customDomains().findMany({
        where: this.buildScopeWhere(current),
        orderBy: { createdAt: 'desc' },
      })
      for (const row of scopedRows) {
        this.domainResolution?.upsertFromMapping(this.rowToMapping(row))
      }
      return updated
    }

    const scopedMappings = this.listScopeMappings(current)
    for (const mapping of scopedMappings) {
      mapping.isPrimary = mapping.id === current.id
      this.domainResolution?.upsertFromMapping(mapping)
    }
    current.updatedAt = new Date().toISOString()
    return current
  }

  // ============ 2. DNS TXT 校验 ============

  async verify(id: string): Promise<DomainMapping> {
    const m = await this.getById(id)
    if (m.status !== 'pending_verification') {
      return m // 已校验过, 直接返回
    }

    const expectedValue = buildVerificationValue(m.verificationToken)

    // 优先用 mock override
    let txtRecords: string[]
    if (this.dnsOverrides.has(m.verificationHost)) {
      txtRecords = this.dnsOverrides.get(m.verificationHost)!
    } else {
      txtRecords = await this.dnsResolver.queryTxt(m.verificationHost)
    }

    if (txtRecords.includes(expectedValue)) {
      const verifiedAt = new Date()
      const updated = await this.persistStatusUpdate(m, {
        status: 'active',
        verificationFailCount: 0,
        verifiedAt,
        lastVerifiedAt: verifiedAt,
        lastCheckedAt: verifiedAt,
      })
      this.domainResolution?.upsertFromMapping(updated)
      return updated
    } else {
      const verificationFailCount = m.verificationFailCount + 1
      const updated = await this.persistStatusUpdate(m, {
        status: verificationFailCount >= 3 ? 'disabled' : 'pending_verification',
        verificationFailCount,
        lastCheckedAt: new Date(),
      })
      this.domainResolution?.upsertFromMapping(updated)
      throw new BadRequestException(
        `DNS TXT 校验失败 (${updated.verificationFailCount}/3). 期望 ${m.verificationHost} = ${expectedValue}`,
      )
    }
  }

  // ============ 3. SSL 申请 ============

  async requestSsl(id: string): Promise<DomainMapping> {
    const current = await this.getById(id)
    if (current.status !== 'active') {
      throw new BadRequestException(
        `Domain must be active before SSL request. Current: ${current.status}`,
      )
    }

    const issuing = await this.persistStatusUpdate(current, {
      status: 'ssl_issuing',
      lastCheckedAt: new Date(),
    })

    try {
      const cert = await this.sslProvider.issue(issuing.domain)
      const updated = await this.persistStatusUpdate(issuing, {
        status: 'active_ssl',
        certificateProvider: 'letsencrypt',
        certificateStatus: 'ACTIVE',
        certificateNotAfter: new Date(cert.expiresAt),
        certificateFingerprint: cert.fingerprint,
        lastCheckedAt: new Date(),
      })
      this.domainResolution?.upsertFromMapping(updated)
      return updated
    } catch (err: any) {
      await this.persistStatusUpdate(issuing, {
        status: 'ssl_failed',
        certificateStatus: 'FAILED',
        lastCheckedAt: new Date(),
      })
      throw err
    }
  }

  // ============ 4. Host → tenantId 解析 (CDN/网关用) ============

  resolveTenantByHost(host: string): string | null {
    return this.resolveContextByHost(host)?.tenantId ?? null
  }

  resolveContextByHost(host: string): Pick<DomainMapping, 'tenantId' | 'brandId' | 'storeId'> | null {
    const resolved = this.domainResolution?.resolveHost(host)
    if (resolved) {
      return {
        tenantId: resolved.tenantId,
        brandId: resolved.brandId,
        storeId: resolved.storeId,
      }
    }

    const domain = normalizeDomain(host)
    const mappingId = this.domainsByName.get(domain)
    if (!mappingId) return null
    const m = this.domains.get(mappingId)
    if (!m || m.status === 'disabled') return null
    if (m.status !== 'active' && m.status !== 'active_ssl') return null
    return {
      tenantId: m.tenantId,
      brandId: m.brandId,
      storeId: m.storeId,
    }
  }

  // ============ 测试用 ============
  countDomains(): number {
    return this.domains.size
  }

  private async persistStatusUpdate(
    mapping: DomainMapping,
    patch: {
      status: DomainStatus
      verificationFailCount?: number
      verifiedAt?: Date
      lastVerifiedAt?: Date
      lastCheckedAt?: Date
      certificateProvider?: string
      certificateStatus?: 'NOT_REQUESTED' | 'PENDING' | 'ACTIVE' | 'FAILED' | 'EXPIRED'
      certificateNotAfter?: Date
      certificateFingerprint?: string
    },
  ): Promise<DomainMapping> {
    if (this.canUsePersistence()) {
      const row = await this.customDomains().update({
        where: { id: mapping.id },
        data: {
          status: toDbStatus(patch.status),
          verificationFailCount: patch.verificationFailCount,
          verifiedAt: patch.verifiedAt,
          lastVerifiedAt: patch.lastVerifiedAt,
          lastCheckedAt: patch.lastCheckedAt,
          certificateProvider: patch.certificateProvider,
          certificateStatus: patch.certificateStatus,
          certificateNotAfter: patch.certificateNotAfter,
          certificateFingerprint: patch.certificateFingerprint,
        },
      })
      return this.rowToMapping(row)
    }

    mapping.status = patch.status
    mapping.verificationFailCount = patch.verificationFailCount ?? mapping.verificationFailCount
    mapping.lastVerifiedAt = patch.lastVerifiedAt?.toISOString() ?? mapping.lastVerifiedAt
    mapping.updatedAt = new Date().toISOString()
    if (patch.certificateProvider || patch.certificateNotAfter || patch.certificateFingerprint) {
      mapping.ssl = {
        provider: (patch.certificateProvider as 'letsencrypt' | 'custom') ?? 'letsencrypt',
        expiresAt: patch.certificateNotAfter?.toISOString() ?? mapping.ssl?.expiresAt ?? new Date().toISOString(),
        fingerprint: patch.certificateFingerprint ?? mapping.ssl?.fingerprint ?? '',
        lastRenewedAt: new Date().toISOString(),
      }
    } else if (patch.status === 'ssl_failed') {
      delete mapping.ssl
    }
    return mapping
  }

  private rowToMapping(row: PersistedCustomDomainRow): DomainMapping {
    return {
      id: row.id,
      scopeType: row.scopeType as DomainScopeType,
      tenantId: row.tenantId,
      brandId: row.brandId ?? undefined,
      storeId: row.storeId ?? undefined,
      portalSiteId: row.portalSiteId ?? undefined,
      isPrimary: row.isPrimary,
      domain: row.domain,
      verificationToken: row.verificationToken,
      verificationHost: row.verificationHost,
      status: fromDbStatus(row.status),
      ssl: row.certificateProvider && row.certificateNotAfter && row.certificateFingerprint
        ? {
            provider: row.certificateProvider === 'custom' ? 'custom' : 'letsencrypt',
            expiresAt: row.certificateNotAfter.toISOString(),
            fingerprint: row.certificateFingerprint,
            lastRenewedAt: row.updatedAt.toISOString(),
          }
        : undefined,
      lastVerifiedAt: row.lastVerifiedAt?.toISOString(),
      verificationFailCount: row.verificationFailCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: row.createdBy,
    }
  }

  private canUsePersistence(): boolean {
    return Boolean(this.prisma) && process.env.NODE_ENV !== 'test'
  }

  private customDomains(): CustomDomainDelegate {
    return (this.prisma as unknown as { customDomain: CustomDomainDelegate }).customDomain
  }

  private buildScopeWhere(mapping: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>): {
    tenantId: string
    scopeType?: DomainScopeType
    brandId?: string | null
    storeId?: string | null
    status?: { in: string[] }
  } {
    const where: {
      tenantId: string
      scopeType?: DomainScopeType
      brandId?: string | null
      storeId?: string | null
      status?: { in: string[] }
    } = {
      tenantId: mapping.tenantId,
      scopeType: mapping.scopeType,
    }

    if (mapping.scopeType === 'TENANT') {
      where.brandId = null
      where.storeId = null
      return where
    }

    if (mapping.scopeType === 'BRAND') {
      where.brandId = mapping.brandId ?? null
      where.storeId = null
      return where
    }

    where.brandId = mapping.brandId ?? null
    where.storeId = mapping.storeId ?? null
    return where
  }

  private listScopeMappings(
    current: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>,
  ): DomainMapping[] {
    return Array.from(this.domains.values()).filter((mapping) => {
      if (mapping.tenantId !== current.tenantId) return false
      if (mapping.scopeType !== current.scopeType) return false
      if ((mapping.brandId ?? null) !== (current.brandId ?? null)) return false
      if ((mapping.storeId ?? null) !== (current.storeId ?? null)) return false
      return true
    })
  }

  private applyListQuery(items: DomainMapping[], query: DomainListQueryRequest): DomainMapping[] {
    const keyword = query.keyword?.trim().toLowerCase()
    return items.filter((item) => {
      if (query.status && item.status !== query.status) {
        return false
      }
      if (query.scopeType && item.scopeType !== query.scopeType) {
        return false
      }
      if (keyword && !item.domain.toLowerCase().includes(keyword)) {
        return false
      }
      return true
    })
  }

  private sortMappings(
    items: DomainMapping[],
    sortBy: DomainSortField,
    sortOrder: DomainSortOrder,
  ): DomainMapping[] {
    const direction = sortOrder === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const left = this.readSortValue(a, sortBy)
      const right = this.readSortValue(b, sortBy)
      const compared = left.localeCompare(right)
      return compared * direction
    })
  }

  private readSortValue(item: DomainMapping, sortBy: DomainSortField): string {
    switch (sortBy) {
      case 'domain':
        return item.domain
      case 'status':
        return item.status
      case 'updatedAt':
        return item.updatedAt
      case 'createdAt':
      default:
        return item.createdAt
    }
  }
}

type DomainSortField = 'createdAt' | 'updatedAt' | 'domain' | 'status'
type DomainSortOrder = 'asc' | 'desc'

type PersistedCustomDomainRow = {
  id: string
  scopeType: string
  tenantId: string
  brandId: string | null
  storeId: string | null
  portalSiteId: string | null
  isPrimary: boolean
  domain: string
  verificationToken: string
  verificationHost: string
  status: string
  certificateProvider: string | null
  certificateNotAfter: Date | null
  certificateFingerprint: string | null
  lastVerifiedAt: Date | null
  verificationFailCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

type CustomDomainDelegate = {
  findUnique(args: { where: { domain: string } }): Promise<PersistedCustomDomainRow | null>
  create(args: {
    data: {
      domain: string
      scopeType: DomainScopeType
      tenantId: string
      brandId?: string
      storeId?: string
      verificationHost: string
      verificationToken: string
      createdBy: string
    }
  }): Promise<PersistedCustomDomainRow>
  findMany(args: {
    where?: {
      tenantId?: string
      scopeType?: DomainScopeType
      brandId?: string | null
      storeId?: string | null
      status?: { in: string[] }
    }
    orderBy?: { createdAt: 'desc' | 'asc' }
    select?: {
      domain?: true
      tenantId?: true
      brandId?: true
      storeId?: true
    }
  }): Promise<PersistedCustomDomainRow[]>
  findFirst(args: {
    where: {
      id: string
      tenantId: string
    }
  }): Promise<PersistedCustomDomainRow | null>
  delete(args: { where: { id: string } }): Promise<PersistedCustomDomainRow>
  update(args: {
    where: { id: string }
    data: {
      status: string
      isPrimary?: boolean
      verificationFailCount?: number
      verifiedAt?: Date
      lastVerifiedAt?: Date
      lastCheckedAt?: Date
      certificateProvider?: string
      certificateStatus?: 'NOT_REQUESTED' | 'PENDING' | 'ACTIVE' | 'FAILED' | 'EXPIRED'
      certificateNotAfter?: Date
      certificateFingerprint?: string
    }
  }): Promise<PersistedCustomDomainRow>
  updateMany(args: {
    where: {
      tenantId?: string
      scopeType?: DomainScopeType
      brandId?: string | null
      storeId?: string | null
    }
    data: {
      isPrimary: boolean
    }
  }): Promise<{ count: number }>
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim().split(',')[0].split(':')[0]
}

function inferScopeType(ctx: { brandId?: string; storeId?: string }): DomainScopeType {
  if (ctx.storeId) return 'STORE'
  if (ctx.brandId) return 'BRAND'
  return 'TENANT'
}

function toDbStatus(status: DomainStatus): PersistedCustomDomainRow['status'] {
  switch (status) {
    case 'pending_verification':
      return 'PENDING_VERIFICATION'
    case 'active':
      return 'ACTIVE'
    case 'ssl_issuing':
      return 'SSL_ISSUING'
    case 'active_ssl':
      return 'ACTIVE_SSL'
    case 'ssl_failed':
      return 'SSL_FAILED'
    case 'disabled':
      return 'DISABLED'
  }
}

function fromDbStatus(status: string): DomainStatus {
  switch (status) {
    case 'PENDING_VERIFICATION':
      return 'pending_verification'
    case 'ACTIVE':
      return 'active'
    case 'SSL_ISSUING':
      return 'ssl_issuing'
    case 'ACTIVE_SSL':
      return 'active_ssl'
    case 'SSL_FAILED':
      return 'ssl_failed'
    case 'DISABLED':
      return 'disabled'
    default:
      return 'pending_verification'
  }
}
