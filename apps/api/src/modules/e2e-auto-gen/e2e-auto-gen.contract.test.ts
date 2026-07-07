import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [e2e-auto-gen] [D] 合约测试
 *
 * 验证 e2e-auto-gen 模块的合约接口完整性
 */

import assert from 'node:assert/strict'
import {
  E2EAutoGenController,
} from './e2e-auto-gen.controller'

describe('[e2e-auto-gen] 合约: 控制器接口', () => {
  it('控制器类已导出', () => {
    assert.ok(E2EAutoGenController)
    assert.equal(typeof E2EAutoGenController, 'function')
  })

  it('控制器实例包含所有公开方法', () => {
    // 方法签名验证
    const proto = E2EAutoGenController.prototype
    const methods = Object.getOwnPropertyNames(proto).filter(
      (name) => name !== 'constructor' && typeof (proto as any)[name] === 'function'
    )
    const expectedMethods = [
      'generate',
      'execute',
      'getTask',
      'getReport',
      'listConfigs',
      'createConfig',
      'updateConfig',
      'health',
    ]
    for (const m of expectedMethods) {
      assert.ok(methods.includes(m), `方法 ${m} 应在控制器中定义`)
    }
    assert.equal(methods.length, expectedMethods.length)
  })
})
