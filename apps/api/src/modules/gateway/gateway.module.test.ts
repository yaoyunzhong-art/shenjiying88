// gateway.module.test.ts — Gateway 模块加载测试
import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { GatewayModule } from './gateway.module'
import { GatewayController } from './gateway.controller'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'

describe('GatewayModule', () => {
  let moduleRef: TestingModule

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [GatewayModule],
    }).compile()
  })

  it('模块应被正确创建', () => {
    expect(moduleRef).toBeDefined()
  })

  it('GatewayController 应被正确实例化', () => {
    const controller = moduleRef.get<GatewayController>(GatewayController)
    expect(controller).toBeDefined()
    expect(controller).toBeInstanceOf(GatewayController)
  })

  it('APIGateway 服务应被正确提供', () => {
    const service = moduleRef.get<APIGateway>(APIGateway)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(APIGateway)
  })

  it('RateLimiterService 应被正确提供', () => {
    const service = moduleRef.get<RateLimiterService>(RateLimiterService)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(RateLimiterService)
  })

  it('APIKeyManager 应被正确提供', () => {
    const service = moduleRef.get<APIKeyManager>(APIKeyManager)
    expect(service).toBeDefined()
    expect(service).toBeInstanceOf(APIKeyManager)
  })

  it('模块应导出所有服务', () => {
    const exports = Reflect.getMetadata('exports', GatewayModule) || []
    const providers = Reflect.getMetadata('providers', GatewayModule) || []
    const exportedProviders = providers.filter((p: unknown) =>
      exports.includes(typeof p === 'function' ? p : (p as { provide?: unknown }).provide),
    )
    // 至少要有 3 个导出的服务
    expect(exports.length).toBeGreaterThanOrEqual(3)
  })

  it('模块应注册 GatewayController', () => {
    const controllers = Reflect.getMetadata('controllers', GatewayModule) || []
    expect(controllers).toContain(GatewayController)
  })
})
