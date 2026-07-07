import { describe, it, expect } from 'vitest'
import { AiSalesModule } from './ai-sales.module'

describe('AiSalesModule', () => {
  it('应成功创建模块', () => {
    const module = AiSalesModule
    expect(module).toBeDefined()
  })

  it('应导出服务提供者', () => {
    const metadata = Reflect.getMetadata('providers', AiSalesModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBeGreaterThanOrEqual(3)
  })

  it('应注册控制器', () => {
    const metadata = Reflect.getMetadata('controllers', AiSalesModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBe(1)
  })

  it('应导出服务', () => {
    const metadata = Reflect.getMetadata('exports', AiSalesModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBeGreaterThanOrEqual(3)
  })
})
