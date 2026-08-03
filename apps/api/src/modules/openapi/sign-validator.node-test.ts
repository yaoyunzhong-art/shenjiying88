import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SignValidator } from './sign-validator'
import type { SignedRequest } from './openapi.entity'

describe('SignValidator - 签名验证', () => {
  let validator: SignValidator

  beforeEach(() => {
    validator = new SignValidator()
  })

  it('sign 生成定长 hash 字符串', () => {
    const sig = validator.sign({
      secret: 'sec-123',
      method: 'POST',
      url: '/api/orders',
      timestamp: 1700000000000,
      nonce: 'n-001',
      body: '{"hello":"world"}'
    })
    assert.ok(typeof sig === 'string')
    assert.ok(sig.length > 0)
  })

  it('sign 相同输入 → 相同签名 (确定性)', () => {
    const input = { secret: 'sec-123', method: 'GET', url: '/ping', timestamp: 1700000000000, nonce: 'n-001' }
    const s1 = validator.sign(input)
    const s2 = validator.sign(input)
    assert.equal(s1, s2)
  })

  it('sign 不同 nonce → 不同签名', () => {
    const base = { secret: 'sec-123', method: 'GET', url: '/ping', timestamp: 1700000000000, body: '' }
    const s1 = validator.sign({ ...base, nonce: 'n-001' })
    const s2 = validator.sign({ ...base, nonce: 'n-002' })
    assert.notEqual(s1, s2)
  })

  it('sign 不同 body → 不同签名', () => {
    const base = { secret: 'sec-123', method: 'POST', url: '/api/orders', timestamp: 1700000000000, nonce: 'n-001' }
    const s1 = validator.sign({ ...base, body: '{"a":1}' })
    const s2 = validator.sign({ ...base, body: '{"a":2}' })
    assert.notEqual(s1, s2)
  })

  it('validate 完整有效请求 → valid', () => {
    const secret = 'sec-123'
    const ts = Date.now()
    const signedReq: SignedRequest = {
      method: 'POST',
      url: '/api/orders',
      body: '{"product":"p1"}',
      timestamp: ts,
      nonce: 'n-001',
      signature: validator.sign({ secret, method: 'POST', url: '/api/orders', timestamp: ts, nonce: 'n-001', body: '{"product":"p1"}' })
    }
    const result = validator.validate({ secret, request: signedReq })
    assert.ok(result.valid)
  })

  it('validate 签名不匹配 → signature_mismatch', () => {
    const result = validator.validate({
      secret: 'sec-123',
      request: {
        method: 'POST', url: '/api/orders', timestamp: Date.now(), nonce: 'n-001',
        signature: 'wrong_sig'
      }
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'signature_mismatch')
  })

  it('validate timestamp 超出 5min 窗口 → timestamp_out_of_window', () => {
    const result = validator.validate({
      secret: 'sec-123',
      request: {
        method: 'GET', url: '/ping', timestamp: Date.now() - 10 * 60 * 1000, nonce: 'n-001',
        signature: 'whatever'
      },
      now: Date.now()
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'timestamp_out_of_window')
  })

  it('validate 缺少必填字段 → missing_fields', () => {
    const result = validator.validate({
      secret: 'sec-123',
      request: {} as SignedRequest
    })
    assert.equal(result.valid, false)
    assert.equal(result.reason, 'missing_fields')
  })

  it('canonicalString 格式正确', () => {
    const cs = validator.canonicalString('POST', '/api/orders', 1700000000000, 'n-001', '{}')
    assert.equal(cs, 'POST\n/api/orders\n1700000000000\nn-001\n{}')
  })

  it('canonicalString method 转为大写', () => {
    const cs = validator.canonicalString('post', '/api/orders', 1700000000000, 'n-001', '{}')
    assert.ok(cs.startsWith('POST'))
  })

  it('isNonceReplayed 检测重复 nonce', () => {
    const used = new Set(['nonce-1', 'nonce-2'])
    assert.ok(validator.isNonceReplayed('nonce-1', used))
    assert.ok(!validator.isNonceReplayed('nonce-3', used))
  })

  it('getReplayWindowMs 返回 5 分钟', () => {
    assert.equal(validator.getReplayWindowMs(), 5 * 60 * 1000)
  })
})
