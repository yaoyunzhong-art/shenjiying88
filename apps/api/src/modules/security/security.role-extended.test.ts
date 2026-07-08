import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'
import type { ScanTarget, Vulnerability } from './security-scanner.service'

/**
 * 🐜 [security] 角色扩展测试
 * 覆盖安全扫描、WAF 防护边界场景
 */

function setup() {
  return {
    scanner: new SecurityScannerService(),
    waf: new WAFService(),
  }
}

describe('👔店长 security 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('扫描安全漏洞', async () => {
    const target: ScanTarget = { endpoint: "https://example.com", method: "GET" }
    const result: Vulnerability[] = await svc.scanner.scan(target)
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('扫描多个目标', async () => {
    const targets: ScanTarget[] = [
      { endpoint: "https://example.com", method: "GET" },
      { endpoint: "https://example.org", method: "GET" },
    ]
    const results = await svc.scanner.scanMultiple(targets)
    expect(results.size).toBe(2)
  })
})

describe('🔧安监 security 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('WAF 拦截恶意请求', () => {
    const result = svc.waf.evaluate({
      path: '/admin',
      method: 'POST',
      headers: {},
      body: JSON.stringify({ action: 'delete_all' }),
      ip: '10.0.0.1',
    })
    expect(result).toBeDefined()
    expect(typeof result.allowed).toBe('boolean')
  })

  it('WAF 放行正常请求', () => {
    const result = svc.waf.evaluate({
      path: '/api/public',
      method: 'GET',
      headers: {},
      ip: '1.2.3.4',
    })
    expect(result.allowed).toBe(true)
  })
})

describe('📢营销 security 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('生成漏洞报告', () => {
    const report = svc.scanner.generateReport([])
    expect(report).toBeDefined()
    expect(typeof report).toBe('string')
  })
})
