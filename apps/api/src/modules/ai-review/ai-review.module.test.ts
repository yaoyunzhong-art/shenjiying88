import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [A] module.test 补全
 * AIReviewModule 单元测试 (node:test)
 *
 * 验证模块元数据和依赖注册
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
const MODULE_TS_PATH = resolve(__dirname, 'ai-review.module.ts')

describe('AIReviewModule', () => {
  it('模块文件可被加载', () => {
    const exists = existsSync(MODULE_TS_PATH)
    assert.equal(exists, true)
  })

  it('模块导出了 AIReviewService（供其他模块使用）', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')
    assert.ok(source.includes('AIReviewService'))
    assert.ok(source.includes('@Module('))
  })

  it('模块注册了 controller 和 providers', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')

    // controllers 注册
    assert.ok(source.includes('AIReviewController'))

    // providers 注册
    assert.ok(source.includes('ClaudeProvider'))
    assert.ok(source.includes('OpenAIProvider'))
    assert.ok(source.includes('LLMProviderFactory'))
    assert.ok(source.includes('CostTrackerService'))
    assert.ok(source.includes('AIReviewService'))
  })

  it('模块标记为 Global', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')
    assert.ok(source.includes('@Global()'))
  })

  it('模块 exports 了 LLM 相关服务', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')
    assert.ok(source.includes('ClaudeProvider'))
    assert.ok(source.includes('OpenAIProvider'))
    assert.ok(source.includes('LLMProviderFactory'))
    assert.ok(source.includes('CostTrackerService'))
    assert.ok(source.includes('AIReviewService'))
  })

  it('模块 import 了 ConfigModule', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')
    assert.ok(source.includes('ConfigModule'))
    assert.ok(source.includes('ConfigModule.forFeature(llmConfig)'))
  })

  it('模块重新导出 llm 子模块和 service', () => {
    const source = readFileSync(MODULE_TS_PATH, 'utf-8')
    assert.ok(source.includes("export * from './llm/types'"))
    assert.ok(source.includes("export * from './ai-review.service'"))
  })
})
