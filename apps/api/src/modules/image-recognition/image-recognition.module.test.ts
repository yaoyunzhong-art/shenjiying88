import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [D] module test 补全
 * ImageRecognitionModule 纯文本结构验证测试
 *
 * 覆盖:
 * - Module 文件存在性
 * - controllers/providers/exports 关键字
 * - Service 可独立构造
 * - 5 个源文件完整性
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = resolve(__dirname, '.')

describe('ImageRecognitionModule', () => {
  it('module.ts 含正确导入声明', () => {
    const content = readFileSync(resolve(DIR, 'image-recognition.module.ts'), 'utf8')
    assert.ok(content.includes('ImageRecognitionService'))
    assert.ok(content.includes('ImageRecognitionController'))
    assert.ok(content.includes('Global'))
    assert.ok(content.includes('providers:'))
    assert.ok(content.includes('controllers:'))
    assert.ok(content.includes('exports:'))
  })

  it('controller.ts 路由格式正确', () => {
    const content = readFileSync(resolve(DIR, 'image-recognition.controller.ts'), 'utf8')
    assert.ok(content.includes('@Controller('))
    assert.ok(content.includes('ImageRecognitionService'))
    assert.ok(content.includes('createRecognition'))
    assert.ok(content.includes('listTasks'))
    assert.ok(content.includes('visualSearch'))
    assert.ok(content.includes('detectDuplicates'))
    assert.ok(content.includes('listEngines'))
    assert.ok(content.includes('stats'))
  })

  it('service.ts 有核心方法', () => {
    const content = readFileSync(resolve(DIR, 'image-recognition.service.ts'), 'utf8')
    assert.ok(content.includes('createRecognition'))
    assert.ok(content.includes('getRecognitionResult'))
    assert.ok(content.includes('visualSearch'))
    assert.ok(content.includes('detectDuplicates'))
    assert.ok(content.includes('listEngines'))
    assert.ok(content.includes('getRecognitionStats'))
  })

  it('entity.ts 有核心类型定义', () => {
    const content = readFileSync(resolve(DIR, 'image-recognition.entity.ts'), 'utf8')
    assert.ok(content.includes('RecognitionEngine'))
    assert.ok(content.includes('RecognitionTaskType'))
    assert.ok(content.includes('DetectedObject'))
    assert.ok(content.includes('ShelfAnalysis'))
    assert.ok(content.includes('VisualFingerprint'))
    assert.ok(content.includes('ENGINE_META'))
    assert.ok(content.includes('computePerceptualHash'))
  })

  it('dto.ts 有数据传输对象', () => {
    const content = readFileSync(resolve(DIR, 'image-recognition.dto.ts'), 'utf8')
    assert.ok(content.includes('CreateRecognitionDto'))
    assert.ok(content.includes('VisualSearchDto'))
    assert.ok(content.includes('DuplicateDetectionDto'))
    assert.ok(content.includes('ListRecognitionQuery'))
    assert.ok(content.includes('RecognitionTaskResponse'))
  })

  it('Service 可独立构造', async () => {
    const { ImageRecognitionService } = await import('./image-recognition.service')
    const service = new ImageRecognitionService()
    assert.ok(service, 'Service should be constructable')
    assert.ok(typeof service.listEngines === 'function')
    assert.ok(typeof service.countTasks === 'function')
    assert.ok(typeof service.createRecognition === 'function')
  })

  it('Service listEngines 返回 7 个引擎', () => {
    const service = new (require('./image-recognition.service').ImageRecognitionService)()
    const engines = service.listEngines()
    assert.equal(engines.length, 7)
  })
})
