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
  ForbiddenException,
  Optional,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { requireTenantContext, type TenantContext } from '../../common/context/tenant-context'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type {
  ActiveWithoutPrimaryGovernanceQueryRequest,
  ActiveWithoutPrimaryScopeItem,
  BatchRecommendPrimaryDomainResponse,
  BatchCurrentPrimaryDomainQueryItem,
  CurrentPrimaryDomainQueryRequest,
  DomainGovernanceScopeSummaryItem,
  DomainGovernanceSummaryResponse,
  DomainListQueryRequest,
  RecommendPrimaryDomainRequest,
  RecommendPrimaryByQueryRequest,
  RecommendPrimaryDomainResponse,
} from './custom-domain.dto'
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
    this.assertRequestedScopeAccess(query.scopeType, ctx)
    const page = Math.max(query.page ?? 1, 1)
    const pageSize = Math.max(query.pageSize ?? 10, 1)
    const sortBy = (query.sortBy ?? 'createdAt') as DomainSortField
    const sortOrder = (query.sortOrder ?? 'desc') as DomainSortOrder
    const offset = (page - 1) * pageSize

    const items = await this.listAccessibleMappings(ctx)

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
      const mapping = this.rowToMapping(row)
      this.assertMappingAccess(mapping, ctx)
      return mapping
    }
    const m = this.domains.get(id)
    if (!m || m.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${id} not found`)
    }
    this.assertMappingAccess(m, ctx)
    return m
  }

  async getCurrentPrimary(query: CurrentPrimaryDomainQueryRequest = {}): Promise<DomainMapping | null> {
    const scope = this.resolveScopeSelection(query)

    if (this.canUsePersistence()) {
      const rows = await this.customDomains().findMany({
        where: {
          ...this.buildScopeWhere(scope),
          status: { in: ['ACTIVE', 'ACTIVE_SSL'] },
        },
        orderBy: { createdAt: 'desc' },
      })
      return rows.map((row) => this.rowToMapping(row)).find((item) => item.isPrimary) ?? null
    }

    return (
      this.listScopeMappings(scope).find(
        (mapping) =>
          mapping.isPrimary === true &&
          (mapping.status === 'active' || mapping.status === 'active_ssl'),
      ) ?? null
    )
  }

  async getCurrentPrimaryBatch(
    items: BatchCurrentPrimaryDomainQueryItem[] = [],
  ): Promise<Array<{
    scopeType: string
    tenantId: string
    brandId?: string
    storeId?: string
    resolved: boolean
    item: DomainMapping | null
  }>> {
    return Promise.all(items.map((query) => this.buildCurrentPrimaryResponse(query)))
  }

  async listActiveWithoutPrimary(
    query: ActiveWithoutPrimaryGovernanceQueryRequest = {},
  ): Promise<{
    items: ActiveWithoutPrimaryScopeItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    sortBy: GovernanceSortField
    sortOrder: GovernanceSortOrder
  }> {
    return this.collectGovernanceItems(query)
  }

  async recommendPrimary(
    query: RecommendPrimaryDomainRequest,
  ): Promise<RecommendPrimaryDomainResponse> {
    const scope = this.resolveScopeSelection(query)
    const current = await this.getCurrentPrimary(query)
    if (current) {
      return {
        scopeType: scope.scopeType,
        tenantId: scope.tenantId,
        brandId: scope.brandId,
        storeId: scope.storeId,
        applied: false,
        dryRun: query.dryRun === true,
        resolved: true,
        candidateCount: 0,
        recommendationReason: '当前作用域已存在主域名，无需补选',
        item: current,
      }
    }

    const candidates = await this.pickRecommendationCandidates(scope)
    const recommendation = this.selectRecommendation(candidates)
    if (!recommendation.item) {
      return {
        scopeType: scope.scopeType,
        tenantId: scope.tenantId,
        brandId: scope.brandId,
        storeId: scope.storeId,
        applied: false,
        dryRun: query.dryRun === true,
        resolved: false,
        candidateCount: 0,
        recommendationReason: '当前作用域没有可用于补选的 active 域名',
        item: null,
      }
    }

    if (query.dryRun === true) {
      return {
        scopeType: scope.scopeType,
        tenantId: scope.tenantId,
        brandId: scope.brandId,
        storeId: scope.storeId,
        applied: false,
        dryRun: true,
        resolved: true,
        candidateCount: candidates.length,
        recommendationReason: recommendation.reason,
        item: recommendation.item,
      }
    }

    const applied = await this.setPrimary(recommendation.item.id)
    return {
      scopeType: scope.scopeType,
      tenantId: scope.tenantId,
      brandId: scope.brandId,
      storeId: scope.storeId,
      applied: true,
      dryRun: false,
      resolved: true,
      candidateCount: candidates.length,
      recommendationReason: recommendation.reason,
      item: applied,
    }
  }

  async recommendPrimaryBatch(
    items: RecommendPrimaryDomainRequest[] = [],
  ): Promise<BatchRecommendPrimaryDomainResponse> {
    const results = await Promise.all(items.map((item) => this.safeRecommendPrimary(item)))
    return this.summarizeRecommendBatch(results)
  }

  async recommendPrimaryByQuery(
    query: RecommendPrimaryByQueryRequest,
  ): Promise<BatchRecommendPrimaryDomainResponse> {
    const governance = await this.collectGovernanceItems(query)
    const targetItems = query.applyAllMatched === true ? governance.allItems : governance.items
    const requests = targetItems.map<RecommendPrimaryDomainRequest>((item) => ({
      scopeType: item.scopeType as DomainScopeType,
      brandId: item.brandId,
      storeId: item.storeId,
      dryRun: query.dryRun,
    }))
    const results = await Promise.all(requests.map((item) => this.safeRecommendPrimary(item)))
    return this.summarizeRecommendBatch(results, governance.total)
  }

  async getGovernanceSummary(): Promise<DomainGovernanceSummaryResponse> {
    return this.buildGovernanceSummary(requireTenantContext())
  }

  async getGovernanceSummaryForRequest(
    context: RequestTenantContext,
  ): Promise<DomainGovernanceSummaryResponse> {
    return this.buildGovernanceSummary({
      tenantId: context.tenantId,
      brandId: context.brandId,
      storeId: context.storeId,
    })
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
    this.domainResolution?.removeHost(m.domain)
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

  private resolveScopeSelection(
    query: CurrentPrimaryDomainQueryRequest,
  ): Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'> {
    const ctx = requireTenantContext()
    const scopeType = (query.scopeType as DomainScopeType | undefined) ?? inferScopeType(ctx)
    const brandId = query.brandId ?? ctx.brandId
    const storeId = query.storeId ?? ctx.storeId

    if (scopeType === 'BRAND' && !brandId) {
      throw new BadRequestException('brandId is required for BRAND scope current primary lookup')
    }
    if (scopeType === 'STORE' && (!brandId || !storeId)) {
      throw new BadRequestException('brandId and storeId are required for STORE scope current primary lookup')
    }
    const scope = {
      scopeType,
      tenantId: ctx.tenantId,
      brandId,
      storeId,
    }
    this.assertScopeSelectionAccess(scope, ctx)
    return scope
  }

  private async buildCurrentPrimaryResponse(
    query: CurrentPrimaryDomainQueryRequest,
  ): Promise<{
    scopeType: string
    tenantId: string
    brandId?: string
    storeId?: string
    resolved: boolean
    item: DomainMapping | null
  }> {
    const scope = this.resolveScopeSelection(query)
    const item = await this.getCurrentPrimary(query)
    return {
      scopeType: scope.scopeType,
      tenantId: scope.tenantId,
      brandId: scope.brandId,
      storeId: scope.storeId,
      resolved: item != null,
      item,
    }
  }

  private selectRecommendation(candidates: DomainMapping[]): {
    item: DomainMapping | null
    reason?: string
  } {
    const item = candidates[0] ?? null
    if (!item) {
      return { item: null }
    }

    return {
      item,
      reason: this.buildRecommendationReason(item, candidates.length),
    }
  }

  private async safeRecommendPrimary(
    query: RecommendPrimaryDomainRequest,
  ): Promise<RecommendPrimaryDomainResponse> {
    try {
      return await this.recommendPrimary(query)
    } catch (error: any) {
      return this.buildFailedRecommendation(query, error)
    }
  }

  private async pickRecommendationCandidates(
    scope: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>,
  ): Promise<DomainMapping[]> {
    return (await this.loadScopeMappings(scope))
      .filter((mapping) => this.isActiveMapping(mapping))
      .sort((left, right) => this.compareRecommendationPriority(left, right))
  }

  private async listAccessibleMappings(ctx = requireTenantContext()): Promise<DomainMapping[]> {
    return this.applyRoleVisibility(await this.listTenantMappings(ctx), ctx)
  }

  private async listTenantMappings(ctx: TenantContext): Promise<DomainMapping[]> {
    if (this.canUsePersistence()) {
      const rows = await this.customDomains().findMany({
        where: { tenantId: ctx.tenantId },
        orderBy: { createdAt: 'desc' },
      })
      return rows.map((row: PersistedCustomDomainRow) => this.rowToMapping(row))
    }

    const ids = this.domainsByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.domains.get(id)!)
      .filter((d) => d != null)
  }

  private applyRoleVisibility(items: DomainMapping[], ctx: TenantContext): DomainMapping[] {
    if (ctx.role === 'brand_admin') {
      return items.filter(
        (item) => item.scopeType === 'BRAND' && (item.brandId ?? null) === (ctx.brandId ?? null),
      )
    }

    if (ctx.role === 'store_admin') {
      return items.filter(
        (item) =>
          item.scopeType === 'STORE' &&
          (item.brandId ?? null) === (ctx.brandId ?? null) &&
          (item.storeId ?? null) === (ctx.storeId ?? null),
      )
    }

    return items
  }

  private assertRequestedScopeAccess(
    scopeType: DomainScopeType | undefined,
    ctx: TenantContext,
  ): void {
    if (!scopeType) return

    if (ctx.role === 'brand_admin' && scopeType !== 'BRAND') {
      throw new ForbiddenException('brand_admin can only query BRAND scope domains')
    }

    if (ctx.role === 'store_admin' && scopeType !== 'STORE') {
      throw new ForbiddenException('store_admin can only query STORE scope domains')
    }
  }

  private assertScopeSelectionAccess(
    scope: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>,
    ctx: TenantContext,
  ): void {
    this.assertRequestedScopeAccess(scope.scopeType, ctx)

    if (ctx.role === 'brand_admin' && scope.brandId !== ctx.brandId) {
      throw new ForbiddenException('brand_admin can only access the current brand scope')
    }

    if (
      ctx.role === 'store_admin' &&
      (scope.brandId !== ctx.brandId || scope.storeId !== ctx.storeId)
    ) {
      throw new ForbiddenException('store_admin can only access the current store scope')
    }
  }

  private assertMappingAccess(mapping: DomainMapping, ctx: TenantContext): void {
    if (mapping.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${mapping.id} not found`)
    }

    this.assertScopeSelectionAccess(
      {
        scopeType: mapping.scopeType,
        tenantId: mapping.tenantId,
        brandId: mapping.brandId,
        storeId: mapping.storeId,
      },
      ctx,
    )
  }

  private isActiveMapping(mapping: DomainMapping): boolean {
    return mapping.status === 'active' || mapping.status === 'active_ssl'
  }

  private matchesGovernanceFilter(
    item: Pick<ActiveWithoutPrimaryScopeItem, 'scopeType' | 'brandId' | 'storeId'>,
    query: ActiveWithoutPrimaryGovernanceQueryRequest,
  ): boolean {
    if (query.scopeType && item.scopeType !== query.scopeType) {
      return false
    }
    if (query.brandId && (item.brandId ?? null) !== query.brandId) {
      return false
    }
    if (query.storeId && (item.storeId ?? null) !== query.storeId) {
      return false
    }
    return true
  }

  private assertGovernanceQueryAccess(query: ActiveWithoutPrimaryGovernanceQueryRequest): void {
    const ctx = requireTenantContext()
    this.assertGovernanceQueryAccessForContext(query, ctx)
  }

  private assertGovernanceQueryAccessForContext(
    query: ActiveWithoutPrimaryGovernanceQueryRequest,
    ctx: TenantContext,
  ): void {
    this.assertRequestedScopeAccess(query.scopeType as DomainScopeType | undefined, ctx)

    if (ctx.role === 'brand_admin' && query.brandId && query.brandId !== ctx.brandId) {
      throw new ForbiddenException('brand_admin can only access the current brand scope')
    }

    if (
      ctx.role === 'store_admin' &&
      ((query.brandId && query.brandId !== ctx.brandId) || (query.storeId && query.storeId !== ctx.storeId))
    ) {
      throw new ForbiddenException('store_admin can only access the current store scope')
    }
  }

  private compareRecommendationPriority(left: DomainMapping, right: DomainMapping): number {
    const score = (mapping: DomainMapping) => (mapping.status === 'active_ssl' ? 2 : 1)
    const scoreDiff = score(right) - score(left)
    if (scoreDiff !== 0) {
      return scoreDiff
    }

    const updatedDiff = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    if (updatedDiff !== 0) {
      return updatedDiff
    }

    const createdDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    if (createdDiff !== 0) {
      return createdDiff
    }

    return left.domain.localeCompare(right.domain)
  }

  private buildRecommendationReason(item: DomainMapping, candidateCount: number): string {
    const parts = [
      item.status === 'active_ssl' ? '优先推荐 active_ssl' : '当前 scope 无 active_ssl，回退到 active',
    ]
    if (candidateCount > 1) {
      parts.push('同 scope 候选按最近更新时间排序')
    }
    return parts.join('，')
  }

  private summarizeRecommendBatch(
    items: RecommendPrimaryDomainResponse[],
    matchedTotal = items.length,
  ): BatchRecommendPrimaryDomainResponse {
    return {
      total: items.length,
      matchedTotal,
      appliedCount: items.filter((item) => item.applied).length,
      skippedCount: items.filter((item) => !item.applied && !item.failureReason).length,
      failedCount: items.filter((item) => item.failureReason != null).length,
      resolvedCount: items.filter((item) => item.resolved).length,
      items,
    }
  }

  private buildFailedRecommendation(
    query: RecommendPrimaryDomainRequest,
    error: unknown,
  ): RecommendPrimaryDomainResponse {
    const ctx = requireTenantContext()
    const scopeType = query.scopeType ?? inferScopeType(ctx)
    return {
      scopeType,
      tenantId: ctx.tenantId,
      brandId: query.brandId ?? ctx.brandId,
      storeId: query.storeId ?? ctx.storeId,
      applied: false,
      dryRun: query.dryRun === true,
      resolved: false,
      candidateCount: 0,
      recommendationReason: '执行失败，未完成主域名补选',
      failureReason: error instanceof Error ? error.message : String(error),
      item: null,
    }
  }

  private buildScopeKey(mapping: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>): string {
    return [mapping.scopeType, mapping.tenantId, mapping.brandId ?? '', mapping.storeId ?? ''].join(':')
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

  private async loadScopeMappings(
    current: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>,
  ): Promise<DomainMapping[]> {
    if (this.canUsePersistence()) {
      const rows = await this.customDomains().findMany({
        where: this.buildScopeWhere(current),
        orderBy: { createdAt: 'desc' },
      })
      return rows.map((row) => this.rowToMapping(row))
    }

    return this.listScopeMappings(current)
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

  private sortGovernanceItems(
    items: ActiveWithoutPrimaryScopeItem[],
    sortBy: GovernanceSortField,
    sortOrder: GovernanceSortOrder,
  ): ActiveWithoutPrimaryScopeItem[] {
    const direction = sortOrder === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      const left = this.readGovernanceSortValue(a, sortBy)
      const right = this.readGovernanceSortValue(b, sortBy)
      const compared = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
      return compared * direction
    })
  }

  private readGovernanceSortValue(
    item: ActiveWithoutPrimaryScopeItem,
    sortBy: GovernanceSortField,
  ): string {
    switch (sortBy) {
      case 'scopeType':
        return item.scopeType
      case 'recommendedDomain':
        return item.recommendedItem?.domain ?? ''
      case 'latestUpdatedAt':
        return item.latestUpdatedAt
      case 'activeCount':
      default:
        return String(item.activeCount).padStart(6, '0')
    }
  }

  private async collectGovernanceItems(
    query: ActiveWithoutPrimaryGovernanceQueryRequest = {},
    ctx: TenantContext = requireTenantContext(),
  ): Promise<{
    allItems: ActiveWithoutPrimaryScopeItem[]
    items: ActiveWithoutPrimaryScopeItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    sortBy: GovernanceSortField
    sortOrder: GovernanceSortOrder
  }> {
    this.assertGovernanceQueryAccessForContext(query, ctx)
    const activeMappings = (await this.listAccessibleMappings(ctx)).filter((mapping) =>
      this.isActiveMapping(mapping),
    )
    const page = Math.max(query.page ?? 1, 1)
    const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), 100)
    const sortBy = query.sortBy ?? 'activeCount'
    const sortOrder = query.sortOrder ?? 'desc'
    const grouped = new Map<string, DomainMapping[]>()

    for (const mapping of activeMappings) {
      const key = this.buildScopeKey(mapping)
      const group = grouped.get(key) ?? []
      group.push(mapping)
      grouped.set(key, group)
    }

    const allItems = this.sortGovernanceItems(
      Array.from(grouped.values())
        .filter((group) => !group.some((mapping) => mapping.isPrimary === true))
        .map((group) => this.buildGovernanceScopeItem(group))
        .filter((item) => this.matchesGovernanceFilter(item, query)),
      sortBy,
      sortOrder,
    )

    const total = allItems.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const items = allItems.slice(start, start + pageSize)

    return {
      allItems,
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: totalPages > 0 && page < totalPages,
      hasPreviousPage: page > 1 && total > 0,
      sortBy,
      sortOrder,
    }
  }

  private buildGovernanceScopeItem(group: DomainMapping[]): ActiveWithoutPrimaryScopeItem {
    const [first] = group
    const candidates = this.sortMappings(group, 'createdAt', 'desc')
    const recommendation = this.selectRecommendation(candidates)
    return {
      scopeType: first.scopeType,
      tenantId: first.tenantId,
      brandId: first.brandId,
      storeId: first.storeId,
      activeCount: group.length,
      latestUpdatedAt:
        candidates.map((item) => item.updatedAt).sort((left, right) => right.localeCompare(left))[0] ??
        first.updatedAt,
      recommendedItem: recommendation.item,
      recommendationReason: recommendation.reason,
      candidateDomains: candidates,
    }
  }

  private async buildGovernanceSummary(ctx: TenantContext): Promise<DomainGovernanceSummaryResponse> {
    const governance = await this.collectGovernanceItems({}, ctx)
    const currentScopes = await Promise.all(
      [
        { scopeType: 'TENANT' as const, tenantId: ctx.tenantId },
        ctx.brandId
          ? { scopeType: 'BRAND' as const, tenantId: ctx.tenantId, brandId: ctx.brandId }
          : null,
        ctx.brandId && ctx.storeId
          ? {
              scopeType: 'STORE' as const,
              tenantId: ctx.tenantId,
              brandId: ctx.brandId,
              storeId: ctx.storeId,
            }
          : null,
      ]
        .filter((item): item is { scopeType: DomainScopeType; tenantId: string; brandId?: string; storeId?: string } => item != null)
        .map((scope) => this.buildGovernanceScopeSummaryItem(scope)),
    )

    return {
      totalMissingPrimaryScopes: governance.total,
      totalActiveWithoutPrimaryDomains: governance.allItems.reduce((sum, item) => sum + item.activeCount, 0),
      recommendedReadyScopes: governance.allItems.filter((item) => item.recommendedItem != null).length,
      tenantMissingPrimaryScopes: governance.allItems.filter((item) => item.scopeType === 'TENANT').length,
      brandMissingPrimaryScopes: governance.allItems.filter((item) => item.scopeType === 'BRAND').length,
      storeMissingPrimaryScopes: governance.allItems.filter((item) => item.scopeType === 'STORE').length,
      requiresAttention: governance.total > 0,
      lastEvaluatedAt: new Date().toISOString(),
      currentScopes,
    }
  }

  private async buildGovernanceScopeSummaryItem(
    scope: Pick<DomainMapping, 'scopeType' | 'tenantId' | 'brandId' | 'storeId'>,
  ): Promise<DomainGovernanceScopeSummaryItem> {
    const mappings = await this.loadScopeMappings(scope)
    const activeMappings = mappings.filter((item) => this.isActiveMapping(item))
    const currentPrimary = activeMappings.find((item) => item.isPrimary === true) ?? null
    const recommendation = currentPrimary ? { item: null, reason: undefined } : this.selectRecommendation(activeMappings.sort((left, right) => this.compareRecommendationPriority(left, right)))

    return {
      scopeType: scope.scopeType,
      tenantId: scope.tenantId,
      brandId: scope.brandId,
      storeId: scope.storeId,
      activeDomainCount: activeMappings.length,
      missingPrimary: activeMappings.length > 0 && currentPrimary == null,
      currentPrimaryDomain: currentPrimary?.domain ?? null,
      recommendedDomain: recommendation.item?.domain ?? null,
      recommendationReason: recommendation.reason,
    }
  }
}

type DomainSortField = 'createdAt' | 'updatedAt' | 'domain' | 'status'
type DomainSortOrder = 'asc' | 'desc'
type GovernanceSortField = 'activeCount' | 'scopeType' | 'recommendedDomain' | 'latestUpdatedAt'
type GovernanceSortOrder = 'asc' | 'desc'

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
      status?: string
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
