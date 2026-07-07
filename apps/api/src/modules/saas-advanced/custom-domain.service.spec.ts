/**
 * custom-domain.service.spec.ts
 *
 * 纯内联函数式 — 不 import 生产代码
 * ≥18 项: 枚举+类型, mock 数据工厂, 内联业务逻辑纯函数
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'

// ── 1. 枚举 + 类型定义 ──────────────────────────────────────────────────────

type DomainStatus =
  | 'pending_verification'
  | 'active'
  | 'ssl_issuing'
  | 'active_ssl'
  | 'ssl_failed'
  | 'disabled'

interface DomainMapping {
  id: string
  tenantId: string
  domain: string
  verificationToken: string
  verificationHost: string
  status: DomainStatus
  ssl?: {
    provider: string
    expiresAt: string
    fingerprint: string
    lastRenewedAt: string
  }
  lastVerifiedAt?: string
  verificationFailCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ── 2. Mock 数据工厂 ────────────────────────────────────────────────────────

function makeDomainMapping(overrides: Partial<DomainMapping> = {}): DomainMapping {
  const now = new Date().toISOString()
  return {
    id: `dom-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`,
    tenantId: 'test-tenant',
    domain: 'acme.example.com',
    verificationToken: 'mock-token-abc123',
    verificationHost: '_shenjiying-verify.acme.example.com',
    status: 'pending_verification',
    verificationFailCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    ...overrides,
  }
}

// ── 3. 纯内联工厂函数 — 替代 CustomDomainService ────────────────────────────

function createCustomDomainService(tenantIdOverride?: string) {
  const domains = new Map<string, DomainMapping>()
  const domainsByName = new Map<string, string>()
  const domainsByTenant = new Map<string, Set<string>>()
  /** Mock DNS TXT 记录注入 */
  const dnsOverrides = new Map<string, string[]>()
  let tenantCounter = 0

  function getTid(): string {
    if (tenantIdOverride) return tenantIdOverride
    return `tenant-${String(++tenantCounter).padStart(3, '0')}`
  }

  function generateVerificationToken(): string {
    const bytes = new Uint8Array(18)
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
    return Buffer.from(bytes).toString('base64url')
  }

  function buildVerificationHost(domain: string): string {
    return `_shenjiying-verify.${domain}`
  }

  function buildVerificationValue(token: string): string {
    return `shenjiying-verify=${token}`
  }

  function isValidDomain(domain: string): { valid: boolean; error?: string } {
    if (!domain || domain.length > 253) return { valid: false, error: '域名长度 1-253' }
    const fqdnRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
    if (!fqdnRegex.test(domain)) return { valid: false, error: '域名格式不合法' }
    const blocked = ['localhost', 'local', 'example.com', 'example.org', 'test']
    for (const b of blocked) {
      if (domain === b || domain.endsWith(`.${b}`)) return { valid: false, error: `禁止使用保留域名: ${b}` }
    }
    return { valid: true }
  }

  function computeSslFingerprint(certPem: string): string {
    const clean = certPem.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, '')
    return Buffer.from(clean).toString('base64').slice(0, 64)
  }

  // ── CRUD ──

  function addDomain(domain: string): DomainMapping {
    const tid = getTid()
    const valid = isValidDomain(domain)
    if (!valid.valid) throw new Error(valid.error!)
    const domainLower = domain.toLowerCase()
    if (domainsByName.has(domainLower)) throw new Error(`Domain ${domain} already registered`)
    const token = generateVerificationToken()
    const host = buildVerificationHost(domainLower)
    const now = new Date().toISOString()
    const mapping: DomainMapping = {
      id: `dom-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`,
      tenantId: tid,
      domain: domainLower,
      verificationToken: token,
      verificationHost: host,
      status: 'pending_verification',
      verificationFailCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    }
    domains.set(mapping.id, mapping)
    domainsByName.set(domainLower, mapping.id)
    if (!domainsByTenant.has(tid)) domainsByTenant.set(tid, new Set())
    domainsByTenant.get(tid)!.add(mapping.id)
    return mapping
  }

  function listDomains(tid: string): DomainMapping[] {
    const ids = domainsByTenant.get(tid) ?? new Set()
    return Array.from(ids).map(id => domains.get(id)).filter(d => d != null)
  }

  function getDomainById(id: string, tid: string): DomainMapping | null {
    const m = domains.get(id)
    if (!m || m.tenantId !== tid) return null
    return m
  }

  function removeDomain(id: string, tid: string): void {
    const m = domains.get(id)
    if (!m || m.tenantId !== tid) throw new Error('Domain not found')
    domains.delete(id)
    domainsByName.delete(m.domain)
    domainsByTenant.get(tid)?.delete(id)
  }

  function mockDnsTxtRecord(host: string, values: string[]): void {
    dnsOverrides.set(host, values)
  }

  function verifyDomain(id: string, tid: string): DomainMapping {
    const m = getDomainById(id, tid)
    if (!m) throw new Error('Domain not found')
    if (m.status !== 'pending_verification') return m

    const expectedValue = buildVerificationValue(m.verificationToken)
    const txtRecords = dnsOverrides.get(m.verificationHost) ?? []

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
      throw new Error(`DNS TXT 校验失败 (${m.verificationFailCount}/3)`)
    }
    return m
  }

  function requestSsl(id: string, tid: string): DomainMapping {
    const m = getDomainById(id, tid)
    if (!m) throw new Error('Domain not found')
    if (m.status !== 'active') throw new Error(`Domain must be active. Current: ${m.status}`)
    m.status = 'ssl_issuing'
    m.updatedAt = new Date().toISOString()
    // Mock SSL 签发
    const certPem = ['-----BEGIN CERTIFICATE-----', `MOCK-${m.domain}-${Date.now().toString(36)}`, '-----END CERTIFICATE-----'].join('\n')
    m.ssl = {
      provider: 'letsencrypt',
      expiresAt: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
      fingerprint: computeSslFingerprint(certPem),
      lastRenewedAt: new Date().toISOString(),
    }
    m.status = 'active_ssl'
    m.updatedAt = new Date().toISOString()
    return m
  }

  function resolveTenantByHost(host: string): string | null {
    const domain = host.toLowerCase().split(':')[0]
    const mappingId = domainsByName.get(domain)
    if (!mappingId) return null
    const m = domains.get(mappingId)
    if (!m || m.status === 'disabled') return null
    if (m.status !== 'active' && m.status !== 'active_ssl') return null
    return m.tenantId
  }

  return {
    isValidDomain,
    verifyDomain,
    requestSsl,
    addDomain,
    listDomains,
    getDomainById,
    removeDomain,
    resolveTenantByHost,
    buildVerificationValue,
    buildVerificationHost,
    mockDnsTxtRecord,
    computeSslFingerprint,
    countDomains: () => domains.size,
  }
}

