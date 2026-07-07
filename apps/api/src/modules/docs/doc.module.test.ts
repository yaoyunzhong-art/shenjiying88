/**
 * doc.module.test.ts - API文档模块集成测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { DocModule } from './doc.module'
import { DocController } from './doc.controller'
import { SwaggerGenService } from './swagger-gen.service'

describe('DocModule', () => {
  let moduleRef: TestingModule

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [DocModule],
    }).compile()
  })

  it('正例: 模块应能被正确编译', () => {
    expect(moduleRef).toBeDefined()
  })

  it('正例: DocController 应被正确实例化', () => {
    const controller = moduleRef.get(DocController)
    expect(controller).toBeInstanceOf(DocController)
  })

  it('正例: SwaggerGenService 应被正确实例化', () => {
    const service = moduleRef.get(SwaggerGenService)
    expect(service).toBeInstanceOf(SwaggerGenService)
  })

  it('正例: Controller 中使用 SwaggerGenService 应正常工作', () => {
    const controller = moduleRef.get(DocController)
    const result = controller.healthCheck()
    expect(result.status).toBe('ok')
  })

  it('正例: 导出 SwaggerGenService', () => {
    const service = moduleRef.get(SwaggerGenService)
    const spec = service.generateSpec({ title: 'Test', version: '1.0.0' })
    expect(spec.openapi).toBe('3.0.3')
  })

  it('正例: 模块端点完整', () => {
    const controller = moduleRef.get(DocController)
    expect(typeof controller.generate).toBe('function')
    expect(typeof controller.registerEndpoint).toBe('function')
    expect(typeof controller.registerSchema).toBe('function')
    expect(typeof controller.getStats).toBe('function')
    expect(typeof controller.listEndpoints).toBe('function')
    expect(typeof controller.healthCheck).toBe('function')
  })
})
