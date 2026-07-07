import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityScannerService } from './security-scanner.service'
import { WafService } from './waf.service'

/**
 * 🐜 [security] 角色扩展测试
 * 覆盖安全扫描、WAF 防护边界场景
 */

function setup() {
  return {
    scanner: new SecurityScannerService(),
    waf: new WafService(),
  }
}

describe('👔店长 security 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('扫描 URL 安全', async () => {
    const result = await svc.scanner.scanUrl('https://example.com')
    expect(result).toBeDefined()
    expect(result).toHaveProperty('threats')
  })

  it('扫描代码安全', async () => {
    const result = await svc.scanner.scanCode('console.log("hello")', 'javascript')
    expect(result).toBeDefined()
  })
})

describe('🔧安监 security 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('WAF 拦截恶意请求', () => {
    const result = svc.waf.evaluate({
      path: '/admin',
      method: 'POST',
      body: { action: 'delete_all' },
      ip: '10.0.0.1',
    })
    expect(result.blocked).toBeDefined()
  })

  it('WAF 放行正常请求', () => {
    const result = svc.waf.evaluate({
      path: '/api/public',
      method: 'GET',
      headers: {},
      ip: '1.2.3.4',
    })
    expect(result.blocked).toBe(false)
  })

  it('报告漏洞列表', async () => {
    const report = await svc.scanner.generateReport()
    expect(report).toBeDefined()
  })
})
