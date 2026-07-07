/**
 * saas-billing.module.test.ts
 *
 * SaaSBillingModule 单元测试 —— 验证模块定义、控制器和服务注册
 */

import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'
import { SaaSBillingModule } from './saas-billing.module'
import { SaaSBillingController } from './saas-billing.controller'
import { SaaSBillingService } from './saas-billing.service'

describe('SaaSBillingModule', () => {
  it('should be defined', () => {
    assert.ok(SaaSBillingModule)
  })

  it('should have SaaSBillingController registered', () => {
    const controllers = Reflect.getMetadata('controllers', SaaSBillingModule)
    assert.ok(controllers)
    assert.ok(controllers.includes(SaaSBillingController))
  })

  it('should have SaaSBillingService registered as provider', () => {
    const providers = Reflect.getMetadata('providers', SaaSBillingModule)
    assert.ok(providers)
    assert.ok(providers.includes(SaaSBillingService))
  })

  it('should export SaaSBillingService', () => {
    const exports = Reflect.getMetadata('exports', SaaSBillingModule)
    assert.ok(exports)
    assert.ok(exports.includes(SaaSBillingService))
  })
})
