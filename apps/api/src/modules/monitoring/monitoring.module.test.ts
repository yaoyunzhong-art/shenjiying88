import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [monitoring] [A] module.test 补全
 *
 * 验证 MonitoringModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { MonitoringModule } from './monitoring.module'
import { MonitoringService } from './monitoring.service'
import { MonitoringController } from './monitoring.controller'

describe('MonitoringModule', () => {
  it('should be defined', () => {
    assert.ok(MonitoringModule)
  })

  it('should export MonitoringService', () => {
    const exports = Reflect.getMetadata('exports', MonitoringModule) ?? []
    assert.ok(exports.includes(MonitoringService))
  })

  it('should have MonitoringController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', MonitoringModule) ?? []
    assert.ok(controllers.includes(MonitoringController))
  })

  it('should have MonitoringService in providers', () => {
    const providers = Reflect.getMetadata('providers', MonitoringModule) ?? []
    assert.ok(providers.includes(MonitoringService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', MonitoringModule) ?? false
    assert.ok(isGlobal)
  })
})
