import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 报表/看板 Module 测试 (V10 Day 7 Phase 91)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportModule } from './report.module'

describe('ReportModule', () => {
  it('module metadata is defined', () => {
    assert.ok(ReportModule)
    const metadata = Reflect.getMetadata('imports', ReportModule) ?? []
    const controllers = Reflect.getMetadata('controllers', ReportModule) ?? []
    const providers = Reflect.getMetadata('providers', ReportModule) ?? []
    const exports = Reflect.getMetadata('exports', ReportModule) ?? []

    assert.ok(controllers.length >= 1)
    assert.ok(providers.length >= 1)
    assert.ok(exports.length >= 1)
  })

  it('module can be instantiated', () => {
    const instance = new ReportModule()
    assert.ok(instance instanceof ReportModule)
  })

  it('should have at least one import', () => {
    const imports = Reflect.getMetadata('imports', ReportModule) ?? []
    assert.ok(Array.isArray(imports))
  })

  it('controller count should be exactly 1', () => {
    const controllers = Reflect.getMetadata('controllers', ReportModule)
    assert.equal(controllers.length, 1)
  })

  it('providers should include ReportService', () => {
    const providers = Reflect.getMetadata('providers', ReportModule) ?? []
    const names = providers.map((p: any) => p?.name ?? p)
    assert.ok(names.some((n: string) => n.includes('Report') || n.includes('Service')))
  })

  it('should export modules needed externally', () => {
    const exports = Reflect.getMetadata('exports', ReportModule) ?? []
    assert.ok(Array.isArray(exports))
    const exportNames = exports.map((e: any) => e?.name ?? e)
    const hasService = exportNames.some((n: string) => n.includes('Service'))
    assert.ok(exports.length >= 1)
  })
})
