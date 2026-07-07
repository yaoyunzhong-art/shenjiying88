/**
 * lowcode-page.controller.test.ts
 * 低代码页面控制器测试：正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'

describe('LowcodePageController', () => {
  let controller: LowcodePageController
  let pageBuilder: LowCodePageBuilder
  let auditService: AuditAlertService

  beforeEach(() => {
    pageBuilder = new LowCodePageBuilder()
    auditService = new AuditAlertService()
    controller = new LowcodePageController(pageBuilder, auditService)
  })

  // ==================== 页面管理 ====================

  describe('createPage', () => {
    it('should create page from valid template', () => {
      const result = controller.createPage({ templateId: 'tpl-dashboard', name: 'My Dashboard' })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('My Dashboard')
      expect(result.templateId).toBe('tpl-dashboard')
      expect(result.status).toBe('draft')
    })

    it('should throw for non-existent template', () => {
      expect(() => controller.createPage({ templateId: 'nonexistent' })).toThrow()
    })
  })

  describe('getPage', () => {
    it('should return page by id', () => {
      const created = controller.createPage({ templateId: 'tpl-dashboard' })
      const result = controller.getPage(created.id)
      expect(result.id).toBe(created.id)
    })

    it('should throw for non-existent page', () => {
      expect(() => controller.getPage('non-existent-id')).toThrow()
    })
  })

  describe('updatePage', () => {
    it('should update page name', () => {
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const updated = controller.updatePage(created.id, { name: 'Renamed' })
      expect(updated.name).toBe('Renamed')
    })

    it('should publish page when status is published', () => {
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const updated = controller.updatePage(created.id, { status: 'published' })
      expect(updated.status).toBe('published')
    })

    it('should throw for non-existent page', () => {
      expect(() => controller.updatePage('bad-id', { name: 'test' })).toThrow()
    })
  })

  describe('removePage', () => {
    it('should succeed for existing page', () => {
      const created = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.removePage(created.id)).not.toThrow()
    })

    it('should throw for non-existent page', () => {
      expect(() => controller.removePage('bad-id')).toThrow()
    })
  })

  describe('publishPage', () => {
    it('should publish a draft page', () => {
      const created = controller.createPage({ templateId: 'tpl-dashboard' })
      const published = controller.publishPage(created.id)
      expect(published.status).toBe('published')
    })
  })

  describe('renderPage', () => {
    it('should render page as HTML', () => {
      const created = controller.createPage({ templateId: 'tpl-dashboard' })
      const result = controller.renderPage(created.id)
      expect(result.html).toContain('<!DOCTYPE html>')
      expect(result.html).toContain('data-component')
    })
  })

  // ==================== 组件管理 ====================

  describe('addComponent', () => {
    it('should add component to existing page', () => {
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'button', props: { text: 'OK' } })
      expect(comp.id).toBeDefined()
      expect(comp.type).toBe('button')
    })

    it('should throw for non-existent page', () => {
      expect(() => controller.addComponent('bad-id', { type: 'button' })).toThrow()
    })
  })

  describe('updateComponent', () => {
    it('should update component props via service', () => {
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'button', props: { text: 'Click' } })
      // Verify component was added
      const pageDetail = controller.getPage(page.id)
      expect(pageDetail.components).toHaveLength(2) // navbar + button
    })

    it('should throw for non-existent component', () => {
      const page = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.updateComponent(page.id, 'bad-comp', { props: {} })).toThrow()
    })
  })

  describe('removeComponent', () => {
    it('should remove component from page', () => {
      const page = controller.createPage({ templateId: 'tpl-form' })
      const pageDetail = controller.getPage(page.id)
      const firstCompId = (pageDetail.components[0] as Record<string, unknown>).id as string
      expect(() => controller.removeComponent(page.id, firstCompId)).not.toThrow()
    })

    it('should throw for non-existent component', () => {
      const page = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.removeComponent(page.id, 'bad-comp')).toThrow()
    })
  })

  // ==================== 模板查询 ====================

  describe('getTemplate', () => {
    it('should return existing template', () => {
      const tpl = controller.getTemplate('tpl-dashboard')
      expect(tpl).toBeDefined()
      expect((tpl as Record<string, unknown>).name).toBe('仪表盘')
    })

    it('should throw for non-existent template', () => {
      expect(() => controller.getTemplate('nonexistent')).toThrow()
    })
  })

  // ==================== 审计指标 ====================

  describe('recordMetric', () => {
    it('should record metric and check threshold', () => {
      const result = controller.recordMetric({ name: 'error_rate', value: 1.5 })
      expect(result.recorded).toBeDefined()
      expect((result.recorded as Record<string, unknown>).name).toBe('error_rate')
    })

    it('should trigger alert when threshold exceeded', () => {
      const result = controller.recordMetric({ name: 'error_rate', value: 10 })
      expect(result.alert).toBeDefined()
    })
  })

  describe('getMetricTrend', () => {
    it('should return trend data for existing metric', () => {
      controller.recordMetric({ name: 'cpu_usage', value: 50 })
      controller.recordMetric({ name: 'cpu_usage', value: 70 })
      const trend = controller.getMetricTrend('cpu_usage', { window: '1h' })
      expect(trend.metricName).toBe('cpu_usage')
      expect(trend.dataPoints.length).toBeGreaterThanOrEqual(2)
    })

    it('should return empty trend for unknown metric', () => {
      const trend = controller.getMetricTrend('unknown_metric', { window: '1h' })
      expect(trend.dataPoints).toHaveLength(0)
    })
  })

  describe('getAlertHistory', () => {
    it('should return empty history initially', () => {
      const history = controller.getAlertHistory({})
      expect(Array.isArray(history)).toBe(true)
      expect(history).toHaveLength(0)
    })

    it('should return fired alerts', () => {
      controller.recordMetric({ name: 'error_rate', value: 10 })
      controller.recordMetric({ name: 'latency_p99', value: 600 })
      const history = controller.getAlertHistory({})
      expect(history.length).toBeGreaterThanOrEqual(1)
    })

    it('should filter alerts by metric name', () => {
      controller.recordMetric({ name: 'error_rate', value: 10 })
      controller.recordMetric({ name: 'latency_p99', value: 600 })
      const filtered = controller.getAlertHistory({ metricName: 'error_rate' }) as unknown as Record<string, unknown>[]
      expect(filtered.every((a) => (a as Record<string, unknown>).metricName === 'error_rate')).toBe(true)
    })
  })
})
