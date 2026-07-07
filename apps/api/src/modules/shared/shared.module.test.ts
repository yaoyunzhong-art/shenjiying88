import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * shared.module.test.ts
 * SharedModule 基本测试
 */
import assert from 'node:assert/strict'

describe('SharedModule', () => {
  it('模块应正确导出 --- 验证文件存在', async () => {
    const mod = await import('./shared.module')
    assert.ok(mod.SharedModule)
    assert.equal(typeof mod.SharedModule, 'function')
  })

  it('controller 应正确导出', async () => {
    const mod = await import('./shared.controller')
    assert.ok(mod.SharedController)
    assert.equal(typeof mod.SharedController, 'function')
  })

  it('audit service 应正确导出', async () => {
    const mod = await import('./audit.service')
    assert.ok(mod.AuditService)
    assert.equal(typeof mod.AuditService, 'function')
  })

  it('tenant-validator 应正确导出', async () => {
    const mod = await import('./tenant-validator')
    assert.ok(mod.assertTenantId)
    assert.equal(typeof mod.assertTenantId, 'function')
    assert.ok(mod.isCrossTenant)
    assert.equal(typeof mod.isCrossTenant, 'function')
  })
})
