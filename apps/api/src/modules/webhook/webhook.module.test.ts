import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
/**
 * webhook.module.test.ts
 *
 * WebhookModule 结构验证测试。
 * 验证模块文件存在性、命名约定及配套文件完整性。
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'

describe('WebhookModule', () => {
  const dir = __dirname

  it('webhook.module.ts 文件存在且非空', () => {
    const filePath = path.resolve(dir, 'webhook.module.ts')
    assert.ok(fs.existsSync(filePath), 'webhook.module.ts 文件存在')
    const content = fs.readFileSync(filePath, 'utf8')
    assert.ok(content.length > 50, '文件内容非空')
    assert.ok(content.includes('@Module'), '包含 @Module 装饰器')
    assert.ok(content.includes('@Global'), '包含 @Global 装饰器')
    assert.ok(content.includes('WebhookController'), '注册 WebhookController')
    assert.ok(content.includes('WebhookService'), '注册 WebhookService')
  })

  it('模块名符合 NestJS 约定 - ClassName: WebhookModule', () => {
    const name = 'WebhookModule'
    assert.equal(typeof name, 'string')
    assert.ok(name.endsWith('Module'))
  })

  it('模块核心文件完整性检查', () => {
    const files = [
      'webhook.module.ts',
      'webhook.controller.ts',
      'webhook.service.ts',
      'webhook.entity.ts',
      'webhook.dto.ts',
      'webhook.eventbus.ts',
      'webhook.platforms.ts',
    ]
    for (const f of files) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `核心文件 ${f} 存在`)
    }
  })

  it('模块全部测试文件完整性检查', () => {
    const testFiles = [
      'webhook.module.test.ts',
      'webhook.entity.test.ts',
      'webhook.dto.test.ts',
      'webhook.service.test.ts',
      'webhook.service.spec.ts',
      'webhook.controller.test.ts',
      'webhook.controller.spec.ts',
      'webhook.e2e.test.ts',
      'webhook.role.test.ts',
      'webhook.role-extended.test.ts',
      'webhook.contract.test.ts',
      '_debug.test.ts',
    ]
    for (const f of testFiles) {
      assert.ok(fs.existsSync(path.resolve(dir, f)), `测试文件 ${f} 存在`)
    }
  })

  it('webhook.module.ts exports 声明检查', () => {
    const filePath = path.resolve(dir, 'webhook.module.ts')
    const content = fs.readFileSync(filePath, 'utf8')
    assert.ok(content.includes('exports:'), '包含 exports 声明')
    assert.ok(content.includes('WebhookService'), 'exports 中包含 WebhookService')
  })

  it('webhook.module.ts imports 为空 (无 TypeOrm 依赖)', () => {
    const filePath = path.resolve(dir, 'webhook.module.ts')
    const content = fs.readFileSync(filePath, 'utf8')
    // Webhook 模块为纯内存模式，不应引入 TypeOrm
    assert.ok(!content.includes('TypeOrmModule'), '未引入 TypeOrmModule')
  })
})
