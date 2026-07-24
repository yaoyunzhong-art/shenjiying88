/**
 * 🐜 自动: [terminal] [A] 签名验签服务测试
 *
 * WP-12A: 终端三合一底座 — 签名验签基础逻辑
 * - HMAC-SHA256 签名生成
 * - 签名验证
 * - 防重放攻击
 * - 密钥管理
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalSignService } from './terminal-sign.service'

function makeService(): TerminalSignService {
  const svc = new TerminalSignService()
  svc.resetForTests()
  return svc
}

describe('TerminalSignService — WP-12A 密钥管理', () => {
  let svc: TerminalSignService

  beforeEach(() => {
    svc = makeService()
  })

  /* ── 正例: setTerminalSecret ── */
  it('setTerminalSecret 应成功设置密钥', () => {
    svc.setTerminalSecret('term-001', 'super-secret-key-12345')
    expect(svc.hasTerminalSecret('term-001')).toBe(true)
  })

  /* ── 反例: 密钥太短应报错 ── */
  it('setTerminalSecret 密钥太短应报错', () => {
    expect(() => svc.setTerminalSecret('term-001', 'short')).toThrow(
      /at least 16/,
    )
  })

  /* ── 正例: removeTerminalSecret ── */
  it('removeTerminalSecret 应删除密钥', () => {
    svc.setTerminalSecret('term-001', 'super-secret-key-12345')
    expect(svc.removeTerminalSecret('term-001')).toBe(true)
    expect(svc.hasTerminalSecret('term-001')).toBe(false)
  })

  /* ── 反例: 删除不存在的密钥 ── */
  it('removeTerminalSecret 不存在的密钥应返回 false', () => {
    expect(svc.removeTerminalSecret('no-such')).toBe(false)
  })

  /* ── 边界: 多个终端密钥 ── */
  it('应支持多个终端各自独立密钥', () => {
    svc.setTerminalSecret('term-001', 'abc-def-ghi-jkl-mno')
    svc.setTerminalSecret('term-002', 'pqr-stu-vwx-yza-bcd')
    expect(svc.hasTerminalSecret('term-001')).toBe(true)
    expect(svc.hasTerminalSecret('term-002')).toBe(true)
  })
})

describe('TerminalSignService — WP-12A 签名生成', () => {
  let svc: TerminalSignService

  beforeEach(() => {
    svc = makeService()
    svc.setTerminalSecret('term-001', 'super-secret-key-12345')
  })

  /* ── 正例: signRequest ── */
  it('signRequest 应生成有效签名', () => {
    const result = svc.signRequest('term-001', '{"action":"heartbeat"}')
    expect(result.signature).toBeTruthy()
    expect(result.signature.length).toBe(64) // sha256 hex = 64 chars
    expect(result.timestamp).toBeGreaterThan(0)
    expect(result.version).toBe('v1')
    expect(result.algorithm).toBe('HMAC-SHA256')
  })

  /* ── 正例: 相同输入产生相同签名 ── */
  it('相同输入和时间戳应产生相同签名', () => {
    const ts = 1_000_000_000_000
    const r1 = svc.signRequest('term-001', '{"action":"test"}', ts)
    const r2 = svc.signRequest('term-001', '{"action":"test"}', ts)
    expect(r1.signature).toBe(r2.signature)
  })

  /* ── 正例: 不同输入产生不同签名 ── */
  it('不同输入应产生不同签名', () => {
    const ts = 1_000_000_000_000
    const r1 = svc.signRequest('term-001', '{"action":"a"}', ts)
    const r2 = svc.signRequest('term-001', '{"action":"b"}', ts)
    expect(r1.signature).not.toBe(r2.signature)
  })

  /* ── 反例: 未配置密钥时签名应报错 ── */
  it('未配置密钥时 signRequest 应报错', () => {
    expect(() => svc.signRequest('no-key', '{}')).toThrow(/No secret/)
  })

  /* ── 正例: signHeartbeat ── */
  it('signHeartbeat 应生成心跳签名', () => {
    const result = svc.signHeartbeat('term-001', 15)
    expect(result.signature).toBeTruthy()
    expect(result.signature.length).toBe(64)
  })

  /* ── 正例: signQueueOperation ── */
  it('signQueueOperation 应生成队列操作签名', () => {
    const result = svc.signQueueOperation('term-001', 'call-next', 'qe-1')
    expect(result.signature).toBeTruthy()
  })
})

