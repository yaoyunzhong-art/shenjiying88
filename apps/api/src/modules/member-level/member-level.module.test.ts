import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberLevelModule } from './member-level.module'

describe('MemberLevelModule', () => {
  it('should export MemberLevelModule as a valid NestJS module', () => {
    assert.ok(MemberLevelModule)
    assert.equal(typeof MemberLevelModule, 'function')
  })

  it('should have @Module decorator metadata', () => {
    const moduleMetadata = Reflect.getMetadata('imports', MemberLevelModule) ?? []
    const controllers = Reflect.getMetadata('controllers', MemberLevelModule)
    const providers = Reflect.getMetadata('providers', MemberLevelModule)
    const exports = Reflect.getMetadata('exports', MemberLevelModule)

    assert.ok(Array.isArray(moduleMetadata))
    assert.ok(Array.isArray(controllers))
    assert.ok(Array.isArray(providers))
    assert.ok(Array.isArray(exports))

    assert.ok(controllers.length >= 1, 'Should have at least 1 controller')
    assert.ok(providers.length >= 1, 'Should have at least 1 provider')

    // Check that MemberLevelService is exported
    const exportNames = exports.map((e: any) => e.name ?? e.toString())
    assert.ok(exportNames.some((n: string) => n.includes('MemberLevelService') || n.includes('member-level.service')))
  })
})
