/**
 * security-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证安全扫描和WAF防护核心流程
 * 覆盖: 正例(规则匹配阻止) + 反例(安全请求通过) + 边界(速率限制/敏感数据检测)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'

describe('🔵 SecurityRingBeam: 安全策略PRD对齐', () => {
  let scannerService: SecurityScannerService
  let wafService: WAFService

  beforeEach(() => {
    scannerService = new SecurityScannerService()
    wafService = new WAFService()
  })

  // ─── WAF: 已知恶意IP应被拦截 ──────────────────────────────────────

  it('[P0] WAF应拦截已知恶意IP的请求', () => {
    const decision = wafService.evaluate({
      ip: '192.168.1.100',
      path: '/api/order',
      method: 'GET',
      body: '',
    })

    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
    expect(decision.riskLevel).toBe('malicious')
    expect(decision.reason).toContain('blocked')
  })

  // ─── WAF: 正常请求应通过 ──────────────────────────────────────────

  it('[P0] 正常来源IP和路径的请求应被允许通过', () => {
    const decision = wafService.evaluate({
      ip: '203.0.113.42',
      path: '/api/order/list',
      method: 'GET',
      body: '{}',
    })

    expect(decision.allowed).toBe(true)
    expect(decision.action).toBeUndefined()
    expect(decision.riskLevel).toBe('safe')
  })

  // ─── WAF: SQL注入payload应被拦截 ─────────────────────────────────

  it('[P1] 请求体包含SQL注入payload应被WAF拦截', () => {
    const decision = wafService.evaluate({
      ip: '203.0.113.100',
      path: '/api/order',
      method: 'POST',
      body: "username=admin' OR '1'='1",
    })

    expect(decision.allowed).toBe(false)
    expect(decision.reason).toContain('blocked')
  })

  // ─── 安全扫描: 无HTTP客户端时不报错 ──────────────────────────────

  it('[P1] ScanEngine在无httpClient时检测返回null而非crash', async () => {
    const result = await scannerService.detectSQLInjection(
      '/api/test', 'username', 'test',
    )
    expect(result).toBeNull()
  })

  // ─── 安全扫描: 敏感数据检测 ───────────────────────────────────────

  it('[P1] 应能检测API响应中的敏感字段暴露', async () => {
    const response = {
      id: 1,
      name: 'test',
      password: 'secret123',
      credit_card: '4111-1111-1111-1111',
      email: 'test@test.com',
    }

    const exposedFields = await scannerService.detectSensitiveDataExposure(
      '/api/user/1', response,
    )

    expect(exposedFields).toContain('password')
    expect(exposedFields).toContain('credit_card')
    expect(exposedFields).not.toContain('name')
    expect(exposedFields).not.toContain('email') // 'email'不是敏感模式
  })

  // ─── WAF: 速率限制 ───────────────────────────────────────────────

  it('[P1] 短时间内超过速率限制应被WAF拦截', () => {
    const ip = '10.0.0.1'

    // 发送100次正常请求
    for (let i = 0; i < 100; i++) {
      wafService.evaluate({ ip, path: '/api/test', method: 'GET' })
    }

    // 第101次应被拦截
    const decision = wafService.evaluate({ ip, path: '/api/test', method: 'GET' })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
  })
})
