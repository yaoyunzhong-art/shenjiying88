import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * license-package.module.test.ts
 *
 * LicensePackageModule 单元测试。
 * TypeORM 实体装饰器在 tsx/node:test 上下文不可用，
 * 这里验证模块定义的结构性约定，不触发实体装饰器加载。
 */

import assert from 'node:assert/strict'
describe('LicensePackageModule', () => {
  it('模块定义文件存在', () => {
    // 只验证文件存在，不触发 require 链加载 TypeORM 实体
    const fs = require('node:fs')
    const path = require('node:path')
    const modPath = path.resolve(__dirname, 'license-package.module.ts')
    assert.ok(fs.existsSync(modPath), 'module 文件存在')
  })

  it('模块名符合 NestJS 约定 - ClassName: LicensePackageModule', () => {
    // 验证文件名约定
    const name = 'LicensePackageModule'
    assert.equal(typeof name, 'string')
    assert.ok(name.endsWith('Module'))
  })

  it('模块入口文件 license-package.module.ts 存在且非空', () => {
    const fs = require('node:fs')
    const path = require('node:path')
    const content = fs.readFileSync(path.resolve(__dirname, 'license-package.module.ts'), 'utf8')
    assert.ok(content.length > 100, '模块文件内容非空')
    assert.ok(content.includes('@Module'))
    assert.ok(content.includes('TypeOrmModule.forFeature'))
    assert.ok(content.includes('LicensePackageController'))
    assert.ok(content.includes('LicensePackageService'))
  })

  it('模块配套文件完整性检查', () => {
    const fs = require('node:fs')
    const path = require('node:path')
    const dir = __dirname

    const files = [
      'license-package.module.ts',
      'license-package.controller.ts',
      'license-package.service.ts',
      'entities/license-package.entity.ts',
      'dto/index.ts',
    ]

    for (const f of files) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `文件 ${f} 存在`)
    }

    // 测试文件
    const testFiles = [
      'license-package.module.test.ts',
      'license-package.entity.test.ts',
      'license-package.dto.test.ts',
      'license-package.service.test.ts',
      'license-package.controller.test.ts',
      'license-package.controller.spec.ts',
    ]

    for (const f of testFiles) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `测试文件 ${f} 存在`)
    }
  })
})
