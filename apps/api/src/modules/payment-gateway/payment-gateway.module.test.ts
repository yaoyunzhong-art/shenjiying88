/**
 * PaymentGatewayModule 单元测试
 *
 * T117-3: 本地化支付
 * 验证模块配置正确性：providers / controllers / exports
 */

import { describe, it, expect } from 'vitest'
import { PaymentGatewayModule } from './payment-gateway.module'

describe('PaymentGatewayModule', () => {
  it('should be defined', () => {
    expect(PaymentGatewayModule).toBeDefined()
  })

  it('should have controller registered', () => {
    const metadata = Reflect.getMetadata('controllers', PaymentGatewayModule)
    expect(metadata).toBeDefined()
    expect(Array.isArray(metadata)).toBe(true)
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('should have PaymentGatewayController in controllers', () => {
    const metadata = Reflect.getMetadata('controllers', PaymentGatewayModule)
    const controllerNames = metadata.map((c: any) => c.name)
    expect(controllerNames).toContain('PaymentGatewayController')
  })

  it('should have providers registered', () => {
    const metadata = Reflect.getMetadata('providers', PaymentGatewayModule)
    expect(metadata).toBeDefined()
    expect(Array.isArray(metadata)).toBe(true)
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('should have PaymentGatewayService in providers', () => {
    const metadata = Reflect.getMetadata('providers', PaymentGatewayModule)
    const providerNames = metadata.map((p: any) => p.name || p)
    expect(providerNames).toContain('PaymentGatewayService')
  })

  it('should have exports defined', () => {
    const metadata = Reflect.getMetadata('exports', PaymentGatewayModule)
    expect(metadata).toBeDefined()
    expect(Array.isArray(metadata)).toBe(true)
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('should export PaymentGatewayService', () => {
    const metadata = Reflect.getMetadata('exports', PaymentGatewayModule)
    const exportNames = metadata.map((e: any) => e.name || e)
    expect(exportNames).toContain('PaymentGatewayService')
  })
})
