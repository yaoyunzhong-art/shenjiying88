import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { SignValidator } from './sign-validator'
import type { SignedRequest } from './openapi.entity'

describe('SignValidator', () => {
  let validator: SignValidator

  beforeEach(() => {
    validator = new SignValidator()
  })

  describe('sign', () => {
    it('生成签名', () => {
      const sig = validator.sign({
        secret: 'my-secret',
        method: 'POST',
        url: '/api/orders',
        timestamp: 1234567890000,
        nonce: 'n-1',
        body: '{"total":100}'
      })
      assert.ok(sig.length > 0)
    })

    it('相同输入产生相同签名', () => {
      const input = {
        secret: 's', method: 'GET', url: '/a',
        timestamp: 1000, nonce: 'n', body: ''
      }
      const s1 = validator.sign(input)
      const s2 = validator.sign(input)
      assert.equal(s1, s2)
    })

    it('不同 body 产生不同签名', () => {
      const sig1 = validator.sign({ secret: 's', method: 'POST', url: '/a', timestamp: 1000, nonce: 'n', body: 'a' })
      const sig2 = validator.sign({ secret: 's', method: 'POST', url: '/a', timestamp: 1000, nonce: 'n', body: 'b' })
      assert.notEqual(sig1, sig2)
    })

    it('不同 secret 产生不同签名', () => {
      const sig1 = validator.sign({ secret: 's1', method: 'GET', url: '/a', timestamp: 1000, nonce: 'n', body: '' })
      const sig2 = validator.sign({ secret: 's2', method: 'GET', url: '/a', timestamp: 1000, nonce: 'n', body: '' })
      assert.notEqual(sig1, sig2)
    })
  })

  describe('validate', () => {
    const secret = 'test-secret'
    const now = Date.now()

    it('合法签名通过', () => {
      const request: SignedRequest = {
        method: 'POST', url: '/api/orders',
        body: '{"x":1}',
        timestamp: now,
        nonce: 'n1',
        signature: validator.sign({ secret, method: 'POST', url: '/api/orders', timestamp: now, nonce: 'n1', body: '{"x":1}' })
      }
      const r = validator.validate({ secret, request, now })
      assert.equal(r.valid, true)
    })

    it('签名不匹配被拒', () => {
      const request: SignedRequest = {
        method: 'POST', url: '/api/orders',
        timestamp: now, nonce: 'n1',
        signature: 'wrong-signature'
      }
      const r = validator.validate({ secret, request, now })
      assert.equal(r.valid, false)
      assert.equal(r.reason, 'signature_mismatch')
    })

    it('时间戳超出窗口被拒 (太早)', () => {
      const oldTimestamp = now - (10 * 60 * 1000)  // 10 分钟前
      const request: SignedRequest = {
        method: 'POST', url: '/api/orders',
        timestamp: oldTimestamp, nonce: 'n1',
        signature: validator.sign({ secret, method: 'POST', url: '/api/orders', timestamp: oldTimestamp, nonce: 'n1' })
      }
      const r = validator.validate({ secret, request, now })
      assert.equal(r.valid, false)
      assert.equal(r.reason, 'timestamp_out_of_window')
    })

    it('时间戳超出窗口被拒 (太晚)', () => {
      const futureTimestamp = now + (10 * 60 * 1000)
      const request: SignedRequest = {
        method: 'POST', url: '/api/orders',
        timestamp: futureTimestamp, nonce: 'n1',
        signature: 'fake'
      }
      const r = validator.validate({ secret, request, now })
      assert.equal(r.valid, false)
    })

    it('5min 窗口内合法', () => {
      const ts = now - (3 * 60 * 1000)  // 3 分钟前
      const request: SignedRequest = {
        method: 'POST', url: '/api/orders',
        timestamp: ts, nonce: 'n1',
        signature: validator.sign({ secret, method: 'POST', url: '/api/orders', timestamp: ts, nonce: 'n1' })
      }
      const r = validator.validate({ secret, request, now })
      assert.equal(r.valid, true)
    })

    it('缺字段被拒', () => {
      const r1 = validator.validate({
        secret,
        request: { method: 'POST', url: '', timestamp: now, nonce: 'n', signature: 's' } as any
      })
      assert.equal(r1.valid, false)
      assert.equal(r1.reason, 'missing_fields')
    })
  })

  describe('canonicalString', () => {
    it('包含所有字段', () => {
      const c = validator.canonicalString('POST', '/api/x', 1000, 'n', '{}')
      assert.ok(c.includes('POST'))
      assert.ok(c.includes('/api/x'))
      assert.ok(c.includes('1000'))
      assert.ok(c.includes('n'))
      assert.ok(c.includes('{}'))
    })
  })

  describe('isNonceReplayed', () => {
    it('未使用 nonce', () => {
      assert.equal(validator.isNonceReplayed('new', new Set()), false)
    })

    it('已使用 nonce', () => {
      assert.equal(validator.isNonceReplayed('old', new Set(['old'])), true)
    })
  })

  describe('getReplayWindowMs', () => {
    it('返回 5 分钟', () => {
      assert.equal(validator.getReplayWindowMs(), 5 * 60 * 1000)
    })
  })
})