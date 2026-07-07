import { describe, it, expect } from 'vitest'
import { AiPushModule } from './ai-push.module'

describe('AiPushModule', () => {
  it('应该正确定义模块', () => {
    expect(AiPushModule).toBeDefined()
  })

  it('模块元数据应包含 Controller', () => {
    const metadata = Reflect.getMetadata('controllers', AiPushModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('模块元数据应包含 Providers', () => {
    const metadata = Reflect.getMetadata('providers', AiPushModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('模块应导出 Service', () => {
    const metadata = Reflect.getMetadata('exports', AiPushModule)
    expect(metadata).toBeDefined()
    expect(metadata.length).toBeGreaterThan(0)
  })

  it('模块名称应包含 AiPush', () => {
    expect(AiPushModule.name).toBe('AiPushModule')
  })
})
