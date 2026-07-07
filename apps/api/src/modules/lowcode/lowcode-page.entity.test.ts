/**
 * lowcode-page.entity.test.ts
 * 低代码页面实体定义测试
 */

import { describe, it, expect } from 'vitest'
import { LowcodePage, LowcodeAuditMetric } from './lowcode-page.entity'

describe('LowcodePage Entity', () => {
  it('should be defined', () => {
    const page = new LowcodePage()
    expect(page).toBeDefined()
  })

  it('should have correct default values', () => {
    const page = new LowcodePage()
    // TypeORM column defaults
    expect(page.status).toBeUndefined() // default is set at DB/column level
    expect(page.components).toBeUndefined()
  })

  it('should accept field values', () => {
    const page = new LowcodePage()
    page.id = 'test-id'
    page.name = 'Test Page'
    page.templateId = 'tpl-dashboard'
    page.status = 'draft'
    page.components = [{ type: 'button', props: { text: 'Click' } }]
    page.createdBy = 'user-1'
    page.createdAt = new Date()
    page.updatedAt = new Date()

    expect(page.id).toBe('test-id')
    expect(page.name).toBe('Test Page')
    expect(page.templateId).toBe('tpl-dashboard')
    expect(page.status).toBe('draft')
    expect(page.components).toHaveLength(1)
    expect(page.createdBy).toBe('user-1')
  })
})

describe('LowcodeAuditMetric Entity', () => {
  it('should be defined', () => {
    const metric = new LowcodeAuditMetric()
    expect(metric).toBeDefined()
  })

  it('should accept field values', () => {
    const metric = new LowcodeAuditMetric()
    metric.id = 'metric-1'
    metric.name = 'error_rate'
    metric.value = 5.5
    metric.tags = { service: 'api' }
    metric.timestamp = new Date()

    expect(metric.name).toBe('error_rate')
    expect(metric.value).toBe(5.5)
    expect(metric.tags.service).toBe('api')
  })
})