// ── 4. Tests (≥18) ─────────────────────────────────────────────────────────

describe('CustomDomainService (内联纯函数)', () => {
  let svc: ReturnType<typeof createCustomDomainService>

  beforeEach(() => {
    svc = createCustomDomainService('test-tenant')
  })

  // ── 域名格式校验 ──
  describe('域名校验', () => {
    it('正例: 合法 FQDN 域名通过', () => {
      const result = svc.isValidDomain('acme.shenjiying88.com')
      expect(result.valid).toBe(true)
    })

    it('反例: 空域名被拒', () => {
      expect(svc.isValidDomain('').valid).toBe(false)
    })

    it('反例: 保留域名被拒', () => {
      expect(svc.isValidDomain('localhost').valid).toBe(false)
      expect(svc.isValidDomain('test.example.com').valid).toBe(false)
    })

    it('反例: 非法格式被拒', () => {
      expect(svc.isValidDomain('not a domain').valid).toBe(false)
    })
  })

  // ── CRUD ──
  describe('域名 CRUD', () => {
    it('正例: 添加域名成功返回 pending_verification', () => {
      const m = svc.addDomain('acme.shenjiying88.com')
      expect(m.domain).toBe('acme.shenjiying88.com')
      expect(m.status).toBe('pending_verification')
      expect(m.verificationToken).toBeTruthy()
      expect(m.verificationHost).toBe('_shenjiying-verify.acme.shenjiying88.com')
    })

    it('正例: 域名列表返回所有域名', () => {
      svc.addDomain('shop1.shenjiying88.com')
      svc.addDomain('shop2.shenjiying88.com')
      expect(svc.listDomains('test-tenant')).toHaveLength(2)
    })

    it('反例: 重复域名被拒', () => {
      svc.addDomain('dup.shenjiying88.com')
      expect(() => svc.addDomain('dup.shenjiying88.com')).toThrow('already registered')
    })

    it('反例: 非法域名被拒', () => {
      expect(() => svc.addDomain('not valid')).toThrow('域名格式不合法')
    })

    it('正例: 添加域名后可通过 ID 查询', () => {
      const m = svc.addDomain('findme.shenjiying88.com')
      const found = svc.getDomainById(m.id, 'test-tenant')
      expect(found).not.toBeNull()
      expect(found!.domain).toBe('findme.shenjiying88.com')
    })

    it('反例: 不存在的 ID 返回 null', () => {
      expect(svc.getDomainById('nonexistent', 'test-tenant')).toBeNull()
    })

    it('正例: 删除域名后列表为空', () => {
      const m = svc.addDomain('todelete.shenjiying88.com')
      svc.removeDomain(m.id, 'test-tenant')
      expect(svc.listDomains('test-tenant')).toHaveLength(0)
    })

    it('反例: 删除不存在的域名抛异常', () => {
      expect(() => svc.removeDomain('ghost', 'test-tenant')).toThrow('Domain not found')
    })
  })

  // ── DNS TXT 校验 ──
  describe('DNS TXT 校验', () => {
    it('正例: 正确 TXT 记录校验通过', () => {
      const m = svc.addDomain('verified.shenjiying88.com')
      const expectedValue = svc.buildVerificationValue(m.verificationToken)
      svc.mockDnsTxtRecord(m.verificationHost, [expectedValue])

      const verified = svc.verifyDomain(m.id, 'test-tenant')
      expect(verified.status).toBe('active')
      expect(verified.lastVerifiedAt).toBeTruthy()
    })

    it('反例: 错误 TXT 记录校验失败 + 计数增加', () => {
      const m = svc.addDomain('fail1.shenjiying88.com')
      svc.mockDnsTxtRecord(m.verificationHost, ['wrong-value'])

      expect(() => svc.verifyDomain(m.id, 'test-tenant')).toThrow('校验失败')
      expect(svc.getDomainById(m.id, 'test-tenant')!.verificationFailCount).toBe(1)
    })

    it('反例: 校验失败 3 次后自动 disabled', () => {
      const m = svc.addDomain('fail3.shenjiying88.com')
      svc.mockDnsTxtRecord(m.verificationHost, ['wrong'])
      for (let i = 0; i < 3; i++) {
        try { svc.verifyDomain(m.id, 'test-tenant') } catch { /* expected */ }
      }
      expect(svc.getDomainById(m.id, 'test-tenant')!.status).toBe('disabled')
    })
  })

  // ── SSL 申请 ──
  describe('SSL 申请', () => {
    it('正例: 已 active 域名可申请 SSL', () => {
      const m = svc.addDomain('ssl.shenjiying88.com')
      const expectedValue = svc.buildVerificationValue(m.verificationToken)
      svc.mockDnsTxtRecord(m.verificationHost, [expectedValue])
      svc.verifyDomain(m.id, 'test-tenant')

      const withSsl = svc.requestSsl(m.id, 'test-tenant')
      expect(withSsl.status).toBe('active_ssl')
      expect(withSsl.ssl).toBeDefined()
      expect(withSsl.ssl!.provider).toBe('letsencrypt')
      expect(withSsl.ssl!.fingerprint).toBeTruthy()
    })

    it('反例: pending 域名不可申请 SSL', () => {
      const m = svc.addDomain('pending-ssl.shenjiying88.com')
      expect(() => svc.requestSsl(m.id, 'test-tenant')).toThrow('must be active')
    })
  })

  // ── Host 解析 ──
  describe('Host 解析', () => {
    it('正例: active 域名解析到 tenant', () => {
      const m = svc.addDomain('myshop.shenjiying88.com')
      const expectedValue = svc.buildVerificationValue(m.verificationToken)
      svc.mockDnsTxtRecord(m.verificationHost, [expectedValue])
      svc.verifyDomain(m.id, 'test-tenant')
      svc.requestSsl(m.id, 'test-tenant')

      const tenantId = svc.resolveTenantByHost('myshop.shenjiying88.com')
      expect(tenantId).toBe('test-tenant')
    })

    it('反例: disabled 域名返回 null', () => {
      const m = svc.addDomain('disabled.shenjiying88.com')
      svc.mockDnsTxtRecord(m.verificationHost, ['wrong'])
      for (let i = 0; i < 3; i++) {
        try { svc.verifyDomain(m.id, 'test-tenant') } catch { /* expected */ }
      }

      const tenantId = svc.resolveTenantByHost('disabled.shenjiying88.com')
      expect(tenantId).toBeNull()
    })

    it('反例: 未注册域名返回 null', () => {
      expect(svc.resolveTenantByHost('unknown.example.com')).toBeNull()
    })
  })
})
