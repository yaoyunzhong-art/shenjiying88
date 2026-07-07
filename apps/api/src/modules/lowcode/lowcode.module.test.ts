/**
 * lowcode.module.test.ts
 * 低代码模块定义测试（含新增 LowcodeController + LowcodeService）
 */

import { describe, it, expect } from 'vitest'
import { LowcodeModule } from './lowcode.module'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'
import { LowcodeController } from './lowcode.controller'
import { LowcodeService } from './lowcode.service'

describe('LowcodeModule', () => {
  it('should be defined', () => {
    expect(LowcodeModule).toBeDefined()
  })

  it('should have LowcodePageController registered', () => {
    const metadata = Reflect.getMetadata('controllers', LowcodeModule)
    expect(metadata).toBeDefined()
    expect(metadata).toContain(LowcodePageController)
  })

  it('should have LowcodeController registered', () => {
    const metadata = Reflect.getMetadata('controllers', LowcodeModule)
    expect(metadata).toBeDefined()
    expect(metadata).toContain(LowcodeController)
  })

  it('should have both controllers registered', () => {
    const metadata = Reflect.getMetadata('controllers', LowcodeModule)
    expect(metadata).toHaveLength(2)
  })

  it('should have LowCodePageBuilder as provider', () => {
    const metadata = Reflect.getMetadata('providers', LowcodeModule)
    expect(metadata).toBeDefined()
    expect(metadata).toContain(LowCodePageBuilder)
  })

  it('should have AuditAlertService as provider', () => {
    const metadata = Reflect.getMetadata('providers', LowcodeModule)
    expect(metadata).toContain(AuditAlertService)
  })

  it('should have LowcodeService as provider', () => {
    const metadata = Reflect.getMetadata('providers', LowcodeModule)
    expect(metadata).toContain(LowcodeService)
  })

  it('should have 3 providers registered', () => {
    const metadata = Reflect.getMetadata('providers', LowcodeModule)
    expect(metadata).toHaveLength(3)
  })

  it('should export LowcodeService', () => {
    const metadata = Reflect.getMetadata('exports', LowcodeModule)
    expect(metadata).toContain(LowcodeService)
  })

  it('should export LowCodePageBuilder', () => {
    const metadata = Reflect.getMetadata('exports', LowcodeModule)
    expect(metadata).toContain(LowCodePageBuilder)
  })

  it('should export AuditAlertService', () => {
    const metadata = Reflect.getMetadata('exports', LowcodeModule)
    expect(metadata).toContain(AuditAlertService)
  })

  it('should have 3 exports registered', () => {
    const metadata = Reflect.getMetadata('exports', LowcodeModule)
    expect(metadata).toHaveLength(3)
  })
})
