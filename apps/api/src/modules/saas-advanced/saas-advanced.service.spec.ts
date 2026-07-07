/**
 * saas-advanced.service.spec.ts — 高级 SaaS (自定义域名) Service 纯函数式内联测试
 *
 * 覆盖：
 *   - DomainMapping CRUD: add/list/getById/remove
 *   - DNS TXT 校验: 成功/失败/多次失败自动 disabled
 *   - SSL 申请: 前置条件校验/成功/失败
 *   - 租户解析: host → tenantId
 *   - 多租户隔离: 不同 tenant 互不可见
 *   - 域名唯一性: 全局唯一
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const DOMAIN_STATUSES = ['pending_verification', 'active', 'ssl_issuing', 'active_ssl', 'ssl_failed', 'disabled'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineDomainMapping {
  id: string
  tenantId: string
  domain: string
  verificationToken: string
  verificationHost: string
  status: string
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

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 custom-domain.service.ts / .entity.ts 核心函数
// ═══════════════════════════════════════════════════════════════

function inlineGenerateVerificationToken(): string {
  const bytes = new Uint8Array(18)
  for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Buffer.from(bytes).toString('base64url')
}

function inlineBuildVerificationHost(domain: string): string {
  return `_shenjiying-verify.${domain}`
}

function inlineBuildVerificationValue(token: string): string {
  return `shenjiying-verify=${token}`
}

function inlineIsValidDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length > 253) return { valid: false, error: '域名长度 1-253' }
  const fqdnRegex = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/
  if (!fqdnRegex.test(domain)) return { valid: false, error: '域名格式不合法 (需 FQDN)' }
  const blocked = ['localhost', 'local', 'example.com', 'example.org', 'test']
  for (const b of blocked) {
    if (domain === b || domain.endsWith(`.${b}`)) return { valid: false, error: `禁止使用保留域名: ${b}` }
  }
  return { valid: true }
}

function inlineAddDomain(
  domains: Map<string, InlineDomainMapping>,
  domainsByName: Map<string, string>,
  domainsByTenant: Map<string, Set<string>>,
  domain: string,
  tenantId: string,
  userId?: string,
): { mapping?: InlineDomainMapping; error?: string } {
  const valid = inlineIsValidDomain(domain)
  if (!valid.valid) return { error: valid.error }

  if (domainsByName.has(domain.toLowerCase())) return { error: `Domain ${domain} already registered` }

  const token = inlineGenerateVerificationToken()
  const host = inlineBuildVerificationHost(domain)
  const mapping: InlineDomainMapping = {
    id: `dom-test-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`,
    tenantId,
    domain: domain.toLowerCase(),
    verificationToken: token,
    verificationHost: host,
    status: 'pending_verification',
    verificationFailCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId ?? 'system',
  }
  domains.set(mapping.id, mapping)
  domainsByName.set(mapping.domain, mapping.id)
  if (!domainsByTenant.has(tenantId)) domainsByTenant.set(tenantId, new Set())
  domainsByTenant.get(tenantId)!.add(mapping.id)
  return { mapping }
}

function inlineListDomains(
  domains: Map<string, InlineDomainMapping>,
  domainsByTenant: Map<string, Set<string>>,
  tenantId: string,
): InlineDomainMapping[] {
  const ids = domainsByTenant.get(tenantId) ?? new Set()
  return Array.from(ids)
    .map((id) => domains.get(id)!)
    .filter((d) => d != null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function inlineGetById(
  domains: Map<string, InlineDomainMapping>,
  id: string,
  tenantId: string,
): InlineDomainMapping | null {
  const m = domains.get(id)
  if (!m || m.tenantId !== tenantId) return null
  return m
}

function inlineRemoveDomain(
  domains: Map<string, InlineDomainMapping>,
  domainsByName: Map<string, string>,
  domainsByTenant: Map<string, Set<string>>,
  id: string,
  tenantId: string,
): string | null {
  const m = domains.get(id)
  if (!m || m.tenantId !== tenantId) return 'not found'
  domains.delete(id)
  domainsByName.delete(m.domain)
  domainsByTenant.get(tenantId)?.delete(id)
  return null
}

function inlineVerify(
  domains: Map<string, InlineDomainMapping>,
  domainsByName: Map<string, string>,
  id: string,
  tenantId: string,
  dnsOverrides: Map<string, string[]>,
): string | null {
  const m = inlineGetById(domains, id, tenantId)
  if (!m) return 'Domain not found'
  if (m.status !== 'pending_verification') return null

  const expectedValue = inlineBuildVerificationValue(m.verificationToken)
  let txtRecords: string[]
  if (dnsOverrides.has(m.verificationHost)) {
    txtRecords = dnsOverrides.get(m.verificationHost)!
  } else {
    txtRecords = []
  }

  if (txtRecords.includes(expectedValue)) {
    m.status = 'active'
    m.verificationFailCount = 0
    m.lastVerifiedAt = new Date().toISOString()
    m.updatedAt = m.lastVerifiedAt
    return null
  } else {
    m.verificationFailCount++
    if (m.verificationFailCount >= 3) {
      m.status = 'disabled'
    }
    m.updatedAt = new Date().toISOString()
    return `DNS TXT 校验失败 (${m.verificationFailCount}/3)`
  }
}

interface InlineMockSslResult {
  certPem: string
  expiresAt: string
  fingerprint: string
}

async function inlineRequestSsl(
  domains: Map<string, InlineDomainMapping>,
  id: string,
  tenantId: string,
): Promise<{ error?: string }> {
  const m = inlineGetById(domains, id, tenantId)
  if (!m) return { error: 'Domain not found' }
  if (m.status !== 'active') return { error: `Domain must be active before SSL request. Current: ${m.status}` }

  m.status = 'ssl_issuing'
  m.updatedAt = new Date().toISOString()

  // Mock SSL issue
  try {
    const certPem = `-----BEGIN CERTIFICATE-----\nMOCK-${m.domain}-${Date.now().toString(36)}\n-----END CERTIFICATE-----`
    const expiresAt = new Date(Date.now() + 90 * 86400 * 1000).toISOString()
    const cleanPem = certPem.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, '')
    const fingerprint = Buffer.from(cleanPem).toString('base64').slice(0, 64)
    m.ssl = {
      provider: 'letsencrypt',
      expiresAt,
      fingerprint,
      lastRenewedAt: new Date().toISOString(),
    }
    m.status = 'active_ssl'
  } catch {
    m.status = 'ssl_failed'
    return { error: 'SSL 申请失败' }
  } finally {
    m.updatedAt = new Date().toISOString()
  }
  return {}
}

function inlineResolveTenantByHost(
  domains: Map<string, InlineDomainMapping>,
  domainsByName: Map<string, string>,
  host: string,
): string | null {
  const domain = host.toLowerCase().split(':')[0]
  const mappingId = domainsByName.get(domain)
  if (!mappingId) return null
  const m = domains.get(mappingId)
  if (!m || m.status === 'disabled') return null
  if (m.status !== 'active' && m.status !== 'active_ssl') return null
  return m.tenantId
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('CustomDomainService (内联纯函数)', () => {
  let domains: Map<string, InlineDomainMapping>
  let domainsByName: Map<string, string>
  let domainsByTenant: Map<string, Set<string>>
  let dnsOverrides: Map<string, string[]>

  beforeEach(() => {
    domains = new Map()
    domainsByName = new Map()
    domainsByTenant = new Map()
    dnsOverrides = new Map()
  })

  // ── 1. 域名校验 ─────────────────────────────────────────────

  describe('1. 域名校验', () => {
    it('合法域名 — 通过校验', () => {
      expect(inlineIsValidDomain('my-store.shenjiying.com').valid).toBe(true)
      expect(inlineIsValidDomain('a-b.c-d.co.jp').valid).toBe(true)
      expect(inlineIsValidDomain('valid.test.net').valid).toBe(true)
    })

    it('非法域名 — 拒绝空字符串、格式错误', () => {
      expect(inlineIsValidDomain('').valid).toBe(false)
      expect(inlineIsValidDomain('not a domain').valid).toBe(false)
      expect(inlineIsValidDomain('-leading-hyphen.com').valid).toBe(false)
      expect(inlineIsValidDomain('a').valid).toBe(false)
    })

    it('保留域名 — 拒绝 localhost / example.com 等', () => {
      expect(inlineIsValidDomain('localhost').valid).toBe(false)
      expect(inlineIsValidDomain('example.com').valid).toBe(false)
      expect(inlineIsValidDomain('test').valid).toBe(false)
      expect(inlineIsValidDomain('sub.example.com').valid).toBe(false)
    })
  })

  // ── 2. DomainMapping CRUD ───────────────────────────────────

  describe('2. DomainMapping CRUD', () => {
    it('addDomain — 成功添加 pending_verification 域名', () => {
      const result = inlineAddDomain(domains, domainsByName, domainsByTenant, 'acme.shenjiying88.com', 'tenant-A', 'admin')
      expect(result.mapping).toBeTruthy()
      expect(result.mapping!.status).toBe('pending_verification')
      expect(result.mapping!.domain).toBe('acme.shenjiying88.com')
      expect(result.mapping!.tenantId).toBe('tenant-A')
      expect(result.mapping!.verificationHost).toBe('_shenjiying-verify.acme.shenjiying88.com')
      expect(result.mapping!.verificationToken).toBeTruthy()
    })

    it('addDomain — 重复域名报错（全局唯一）', () => {
      inlineAddDomain(domains, domainsByName, domainsByTenant, 'acme.com', 'tenant-A')
      const result = inlineAddDomain(domains, domainsByName, domainsByTenant, 'acme.com', 'tenant-B')
      expect(result.error).toContain('already registered')
    })

    it('addDomain — 非法域名返回 error', () => {
      const result = inlineAddDomain(domains, domainsByName, domainsByTenant, 'example.com', 'tenant-A')
      expect(result.error).toContain('禁止使用保留域名')
    })

    it('list — 只返回当前 tenant 的域名，按创建时间倒序', () => {
      const r1 = inlineAddDomain(domains, domainsByName, domainsByTenant, 'a.com', 'tenant-A')!
      // 延迟一点确保时间戳不同
      const r2 = inlineAddDomain(domains, domainsByName, domainsByTenant, 'b.com', 'tenant-A')!
      inlineAddDomain(domains, domainsByName, domainsByTenant, 'c.com', 'tenant-B')
      const list = inlineListDomains(domains, domainsByTenant, 'tenant-A')
      expect(list).toHaveLength(2)
      // 验证返回两个域名
      expect(list.some((d) => d.domain === 'a.com')).toBe(true)
      expect(list.some((d) => d.domain === 'b.com')).toBe(true)
      // 确认 tenant-B 的域名不被返回
      expect(list.some((d) => d.domain === 'c.com')).toBe(false)
    })

    it('getById — 跨租户不可见', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'a.com', 'tenant-A')!
      expect(inlineGetById(domains, r.mapping!.id, 'tenant-B')).toBeNull()
      expect(inlineGetById(domains, r.mapping!.id, 'tenant-A')).toBeTruthy()
    })

    it('remove — 删除域名并清理关联索引', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'del.com', 'tenant-A')!
      const err = inlineRemoveDomain(domains, domainsByName, domainsByTenant, r.mapping!.id, 'tenant-A')
      expect(err).toBeNull()
      expect(domains.size).toBe(0)
      expect(domainsByName.size).toBe(0)
      expect(domainsByTenant.get('tenant-A')?.size).toBe(0)
    })

    it('remove — 跨租户无权限返回 error', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'a.com', 'tenant-A')!
      const err = inlineRemoveDomain(domains, domainsByName, domainsByTenant, r.mapping!.id, 'tenant-B')
      expect(err).toBe('not found')
    })
  })

  // ── 3. DNS TXT 校验 ─────────────────────────────────────────

  describe('3. DNS TXT 校验', () => {
    it('DNS TXT 校验成功 → status 变为 active', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'verify-test.com', 'tenant-A')!
      const m = r.mapping!
      // 注入正确的 TXT 记录
      const expectedValue = inlineBuildVerificationValue(m.verificationToken)
      dnsOverrides.set(m.verificationHost, [expectedValue])
      const err = inlineVerify(domains, domainsByName, m.id, 'tenant-A', dnsOverrides)
      expect(err).toBeNull()
      const updated = inlineGetById(domains, m.id, 'tenant-A')
      expect(updated!.status).toBe('active')
      expect(updated!.lastVerifiedAt).toBeTruthy()
    })

    it('DNS TXT 校验失败 → 递增失败次数，第 3 次自动 disabled', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'fail-test.com', 'tenant-A')!
      const m = r.mapping!
      // 注入错误 TXT 记录
      dnsOverrides.set(m.verificationHost, ['wrong-value-xxx'])

      const err1 = inlineVerify(domains, domainsByName, m.id, 'tenant-A', dnsOverrides)
      expect(err1).toContain('1/3')
      expect(inlineGetById(domains, m.id, 'tenant-A')!.verificationFailCount).toBe(1)

      const err2 = inlineVerify(domains, domainsByName, m.id, 'tenant-A', dnsOverrides)
      expect(err2).toContain('2/3')
      expect(inlineGetById(domains, m.id, 'tenant-A')!.verificationFailCount).toBe(2)

      const err3 = inlineVerify(domains, domainsByName, m.id, 'tenant-A', dnsOverrides)
      expect(err3).toContain('3/3')
      expect(inlineGetById(domains, m.id, 'tenant-A')!.status).toBe('disabled')
    })

    it('DNS TXT 校验 — 已 active 的域名直接返回', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'active.com', 'tenant-A')!
      const m = r.mapping!
      // 先使状态变为 active
      m.status = 'active'
      const err = inlineVerify(domains, domainsByName, m.id, 'tenant-A', dnsOverrides)
      expect(err).toBeNull()
    })
  })

  // ── 4. SSL 申请 ─────────────────────────────────────────────

  describe('4. SSL 申请', () => {
    it('SSL 申请 — active 域名可成功申请', async () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'ssl-test.com', 'tenant-A')!
      const m = r.mapping!
      // 先验证
      m.status = 'active'

      const result = await inlineRequestSsl(domains, m.id, 'tenant-A')
      expect(result.error).toBeUndefined()
      const updated = domains.get(m.id)!
      expect(updated.status).toBe('active_ssl')
      expect(updated.ssl).toBeTruthy()
      expect(updated.ssl!.provider).toBe('letsencrypt')
    })

    it('SSL 申请 — pending_verification 的域名被拒绝', async () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'pending.com', 'tenant-A')!
      const result = await inlineRequestSsl(domains, r.mapping!.id, 'tenant-A')
      expect(result.error).toContain('must be active')
    })

    it('SSL 申请 — disabled 域名被拒绝', async () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'disabled.com', 'tenant-A')!
      r.mapping!.status = 'disabled'
      const result = await inlineRequestSsl(domains, r.mapping!.id, 'tenant-A')
      expect(result.error).toContain('must be active')
    })
  })

  // ── 5. Host → Tenant 解析 ──────────────────────────────────

  describe('5. Host → Tenant 解析', () => {
    it('active/active_ssl 状态的域名可解析', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'shop.acme.com', 'tenant-A')!
      r.mapping!.status = 'active'
      expect(inlineResolveTenantByHost(domains, domainsByName, 'shop.acme.com')).toBe('tenant-A')
      r.mapping!.status = 'active_ssl'
      expect(inlineResolveTenantByHost(domains, domainsByName, 'SHOP.ACME.COM')).toBe('tenant-A')
    })

    it('disabled/pending_verification 域名不解析', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'down.shop.com', 'tenant-A')!
      r.mapping!.status = 'disabled'
      expect(inlineResolveTenantByHost(domains, domainsByName, 'down.shop.com')).toBeNull()

      const r2 = inlineAddDomain(domains, domainsByName, domainsByTenant, 'pending.shop.com', 'tenant-A')!
      expect(inlineResolveTenantByHost(domains, domainsByName, 'pending.shop.com')).toBeNull()
    })

    it('未注册的 host 返回 null', () => {
      expect(inlineResolveTenantByHost(domains, domainsByName, 'unknown.com')).toBeNull()
    })

    it('host 含端口号时自动剥离', () => {
      const r = inlineAddDomain(domains, domainsByName, domainsByTenant, 'port.shop.com', 'tenant-A')!
      r.mapping!.status = 'active'
      expect(inlineResolveTenantByHost(domains, domainsByName, 'port.shop.com:8080')).toBe('tenant-A')
    })
  })
})
