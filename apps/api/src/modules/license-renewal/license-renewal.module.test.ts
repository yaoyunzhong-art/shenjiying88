import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Sprint 3 Phase 2 - License 续费管理 Module 测试
 */

import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { LicenseRenewalModule } from './license-renewal.module'
import { LicenseRenewalController } from './license-renewal.controller'
import { LicenseRenewalService } from './license-renewal.service'

describe('LicenseRenewalModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LicenseRenewalModule],
    }).compile()

    assert.ok(moduleRef)
    assert.ok(moduleRef instanceof TestingModule)
  })

  it('should provide LicenseRenewalController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LicenseRenewalModule],
    }).compile()

    const controller = moduleRef.get<LicenseRenewalController>(LicenseRenewalController)
    assert.ok(controller)
    assert.ok(controller instanceof LicenseRenewalController)
  })

  it('should provide LicenseRenewalService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LicenseRenewalModule],
    }).compile()

    const service = moduleRef.get<LicenseRenewalService>(LicenseRenewalService)
    assert.ok(service)
    assert.ok(service instanceof LicenseRenewalService)
  })

  it('should export LicenseRenewalService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [LicenseRenewalModule],
    }).compile()

    const exported = moduleRef.get<LicenseRenewalService>(LicenseRenewalService)
    assert.ok(exported)
  })
})
