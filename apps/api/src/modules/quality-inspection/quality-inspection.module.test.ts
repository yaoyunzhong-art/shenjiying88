import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [quality-inspection] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QualityInspectionModule } from './quality-inspection.module'
import { QualityInspectionController } from './quality-inspection.controller'
import { QualityInspectionService } from './quality-inspection.service'

describe('QualityInspectionModule', () => {
  it('should be defined', () => {
    const mod = new QualityInspectionModule()
    assert.ok(mod instanceof QualityInspectionModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', QualityInspectionModule)
    const providers = Reflect.getMetadata('providers', QualityInspectionModule)
    const exports = Reflect.getMetadata('exports', QualityInspectionModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(QualityInspectionController))
    assert.ok(providers.includes(QualityInspectionService))
    assert.ok(exports.includes(QualityInspectionService))
  })
})
