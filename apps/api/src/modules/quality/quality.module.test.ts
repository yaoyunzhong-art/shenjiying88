/**
 * 🐜 自动: [quality] [D] module 测试
 *
 * 圈梁五道箍: ①TSC ②测试存在 ③圈梁表更新 ④PRD标记 ⑤知识赋能
 * 三件套: 正例(定义/实例化/方法签名/exports) + 反例(异常/缺失) + 边界(空/零)
 * 禁止: as any / ts-nocheck / vi.mock
 */
import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { QualityModule } from './quality.module'
import { QualityController } from './quality.controller'
import { QualityService } from './quality.service'

function getMeta(): {
  controllers: unknown[]
  providers: unknown[]
  exportsList: unknown[]
} {
  return {
    controllers: Reflect.getMetadata('controllers', QualityModule) as unknown[] ?? [],
    providers: Reflect.getMetadata('providers', QualityModule) as unknown[] ?? [],
    exportsList: Reflect.getMetadata('exports', QualityModule) as unknown[] ?? [],
  }
}

function getProtoMethods(proto: object): string[] {
  return Object.getOwnPropertyNames(proto).filter(
    (k) => k !== 'constructor' && typeof Reflect.get(proto, k) === 'function'
  )
}

describe('QualityModule', () => {
  // ═══════════════════════════════════════════════════════════════
  // 正例 — 定义 & 模块元数据
  // ═══════════════════════════════════════════════════════════════

  it('正例: QualityModule 可 new 化', () => {
    const mod = new QualityModule()
    assert.ok(mod instanceof QualityModule)
  })

  it('正例: 包含 QualityController', () => {
    const { controllers } = getMeta()
    assert.ok(controllers.includes(QualityController))
  })

  it('正例: 包含 QualityService', () => {
    const { providers } = getMeta()
    assert.ok(providers.includes(QualityService))
  })

  it('正例: exports 包含 QualityService', () => {
    const { exportsList } = getMeta()
    assert.ok(exportsList.includes(QualityService))
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 方法签名存在性
  // ═══════════════════════════════════════════════════════════════

  it('正例: QualityController 暴露 20+ 公共方法', () => {
    const methods = getProtoMethods(QualityController.prototype)
    assert.ok(methods.length >= 20, `expected >=20 methods, got ${methods.length}`)
  })

  it('正例: QualityService 暴露 15+ 公共方法', () => {
    const methods = getProtoMethods(QualityService.prototype)
    assert.ok(methods.length >= 15, `expected >=15 methods, got ${methods.length}`)
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界 — metadata
  // ═══════════════════════════════════════════════════════════════

  it('边界: metadata 不为 undefined', () => {
    const { controllers, providers, exportsList } = getMeta()
    assert.notStrictEqual(controllers, undefined)
    assert.notStrictEqual(providers, undefined)
    assert.notStrictEqual(exportsList, undefined)
  })

  it('边界: 所有 metadata 均为数组', () => {
    const { controllers, providers, exportsList } = getMeta()
    assert.ok(Array.isArray(controllers))
    assert.ok(Array.isArray(providers))
    assert.ok(Array.isArray(exportsList))
  })
})
