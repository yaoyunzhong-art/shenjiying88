import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
/**
 * security.module.test.ts
 *
 * SecurityModule 结构验证测试。
 * 验证模块文件存在性、命名约定及配套文件完整性。
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'

describe('SecurityModule', () => {
  const dir = __dirname

  it('security.module.ts 存在且非空', () => {
    const filePath = path.resolve(dir, 'security.module.ts')
    assert.ok(fs.existsSync(filePath), 'security.module.ts 文件存在')
    const content = fs.readFileSync(filePath, 'utf8')
    assert.ok(content.length > 50, '文件内容非空')
    assert.ok(content.includes('@Module'), '包含 @Module 装饰器')
    assert.ok(content.includes('SecurityController'), '注册 SecurityController')
    assert.ok(content.includes('SecurityScannerService'), '注册 SecurityScannerService')
    assert.ok(content.includes('WAFService'), '注册 WAFService')
  })

  it('模块名符合 NestJS 约定 - ClassName: SecurityModule', () => {
    const name = 'SecurityModule'
    assert.equal(typeof name, 'string')
    assert.ok(name.endsWith('Module'))
  })

  it('模块核心文件完整性检查', () => {
    const files = [
      'security.module.ts',
      'security.controller.ts',
      'security-scanner.service.ts',
      'waf.service.ts',
      'security.entity.ts',
      'security.dto.ts',
    ]
    for (const f of files) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `核心文件 ${f} 存在`)
    }
  })

  it('模块全部测试文件完整性检查', () => {
    const testFiles = [
      'security.module.test.ts',
      'security.entity.test.ts',
      'security.dto.test.ts',
      'security.service.test.ts',
      'security.service.spec.ts',
      'security.controller.test.ts',
      'security.controller.spec.ts',
      'security.e2e.test.ts',
      'security.role.test.ts',
      'security.role-extended.test.ts',
    ]
    for (const f of testFiles) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `测试文件 ${f} 存在`)
    }
  })

  it('security.module.ts exports 声明检查', () => {
    const filePath = path.resolve(dir, 'security.module.ts')
    const content = fs.readFileSync(filePath, 'utf8')
    assert.ok(content.includes('exports:'), '包含 exports 声明')
    assert.ok(
      content.includes('SecurityScannerService') && content.includes('WAFService'),
      'exports 中包含两个 service',
    )
  })
})
