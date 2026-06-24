import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { PortalModule } from './portal.module'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'

const stubConfigService = {
  get: () => ({}),
}

const stubMarketService = {
  getMergedProfile: () => ({
    marketCode: 'cn-mainland',
    locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
    network: { networkRegion: 'MAINLAND_CHINA' },
    email: { provider: 'ALIYUN_DM', fromName: 'test', fromAddress: 'test@local', replyTo: 'test@local' },
  }),
  getOverrides: () => [],
}

const stubFoundationService = {
  getDependencySummary: () => ({}),
}

describe('PortalModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PortalModule],
    })
      .overrideProvider('MarketService')
      .useValue(stubMarketService)
      .overrideProvider('FoundationService')
      .useValue(stubFoundationService)
      .compile()

    assert.ok(moduleRef)
  })

  test('should provide PortalController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PortalModule],
    })
      .overrideProvider('MarketService')
      .useValue(stubMarketService)
      .overrideProvider('FoundationService')
      .useValue(stubFoundationService)
      .compile()

    const controller = moduleRef.get<PortalController>(PortalController)
    assert.ok(controller)
    assert.ok(controller instanceof PortalController)
  })

  test('should provide PortalService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PortalModule],
    })
      .overrideProvider('MarketService')
      .useValue(stubMarketService)
      .overrideProvider('FoundationService')
      .useValue(stubFoundationService)
      .compile()

    const service = moduleRef.get<PortalService>(PortalService)
    assert.ok(service)
    assert.ok(service instanceof PortalService)
  })
})
