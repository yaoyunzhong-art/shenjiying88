/**
 * terminal-sign.service.spec.ts — 终端签名验签 Service 单元测试
 *
 * 覆盖: setTerminalSecret / removeTerminalSecret / hasTerminalSecret /
 *       signRequest / signHeartbeat / signQueueOperation /
 *       verifyRequest / verifyHeartbeat / resetForTests
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TerminalSignService, type SignResult, type VerifyResult } from './terminal-sign.service'

describe('TerminalSignService', () => {
  let svc: TerminalSignService
  const terminalId = 'term-sign-001'
  const secret = 'super-secret-key-12345678'

  beforeEach(() => {
    svc = new TerminalSignService()
    svc.resetForTests()
  })

  // ═══════════════════════════════════════════════════
  // 密钥管理
  // ═══════════════════════════════════════════════════

  describe('setTerminalSecret', () => {
    it('正例: 设置终端密钥成功', () => {
      svc.setTerminalSecret(terminalId, secret)
      expect(svc.hasTerminalSecret(terminalId)).toBe(true)
    })

    it('反例: 密钥长度不足16字符抛异常', () => {
      expect(() => svc.setTerminalSecret(terminalId, 'short-key')).toThrow('at least 16 characters')
    })

    it('正例: 可为多个终端设置不同密钥', () => {
      svc.setTerminalSecret('term-a', 'aaaaaaaaaaaaaaaa')
      svc.setTerminalSecret('term-b', 'bbbbbbbbbbbbbbbb')
      expect(svc.hasTerminalSecret('term-a')).toBe(true)
      expect(svc.hasTerminalSecret('term-b')).toBe(true)
    })

    it('正例: 覆盖已有密钥不报错', () => {
      svc.setTerminalSecret(terminalId, 'aaaaaaaaaaaaaaaa')
      svc.setTerminalSecret(terminalId, secret)
      expect(svc.hasTerminalSecret(terminalId)).toBe(true)
    })
  })

  describe('removeTerminalSecret', () => {
    it('正例: 删除已有密钥返回true', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.removeTerminalSecret(terminalId)
      expect(result).toBe(true)
      expect(svc.hasTerminalSecret(terminalId)).toBe(false)
    })

    it('反例: 删除不存在的密钥返回false', () => {
      const result = svc.removeTerminalSecret('nonexistent')
      expect(result).toBe(false)
    })
  })

  describe('hasTerminalSecret', () => {
    it('已设置密钥返回true', () => {
      svc.setTerminalSecret(terminalId, secret)
      expect(svc.hasTerminalSecret(terminalId)).toBe(true)
    })

    it('未设置密钥返回false', () => {
      expect(svc.hasTerminalSecret('unknown-terminal')).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // signRequest
  // ═══════════════════════════════════════════════════

  describe('signRequest', () => {
    it('正例: 生成请求签名成功', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.signRequest(terminalId, '{"action":"ping"}')
      expect(result.signature).toBeTruthy()
      expect(result.timestamp).toBeGreaterThan(0)
      expect(result.version).toBe('v1')
      expect(result.algorithm).toBe('HMAC-SHA256')
    })

    it('正例: 相同payload+timestamp生成相同签名', () => {
      svc.setTerminalSecret(terminalId, secret)
      const ts = 1234567890000
      const r1 = svc.signRequest(terminalId, '{"a":1}', ts)
      const r2 = svc.signRequest(terminalId, '{"a":1}', ts)
      expect(r1.signature).toBe(r2.signature)
    })

    it('正例: 不同payload生成不同签名', () => {
      svc.setTerminalSecret(terminalId, secret)
      const ts = Date.now()
      const r1 = svc.signRequest(terminalId, '{"a":1}', ts)
      const r2 = svc.signRequest(terminalId, '{"a":2}', ts)
      expect(r1.signature).not.toBe(r2.signature)
    })

    it('反例: 未设置密钥的终端抛异常', () => {
      expect(() => svc.signRequest('unknown', 'payload')).toThrow('No secret configured')
    })

    it('正例: 支持自定义时间戳', () => {
      svc.setTerminalSecret(terminalId, secret)
      const customTs = 1700000000000
      const result = svc.signRequest(terminalId, 'payload', customTs)
      expect(result.timestamp).toBe(customTs)
    })
  })

  // ═══════════════════════════════════════════════════
  // signHeartbeat / signQueueOperation
  // ═══════════════════════════════════════════════════

  describe('signHeartbeat', () => {
    it('正例: 生成心跳签名成功', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.signHeartbeat(terminalId, 50)
      expect(result.signature).toBeTruthy()
      expect(result.algorithm).toBe('HMAC-SHA256')
    })

    it('正例: 不同latencyMs生成不同签名', () => {
      svc.setTerminalSecret(terminalId, secret)
      const r1 = svc.signHeartbeat(terminalId, 10)
      const r2 = svc.signHeartbeat(terminalId, 100)
      expect(r1.signature).not.toBe(r2.signature)
    })
  })

  describe('signQueueOperation', () => {
    it('正例: 生成排队操作签名成功', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.signQueueOperation(terminalId, 'call', 'qe-001')
      expect(result.signature).toBeTruthy()
    })

    it('正例: 不同operation生成不同签名', () => {
      svc.setTerminalSecret(terminalId, secret)
      const r1 = svc.signQueueOperation(terminalId, 'join', 'qe-001')
      const r2 = svc.signQueueOperation(terminalId, 'leave', 'qe-001')
      expect(r1.signature).not.toBe(r2.signature)
    })
  })

  // ═══════════════════════════════════════════════════
  // verifyRequest
  // ═══════════════════════════════════════════════════

  describe('verifyRequest', () => {
    it('正例: 验证有效签名返回valid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const ts = Date.now()
      const signed = svc.signRequest(terminalId, '{"hello":"world"}', ts)
      const result = svc.verifyRequest(terminalId, '{"hello":"world"}', signed.signature, ts)
      expect(result.valid).toBe(true)
    })

    it('反例: 无密钥终端的请求返回invalid', () => {
      const result = svc.verifyRequest('unknown', 'payload', 'sig', Date.now())
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('No secret configured for terminal')
    })

    it('反例: 未来时间戳（超出30秒偏差）返回invalid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const farFuture = Date.now() + 60000 // 60秒后
      const signed = svc.signRequest(terminalId, 'payload', farFuture)
      const result = svc.verifyRequest(terminalId, 'payload', signed.signature, farFuture)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Timestamp is in the future')
    })

    it('反例: 过期签名返回invalid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const past = Date.now() - 10 * 60 * 1000 // 10分钟前（超过默认5分钟窗口）
      const signed = svc.signRequest(terminalId, 'payload', past)
      const result = svc.verifyRequest(terminalId, 'payload', signed.signature, past)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Signature expired')
    })

    it('反例: 签名不匹配返回invalid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.verifyRequest(terminalId, 'payload', 'fake-signature', Date.now())
      expect(result.valid).toBe(false)
    })

    it('反例: 签名长度不匹配返回invalid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const result = svc.verifyRequest(terminalId, 'payload', 'a', Date.now())
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Signature length mismatch')
    })

    it('正例: 支持自定义replayWindow', () => {
      svc.setTerminalSecret(terminalId, secret)
      const past = Date.now() - 3 * 60 * 1000 // 3分钟前
      const signed = svc.signRequest(terminalId, 'payload', past)

      // 默认5min窗口 → 有效
      const defaultResult = svc.verifyRequest(terminalId, 'payload', signed.signature, past)
      expect(defaultResult.valid).toBe(true)

      // 自定义1min窗口 → 过期
      const tightResult = svc.verifyRequest(terminalId, 'payload', signed.signature, past, 60000)
      expect(tightResult.valid).toBe(false)
      expect(tightResult.reason).toContain('Signature expired')
    })

    it('正例: 不同终端密钥生成不同签名', () => {
      svc.setTerminalSecret('term-a', 'aaaaaaaaaaaaaaaa')
      svc.setTerminalSecret('term-b', 'bbbbbbbbbbbbbbbb')
      const ts = Date.now()
      const sigA = svc.signRequest('term-a', 'data', ts)
      // 用term-b的密钥验证term-a的签名 → 不匹配
      const result = svc.verifyRequest('term-b', 'data', sigA.signature, ts)
      expect(result.valid).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // verifyHeartbeat
  // ═══════════════════════════════════════════════════

  describe('verifyHeartbeat', () => {
    it('正例: 验证有效心跳签名返回valid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const ts = Date.now()
      const signed = svc.signHeartbeat(terminalId, 30)
      const result = svc.verifyHeartbeat(terminalId, 30, signed.signature, ts)
      expect(result.valid).toBe(true)
    })

    it('反例: 心跳payload不匹配返回invalid', () => {
      svc.setTerminalSecret(terminalId, secret)
      const ts = Date.now()
      const signed = svc.signHeartbeat(terminalId, 30)
      // latencyMs=50 与签名的30不一致
      const result = svc.verifyHeartbeat(terminalId, 50, signed.signature, ts)
      expect(result.valid).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════
  // resetForTests
  // ═══════════════════════════════════════════════════

  describe('resetForTests', () => {
    it('重置后所有密钥清空', () => {
      svc.setTerminalSecret(terminalId, secret)
      svc.resetForTests()
      expect(svc.hasTerminalSecret(terminalId)).toBe(false)
    })

    it('重置后signRequest抛异常', () => {
      svc.setTerminalSecret(terminalId, secret)
      svc.resetForTests()
      expect(() => svc.signRequest(terminalId, 'data')).toThrow('No secret configured')
    })
  })
})
