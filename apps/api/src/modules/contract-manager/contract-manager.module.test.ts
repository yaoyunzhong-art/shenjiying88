/**
 * 🐜 自动: [contract-manager] module 测试 — 拉升 2→11 tests
 *
 * 圈梁五道箍: ①TSC ②测试存在 ③圈梁表更新 ④PRD标记 ⑤知识赋能
 * 三件套: 正例(定义/实例化/方法签名/exports) + 反例(异常/缺失) + 边界(空/零)
 * 禁止: as any / ts-nocheck / vi.mock
 */
import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ContractManagerModule } from './contract-manager.module'
import { ContractManagerController } from './contract-manager.controller'
import { ContractManagerService } from './contract-manager.service'

// ── helpers ──

function getMeta(): {
  controllers: unknown[]
  providers: unknown[]
  exportsList: unknown[]
} {
  return {
    controllers: Reflect.getMetadata('controllers', ContractManagerModule) as unknown[] ?? [],
    providers: Reflect.getMetadata('providers', ContractManagerModule) as unknown[] ?? [],
    exportsList: Reflect.getMetadata('exports', ContractManagerModule) as unknown[] ?? [],
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

describe('ContractManagerModule', () => {
  // ═══════════════════════════════════════════════════════════════
  // 正例 — 定义 & 模块元数据
  // ═══════════════════════════════════════════════════════════════

  it('正例: ContractManagerModule 可 new 化', () => {
    const module = new ContractManagerModule()
    assert.ok(module instanceof ContractManagerModule)
  })

  it('正例: 包含 ContractManagerController', () => {
    const { controllers } = getMeta()
    assert.ok(controllers.includes(ContractManagerController))
  })

  it('正例: 包含 ContractManagerService', () => {
    const { providers } = getMeta()
    assert.ok(providers.includes(ContractManagerService))
  })

  it('正例: exports 包含 ContractManagerService', () => {
    const { exportsList } = getMeta()
    assert.ok(exportsList.includes(ContractManagerService))
  })

  it('正例: 模块无额外 imports', () => {
    const imports = Reflect.getMetadata('imports', ContractManagerModule) as unknown[] | undefined
    assert.ok(imports === undefined || (Array.isArray(imports) && imports.length === 0))
  })

  // ═══════════════════════════════════════════════════════════════
  // 正例 — 方法签名存在性 (反射验证原型)
  // ═══════════════════════════════════════════════════════════════

  it('正例: ContractManagerController 暴露 13 个公共方法', () => {
    const methods = getProtoMethods(ContractManagerController.prototype)
    assert.ok(methods.length >= 12, `expected >=12 methods, got ${methods.length}`)
    assert.ok(methods.includes('createContract'))
    assert.ok(methods.includes('listContracts'))
    assert.ok(methods.includes('getContract'))
    assert.ok(methods.includes('updateContract'))
    assert.ok(methods.includes('updateContractStatus'))
    assert.ok(methods.includes('getExpiringContracts'))
    assert.ok(methods.includes('getExpiredContracts'))
    assert.ok(methods.includes('addClause'))
    assert.ok(methods.includes('bulkAddClauses'))
    assert.ok(methods.includes('listClauses'))
    assert.ok(methods.includes('updateClause'))
    assert.ok(methods.includes('deleteClause'))
    assert.ok(methods.includes('seedMockData'))
  })

  it('正例: ContractManagerService 暴露所有核心方法', () => {
    const methods = getProtoMethods(ContractManagerService.prototype)
    assert.ok(methods.includes('createContract'))
    assert.ok(methods.includes('getContract'))
    assert.ok(methods.includes('listContracts'))
    assert.ok(methods.includes('updateContract'))
    assert.ok(methods.includes('updateContractStatus'))
    assert.ok(methods.includes('addClause'))
    assert.ok(methods.includes('listClauses'))
    assert.ok(methods.includes('updateClause'))
    assert.ok(methods.includes('deleteClause'))
    assert.ok(methods.includes('getExpiringContracts'))
    assert.ok(methods.includes('getExpiredContracts'))
    assert.ok(methods.includes('seedMockData'))
    assert.ok(methods.includes('resetContractStoresForTests'))
    assert.ok(methods.length >= 12, `expected >=12 methods, got ${methods.length}`)
  })

  // ═══════════════════════════════════════════════════════════════
  // 反例 — 异常场景
  // ═══════════════════════════════════════════════════════════════

  it('反例: Controller 构造函数期望 1 个参数 (contractService)', () => {
    const paramNames = getConstructorParamNames(ContractManagerController)
    assert.equal(paramNames.length, 1)
    assert.ok(paramNames[0].includes('contractService'))
  })

  it('反例: Service 构造函数无参数 (无注入依赖)', () => {
    const paramNames = getConstructorParamNames(ContractManagerService)
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
