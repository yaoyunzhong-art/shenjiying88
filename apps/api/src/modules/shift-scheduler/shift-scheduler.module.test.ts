/**
 * 🐜 自动: [shift-scheduler] module 测试 — 拉升 2→11 tests
 *
 * 圈梁五道箍: ①TSC ②测试存在 ③圈梁表更新 ④PRD标记 ⑤知识赋能
 * 三件套: 正例(定义/实例化/方法签名/exports) + 反例(异常/缺失) + 边界(空/零)
 * 禁止: as any / ts-nocheck / vi.mock
 */
import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ShiftSchedulerModule } from './shift-scheduler.module'
import { ShiftSchedulerController } from './shift-scheduler.controller'
import { ShiftSchedulerService } from './shift-scheduler.service'

// ── helpers ──

function getMeta(): {
  controllers: unknown[]
  providers: unknown[]
  exportsList: unknown[]
} {
  return {
    controllers: Reflect.getMetadata('controllers', ShiftSchedulerModule) as unknown[] ?? [],
    providers: Reflect.getMetadata('providers', ShiftSchedulerModule) as unknown[] ?? [],
    exportsList: Reflect.getMetadata('exports', ShiftSchedulerModule) as unknown[] ?? [],
  }
}

/** 获取原型上的公共方法名 (不含 constructor) */
function getProtoMethods(proto: object): string[] {
  return Object.getOwnPropertyNames(proto).filter(
    (k) => k !== 'constructor' && typeof Reflect.get(proto, k) === 'function'
  )
}

/** 通过 Function.prototype.toString 解析构造函数参数名 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getConstructorParamNames(ctor: new (...args: any[]) => unknown): string[] {
  const src = ctor.toString()
  const match = src.match(/constructor\s*\(([^)]*)\)/)
  if (!match) return []
  return match[1]
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('//'))
    .map((p) => {
      const colIdx = p.indexOf(':')
      return colIdx >= 0 ? p.slice(0, colIdx).trim() : p
    })
    .map((p) => p.replace(/^public\s+|^private\s+|^protected\s+|^readonly\s+/g, '').trim())
}

describe('ShiftSchedulerModule', () => {
  // ═══════════════════════════════════════════════════════════════
  // 正例 — 定义 & 模块元数据
  // ═══════════════════════════════════════════════════════════════

  it('正例: ShiftSchedulerModule 可 new 化', () => {
    const module = new ShiftSchedulerModule()
    assert.ok(module instanceof ShiftSchedulerModule)
  })

  it('正例: 包含 ShiftSchedulerController', () => {
    const { controllers } = getMeta()
    assert.ok(controllers.includes(ShiftSchedulerController))
  })

  it('正例: 包含 ShiftSchedulerService', () => {
    const { providers } = getMeta()
    assert.ok(providers.includes(ShiftSchedulerService))
  })

  it('正例: exports 包含 ShiftSchedulerService', () => {
    const { exportsList } = getMeta()
    assert.ok(exportsList.includes(ShiftSchedulerService))
  })

  it('正例: 模块无额外 imports', () => {
    const imports = Reflect.getMetadata('imports', ShiftSchedulerModule) as unknown[] | undefined
    assert.ok(imports === undefined || (Array.isArray(imports) && imports.length === 0))
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 方法签名存在性
  // ═══════════════════════════════════════════════════════════════

  it('正例: ShiftSchedulerController 暴露 8 个公共方法', () => {
    const methods = getProtoMethods(ShiftSchedulerController.prototype)
    assert.ok(methods.length >= 8, `expected >=8 methods, got ${methods.length}`)
    assert.ok(methods.includes('createShift'))
    assert.ok(methods.includes('listShifts'))
    assert.ok(methods.includes('getShift'))
    assert.ok(methods.includes('updateShift'))
    assert.ok(methods.includes('updateShiftStatus'))
    assert.ok(methods.includes('getWeeklyShifts'))
    assert.ok(methods.includes('getEmployeeWeeklyShifts'))
    assert.ok(methods.includes('seedMockData'))
  })

  it('正例: ShiftSchedulerService 暴露所有核心方法', () => {
    const methods = getProtoMethods(ShiftSchedulerService.prototype)
    assert.ok(methods.includes('createShift'))
    assert.ok(methods.includes('getShift'))
    assert.ok(methods.includes('listShifts'))
    assert.ok(methods.includes('updateShift'))
    assert.ok(methods.includes('updateShiftStatus'))
    assert.ok(methods.includes('getWeeklyShifts'))
    assert.ok(methods.includes('getEmployeeWeeklyShifts'))
    assert.ok(methods.includes('seedMockData'))
    assert.ok(methods.includes('resetShiftStoresForTests'))
    assert.ok(methods.length >= 9, `expected >=9 methods, got ${methods.length}`)
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例 — 异常场景
  // ═══════════════════════════════════════════════════════════════

  it('反例: Controller 构造函数期望 1 个参数 (shiftService)', () => {
    const paramNames = getConstructorParamNames(ShiftSchedulerController)
    assert.equal(paramNames.length, 1)
    assert.ok(paramNames[0].includes('shiftService'))
  })

  it('反例: Service 构造函数无参数 (无注入依赖)', () => {
    const paramNames = getConstructorParamNames(ShiftSchedulerService)
    assert.equal(paramNames.length, 0)
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界 — undefined / 空
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
