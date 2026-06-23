import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

 
const {
  RequireRateLimit,
  RATE_LIMIT_METADATA_KEY,
  RateLimitMetadata
} = require('./request-governance.decorator')

const sampleMetadata = {
  limit: 100,
  windowSeconds: 60,
  blockSeconds: 300,
  prefix: 'test-prefix',
  scopeBy: ['tenant', 'actor'] as Array<'tenant' | 'actor' | 'ip' | 'route'>
}

describe('RequireRateLimit decorator', () => {
  test('is a function', () => {
    assert.equal(typeof RequireRateLimit, 'function')
  })

  test('returns a decorator function when called with metadata', () => {
    const decorator = RequireRateLimit(sampleMetadata)
    assert.equal(typeof decorator, 'function')
  })

  test('sets metadata on method via descriptor.value', () => {
    class TestController {
      handle() {}
    }
    const decorator = RequireRateLimit(sampleMetadata)
    const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle')!
    const returnedDescriptor = decorator(TestController.prototype, 'handle', descriptor)

    // NestJS SetMetadata stores on descriptor.value when a descriptor is present
    const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value)
    assert.ok(stored, 'rate limit metadata should be set on descriptor.value')
    assert.equal(stored.limit, 100)
    assert.equal(stored.windowSeconds, 60)
    assert.equal(stored.blockSeconds, 300)
    assert.equal(stored.prefix, 'test-prefix')
    assert.deepStrictEqual(stored.scopeBy, ['tenant', 'actor'])
    // decorator should return the descriptor
    assert.equal(returnedDescriptor, descriptor)
  })

  test('sets metadata on class-level target (no descriptor)', () => {
    const decorator = RequireRateLimit({ limit: 10, windowSeconds: 30 })
    class TestController {}
    const result = decorator(TestController)

    const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, TestController)
    assert.ok(stored, 'rate limit metadata should be set on class')
    assert.equal(stored.limit, 10)
    assert.equal(stored.windowSeconds, 30)
    // decorator returns the target when no descriptor
    assert.equal(result, TestController)
  })

  test('metadata between different methods does not interfere', () => {
    class TestController {
      handleA() {}
      handleB() {}
    }
    const decA = RequireRateLimit({ limit: 5, windowSeconds: 10 })
    const decB = RequireRateLimit({ limit: 50, windowSeconds: 120 })

    const descA = Object.getOwnPropertyDescriptor(TestController.prototype, 'handleA')!
    const descB = Object.getOwnPropertyDescriptor(TestController.prototype, 'handleB')!
    decA(TestController.prototype, 'handleA', descA)
    decB(TestController.prototype, 'handleB', descB)

    const storedA = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descA.value)
    const storedB = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descB.value)

    assert.equal(storedA.limit, 5)
    assert.equal(storedB.limit, 50)
    assert.notEqual(storedA.windowSeconds, storedB.windowSeconds)
  })

  test('RATE_LIMIT_METADATA_KEY is the expected constant', () => {
    assert.equal(RATE_LIMIT_METADATA_KEY, 'trust-governance:rate-limit')
    assert.equal(typeof RATE_LIMIT_METADATA_KEY, 'string')
  })

  test('accepts minimal metadata (only limit + windowSeconds)', () => {
    class TestController {
      handle() {}
    }
    const decorator = RequireRateLimit({ limit: 1, windowSeconds: 5 })
    const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle')!
    decorator(TestController.prototype, 'handle', descriptor)

    const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value)
    assert.equal(stored.limit, 1)
    assert.equal(stored.windowSeconds, 5)
    assert.equal(stored.blockSeconds, undefined)
    assert.equal(stored.prefix, undefined)
    assert.equal(stored.scopeBy, undefined)
  })

  test('accepts metadata with scopeBy ip and route', () => {
    class TestController {
      handle() {}
    }
    const decorator = RequireRateLimit({
      limit: 200,
      windowSeconds: 3600,
      scopeBy: ['ip', 'route']
    })
    const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle')!
    decorator(TestController.prototype, 'handle', descriptor)

    const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value)
    assert.equal(stored.limit, 200)
    assert.deepStrictEqual(stored.scopeBy, ['ip', 'route'])
  })

  test('different controllers do not share metadata', () => {
    class CtrlA {
      handleA() {}
    }
    class CtrlB {
      handleB() {}
    }
    const decA = RequireRateLimit({ limit: 10, windowSeconds: 60 })
    const decB = RequireRateLimit({ limit: 999, windowSeconds: 9999 })

    const descA = Object.getOwnPropertyDescriptor(CtrlA.prototype, 'handleA')!
    const descB = Object.getOwnPropertyDescriptor(CtrlB.prototype, 'handleB')!
    decA(CtrlA.prototype, 'handleA', descA)
    decB(CtrlB.prototype, 'handleB', descB)

    assert.equal(Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descA.value).limit, 10)
    assert.equal(Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descB.value).limit, 999)
  })
})
