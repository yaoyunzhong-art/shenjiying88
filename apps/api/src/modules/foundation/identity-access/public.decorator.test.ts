import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Public, IS_PUBLIC_KEY } from './public.decorator'

/**
 * NestJS SetMetadata 将 metadata 定义在 descriptor.value 上（当 descriptor 存在时）。
 */
function getMetadata(key: string, target: any, propertyKey: string) {
  return Reflect.getMetadata(key, target[propertyKey])
}

describe('@Public() decorator', () => {
  it('sets IS_PUBLIC_KEY to true on method', () => {
    const target: Record<string, any> = {}
    const method = () => {}
    target['publicMethod'] = method
    const desc: PropertyDescriptor = { value: method }
    Public()(target, 'publicMethod', desc)

    const metadata = getMetadata(IS_PUBLIC_KEY, target, 'publicMethod')
    assert.strictEqual(metadata, true)
  })

  it('sets IS_PUBLIC_KEY to true on class (static method)', () => {
    const target: Record<string, any> = {}
    const method = () => {}
    target['publicMethod'] = method
    const desc: PropertyDescriptor = { value: method }
    Public()(target, 'publicMethod', desc)

    // 验证 metadata 落在 method 上
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, desc.value)
    assert.strictEqual(metadata, true)
  })

  it('IS_PUBLIC_KEY constant is identity-access:is-public', () => {
    assert.strictEqual(IS_PUBLIC_KEY, 'identity-access:is-public')
  })
})
