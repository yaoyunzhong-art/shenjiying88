import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [omnichannel] [D] module test - 模块注册验证
 *
 * 验证 OmnichannelModule 内所有 provider、controller、export 正确注册
 */

import assert from 'node:assert/strict'

describe('OmnichannelModule', () => {
  it('should import module without errors', async () => {
    const mod = await import('./omnichannel.module')
    assert.ok(mod.OmnichannelModule)
    assert.equal(typeof mod.OmnichannelModule, 'function')
  })

  it('should have valid controller import', async () => {
    const ctrl = await import('./omnichannel.controller')
    assert.ok(ctrl.OmnichannelController)
    // Controller has 3 constructor args
    assert.equal(ctrl.OmnichannelController.length, 3)
  })

  it('should have valid service imports', async () => {
    const svc = await import('./omnichannel.service')
    assert.ok(svc.OmnichannelReachService)
    assert.ok(svc.SMSDualChannelService)
    assert.ok(svc.InternationalEmailService)
  })

  it('should have valid entity exports', async () => {
    const entity = await import('./omnichannel.entity')
    assert.ok(entity.DEFAULT_CHANNEL_CONFIGS)
    assert.equal(entity.DEFAULT_CHANNEL_CONFIGS.length, 4)
    assert.ok(entity.DEFAULT_CHANNEL_CONFIGS[0].channel)
    assert.ok(entity.DEFAULT_CHANNEL_CONFIGS[0].status)
  })

  it('module decorator metadata should be present', async () => {
    const { OmnichannelModule } = await import('./omnichannel.module')
    // Reflect metadata set by @Module() decorator
    const controllers: unknown[] = Reflect.getMetadata('controllers', OmnichannelModule) ?? []
    const providers: unknown[] = Reflect.getMetadata('providers', OmnichannelModule) ?? []
    const exportsList: unknown[] = Reflect.getMetadata('exports', OmnichannelModule) ?? []

    assert.ok(Array.isArray(controllers), 'controllers metadata should be an array')
    assert.ok(Array.isArray(providers), 'providers metadata should be an array')
    assert.ok(Array.isArray(exportsList), 'exports metadata should be an array')

    assert.ok(controllers.length >= 1, 'should have at least 1 controller')
    assert.ok(providers.length >= 3, 'should have at least 3 providers')
    assert.ok(exportsList.length >= 3, 'should have at least 3 exports')
  })
})
