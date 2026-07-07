/**
 * lowcode.module.test.ts
 * 低代码模块定义测试
 */

import { describe, it, expect } from 'vitest'
import { LowcodeModule } from './lowcode.module'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'

describe('LowcodeModule', () => {
  it('should be defined', () => {
    expect(LowcodeModule).toBeDefined()
  })

  it('should have controller registered', () => {
    const metadata = Reflect.getMetadata('controllers', LowcodeModule)
    expect(metadata).toBeDefined()
    expect(metadata).toContain(LowcodePageController)
  })

  it('should have providers registered', () => {
    const metadata = Reflect.getMetadata('providers', LowcodeModule)
    expect(metadata).toBeDefined()
    expect(metadata).toContain(LowCodePageBuilder)
    expect(metadata).toContain(AuditAlertService)
  })
})
