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
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  DomainMapping,
  DomainStatus,
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  isValidDomain,
  computeSslFingerprint,
} from './custom-domain.entity'

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
    const valid = isValidDomain(domain)
    if (!valid.valid) {
      throw new BadRequestException(valid.error)
    }
    // 防止重复 (全平台唯一)
    if (this.domainsByName.has(domain.toLowerCase())) {
      throw new BadRequestException(`Domain ${domain} already registered`)
    }

    const token = generateVerificationToken()
    const host = buildVerificationHost(domain)
    const mapping: DomainMapping = {
      id: `dom-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`,
      tenantId: ctx.tenantId,
      domain: domain.toLowerCase(),
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

  async list(): Promise<DomainMapping[]> {
    const ctx = requireTenantContext()
    const ids = this.domainsByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.domains.get(id)!)
      .filter((d) => d != null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async getById(id: string): Promise<DomainMapping> {
    const ctx = requireTenantContext()
    const m = this.domains.get(id)
    if (!m || m.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${id} not found`)
    }
    return m
  }

  async remove(id: string): Promise<void> {
    const ctx = requireTenantContext()
    const m = this.domains.get(id)
    if (!m || m.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`Domain ${id} not found`)
    }
    this.domains.delete(id)
    this.domainsByName.delete(m.domain)
    this.domainsByTenant.get(ctx.tenantId)?.delete(id)
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
      m.status = 'active'
      m.verificationFailCount = 0
      m.lastVerifiedAt = new Date().toISOString()
      m.updatedAt = m.lastVerifiedAt
    } else {
      m.verificationFailCount++
      if (m.verificationFailCount >= 3) {
        m.status = 'disabled'
      }
      m.updatedAt = new Date().toISOString()
      throw new BadRequestException(
        `DNS TXT 校验失败 (${m.verificationFailCount}/3). 期望 ${m.verificationHost} = ${expectedValue}`,
      )
    }
    return m
  }

  // ============ 3. SSL 申请 ============

  async requestSsl(id: string): Promise<DomainMapping> {
    const m = await this.getById(id)
    if (m.status !== 'active') {
      throw new BadRequestException(
        `Domain must be active before SSL request. Current: ${m.status}`,
      )
    }
    m.status = 'ssl_issuing'
    m.updatedAt = new Date().toISOString()

    try {
      const cert = await this.sslProvider.issue(m.domain)
      m.ssl = {
        provider: 'letsencrypt',
        expiresAt: cert.expiresAt,
        fingerprint: cert.fingerprint,
        lastRenewedAt: new Date().toISOString(),
      }
      m.status = 'active_ssl'
    } catch (err: any) {
      m.status = 'ssl_failed'
      throw err
    } finally {
      m.updatedAt = new Date().toISOString()
    }
    return m
  }

  // ============ 4. Host → tenantId 解析 (CDN/网关用) ============

  resolveTenantByHost(host: string): string | null {
    const domain = host.toLowerCase().split(':')[0]
    const mappingId = this.domainsByName.get(domain)
    if (!mappingId) return null
    const m = this.domains.get(mappingId)
    if (!m || m.status === 'disabled') return null
    if (m.status !== 'active' && m.status !== 'active_ssl') return null
    return m.tenantId
  }

  // ============ 测试用 ============
  countDomains(): number {
    return this.domains.size
  }
}
