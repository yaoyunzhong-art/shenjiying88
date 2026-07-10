import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants'
import { TenantContext } from './tenant.decorator'

describe('TenantContext param decorator', () => {
  it('is a function (returned by createParamDecorator)', () => {
    assert.equal(typeof TenantContext, 'function')
  })

  it('called with no arguments returns a ParameterDecorator function', () => {
    const decorator = TenantContext()
    assert.equal(typeof decorator, 'function')
  })

  it('called with data returns a ParameterDecorator function', () => {
    const decorator = TenantContext('custom-key')
    assert.equal(typeof decorator, 'function')
  })

  it('returns different decorator instances per call', () => {
    const d1 = TenantContext()
    const d2 = TenantContext()
    assert.notEqual(d1, d2)
  })

  it('sets ROUTE_ARGS_METADATA on controller method parameter index 0', () => {
    const decorator = TenantContext()
    class TestController {
       
      handle(_ctx: unknown) {}
    }
    decorator(TestController.prototype, 'handle', 0)

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle')
    assert.ok(metadata, 'ROUTE_ARGS_METADATA should be set')

    const keys = Object.keys(metadata)
    assert.ok(keys.length >= 1, `Expected at least 1 key, got ${keys.length}`)

    // NestJS key format: $uid__customRouteArgs__$index:0
    const paramEntry = Object.values(metadata).find(
      (v: any) => v && typeof v === 'object' && v.index === 0
    )
    assert.ok(paramEntry, 'param at index 0 should have metadata entry')
  })

  it('sets metadata on different parameter index', () => {
    const decorator = TenantContext()
    class TestController {
       
      handle(_a: unknown, _b: unknown) {}
    }
    decorator(TestController.prototype, 'handle', 1)

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle')
    const paramEntry = Object.values(metadata).find(
      (v: any) => v && typeof v === 'object' && v.index === 1
    )
    assert.ok(paramEntry, 'param at index 1 should have metadata entry')
  })

  it('sets metadata for multiple parameters on same method', () => {
    const d0 = TenantContext()
    const d1 = TenantContext()
    class TestController {
       
      handle(_ctx: unknown, _brand: unknown) {}
    }
    d0(TestController.prototype, 'handle', 0)
    d1(TestController.prototype, 'handle', 1)

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle')
    const keys = Object.keys(metadata)
    assert.ok(keys.length >= 2, `Expected at least 2 param entries, got ${keys.length}`)
  })

  it('does not throw when applied to different methods', () => {
    const decorator = TenantContext()
    class TestController {
      handleA() {}
      handleB() {}
    }
    assert.doesNotThrow(() => decorator(TestController.prototype, 'handleA', 0))
    assert.doesNotThrow(() => decorator(TestController.prototype, 'handleB', 0))
  })

  it('metadata entry includes index and empty pipes array', () => {
    const decorator = TenantContext()
    class TestController {
       
      handle(_ctx: unknown) {}
    }
    decorator(TestController.prototype, 'handle', 0)

    const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'handle')
    const entry = Object.values(metadata).find(
      (v: any) => v && typeof v === 'object' && v.index === 0
    ) as any

    assert.ok(entry, 'should have entry')
    assert.equal(entry.index, 0)
    assert.ok(Array.isArray(entry.pipes))
    assert.equal(entry.pipes.length, 0)
    // factory and data are also stored by NestJS
    assert.ok(typeof entry.factory === 'function' || entry.data !== undefined, 'entry should have factory function or data')
  })
})