describe('TerminalSignService — WP-12A 签名验证', () => {
  let svc: TerminalSignService

  beforeEach(() => {
    svc = makeService()
    svc.setTerminalSecret('term-001', 'super-secret-key-12345')
  })

  /* ── 正例: 有效签名验证通过 ── */
  it('有效的签名应验证通过', () => {
    const payload = '{"action":"heartbeat"}'
    const signed = svc.signRequest('term-001', payload)
    const result = svc.verifyRequest(
      'term-001',
      payload,
      signed.signature,
      signed.timestamp,
    )
    expect(result.valid).toBe(true)
  })

  /* ── 反例: 篡改签名应失败 ── */
  it('篡改的签名应验证失败', () => {
    const payload = '{"action":"heartbeat"}'
    const signed = svc.signRequest('term-001', payload)
    const result = svc.verifyRequest(
      'term-001',
      payload,
      signed.signature + 'ff', // 篡改
      signed.timestamp,
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('length mismatch')
  })

  /* ── 反例: 错误的签名应失败 ── */
  it('完全错误的签名应验证失败', () => {
    const payload = '{"action":"heartbeat"}'
    const signed = svc.signRequest('term-001', payload)
    // 使用错误签名但长度相同
    const wrongSig = 'a'.repeat(64)
    const result = svc.verifyRequest(
      'term-001',
      payload,
      wrongSig,
      signed.timestamp,
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('mismatch')
  })

  /* ── 反例: 过期签名应失败 ── */
  it('过期的签名应验证失败', () => {
    const payload = '{"action":"heartbeat"}'
    const oldTimestamp = Date.now() - 10 * 60 * 1000 // 10 分钟前
    const signed = svc.signRequest('term-001', payload, oldTimestamp)
    const result = svc.verifyRequest(
      'term-001',
      payload,
      signed.signature,
      oldTimestamp,
      5 * 60 * 1000, // 5分钟窗口
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expired')
  })

  /* ── 反例: 未来时间戳应失败 ── */
  it('未来时间戳应验证失败', () => {
    const payload = '{}'
    const futureTs = Date.now() + 120_000 // 未来2分钟
    const signed = svc.signRequest('term-001', payload, futureTs)
    const result = svc.verifyRequest('term-001', payload, signed.signature, futureTs)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('future')
  })

  /* ── 反例: 未配置密钥的终端应失败 ── */
  it('未配置密钥的终端验证应失败', () => {
    const result = svc.verifyRequest('no-key', '{}', 'sig', Date.now())
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('No secret')
  })

  /* ── 反例: 不同终端的签名不通用 ── */
  it('不同终端的签名不应互通', () => {
    svc.setTerminalSecret('term-002', 'another-secret-key-67890')
    const payload = '{}'
    const signed = svc.signRequest('term-001', payload)
    const result = svc.verifyRequest(
      'term-002',
      payload,
      signed.signature,
      signed.timestamp,
    )
    expect(result.valid).toBe(false)
  })

  /* ── 正例: verifyHeartbeat ── */
  it('verifyHeartbeat 应正确验证心跳签名', () => {
    const signed = svc.signHeartbeat('term-001', 15)
    const result = svc.verifyHeartbeat('term-001', 15, signed.signature, signed.timestamp)
    expect(result.valid).toBe(true)
  })

  /* ── 反例: verifyHeartbeat 参数不匹配 ── */
  it('verifyHeartbeat 参数不匹配应失败', () => {
    const signed = svc.signHeartbeat('term-001', 15)
    const result = svc.verifyHeartbeat('term-001', 99, signed.signature, signed.timestamp)
    expect(result.valid).toBe(false)
  })
})
