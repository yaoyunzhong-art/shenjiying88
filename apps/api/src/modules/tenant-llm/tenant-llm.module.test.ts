/**
 * tenant-llm.module.test.ts — 多租户 LLM 配置模块测试
 *
 * 验证模块元数据正确，所有 provider/controller/export 符合预期。
 * 由于 llm-config.service.ts / controller.ts 使用 @ts-ignore 引入
 * TenantScopeGuard（非标准路径），该 token 仅运行时可用。
 *
 * 策略: Reflect Metadata 检测 module 层级结构 + 防 undefined
 */

import { describe, it, expect } from 'vitest'
import { TenantLLMModule } from './tenant-llm.module'

describe('TenantLLMModule', () => {
  it('should have @Module decorator with metadata', () => {
    const controllers: any[] = Reflect.getMetadata('controllers', TenantLLMModule) || []
    const providers: any[] = Reflect.getMetadata('providers', TenantLLMModule) || []
    const exports: any[] = Reflect.getMetadata('exports', TenantLLMModule) || []

    expect(controllers.length).toBeGreaterThanOrEqual(1)
    expect(providers.length).toBeGreaterThanOrEqual(1)
    expect(exports.length).toBeGreaterThanOrEqual(1)
  })

  it('should declare TenantLLMController as controller', () => {
    const controllers: any[] = Reflect.getMetadata('controllers', TenantLLMModule) || []
    const names = controllers.map((c: any) => c?.name || '')
    expect(names).toContain('TenantLLMController')
  })

  it('should provide TenantLLMService', () => {
    const providers: any[] = Reflect.getMetadata('providers', TenantLLMModule) || []
    const names = providers.filter(Boolean).map((p: any) => p?.name || p?.provide?.name || '')
    expect(names).toContain('TenantLLMService')
  })

  it('should provide TenantLLMGateway', () => {
    const providers: any[] = Reflect.getMetadata('providers', TenantLLMModule) || []
    const names = providers.filter(Boolean).map((p: any) => p?.name || p?.provide?.name || '')
    expect(names).toContain('TenantLLMGateway')
  })

  it('should provide I18nGeoService', () => {
    const providers: any[] = Reflect.getMetadata('providers', TenantLLMModule) || []
    const names = providers.filter(Boolean).map((p: any) => p?.name || p?.provide?.name || '')
    expect(names).toContain('I18nGeoService')
  })

  it('should export TenantLLMService', () => {
    const exportsList: any[] = Reflect.getMetadata('exports', TenantLLMModule) || []
    const names = exportsList.filter(Boolean).map((e: any) => e?.name || e?.provide?.name || '')
    expect(names).toContain('TenantLLMService')
  })

  it('should export TenantLLMGateway', () => {
    const exportsList: any[] = Reflect.getMetadata('exports', TenantLLMModule) || []
    const names = exportsList.filter(Boolean).map((e: any) => e?.name || e?.provide?.name || '')
    expect(names).toContain('TenantLLMGateway')
  })

  it('should export I18nGeoService', () => {
    const exportsList: any[] = Reflect.getMetadata('exports', TenantLLMModule) || []
    const names = exportsList.filter(Boolean).map((e: any) => e?.name || e?.provide?.name || '')
    expect(names).toContain('I18nGeoService')
  })
})
