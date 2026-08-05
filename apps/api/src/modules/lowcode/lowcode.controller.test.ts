import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * LowcodeController 单元测试 (controller.spec)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、不存在实体、极端输入）。
 */

import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'
import { LowcodePageController } from './lowcode-page.controller'

// ── Factory helpers ──────────────────────────────────────

function createController() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new AuditAlertService()
  const controller = new LowcodePageController(pageBuilder, auditService)
  return { controller, pageBuilder, auditService }
}

// ── Suite ────────────────────────────────────────────────

describe('LowcodePageController (controller.spec)', () => {
  /* =========== 页面管理 =========== */

  describe('POST /api/lowcode/pages — createPage', () => {
    it('应该从有效模板创建页面', () => {
      const { controller } = createController()
      const result = controller.createPage({ templateId: 'tpl-dashboard', name: 'My Dashboard' })
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.name).toBe('My Dashboard')
      expect(result.templateId).toBe('tpl-dashboard')
      expect(result.status).toBe('draft')
      expect(result.components).toHaveLength(2)
    })

    it('无 name 时使用模板名', () => {
      const { controller } = createController()
      const result = controller.createPage({ templateId: 'tpl-form' })
      expect(result.name).toBe('表单')
    })

    it('不存在的模板应抛错', () => {
      const { controller } = createController()
      expect(() => controller.createPage({ templateId: 'nonexistent' })).toThrow('Template not found')
    })

    it('空字符串模板应抛错', () => {
      const { controller } = createController()
      expect(() => controller.createPage({ templateId: '' })).toThrow('Template not found')
    })
  })

  describe('GET /api/lowcode/pages/:id — getPage', () => {
    it('应返回已创建的页面', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const result = controller.getPage(created.id)
      expect(result.id).toBe(created.id)
    })

    it('不存在的页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.getPage('bad-id')).toThrow('Page not found')
    })
  })

  describe('PUT /api/lowcode/pages/:id — updatePage', () => {
    it('应更新页面名称', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const updated = controller.updatePage(created.id, { name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('status="published" 应发布页面', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const updated = controller.updatePage(created.id, { status: 'published' })
      expect(updated.status).toBe('published')
    })

    it('不存在的页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.updatePage('bad-id', { name: 'x' })).toThrow('Page not found')
    })
  })

  describe('DELETE /api/lowcode/pages/:id — removePage', () => {
    it('存在的页面应正常删除（不抛错）', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.removePage(created.id)).not.toThrow()
    })

    it('不存在的页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.removePage('bad-id')).toThrow('Page not found')
    })
  })

  describe('POST /api/lowcode/pages/:id/publish — publishPage', () => {
    it('将草稿页发布', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-dashboard' })
      const published = controller.publishPage(created.id)
      expect(published.status).toBe('published')
    })

    it('重复发布保持 published', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      controller.publishPage(created.id)
      const republished = controller.publishPage(created.id)
      expect(republished.status).toBe('published')
    })

    it('不存在页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.publishPage('bad-id')).toThrow('Page not found')
    })
  })

  describe('GET /api/lowcode/pages/:id/render — renderPage', () => {
    it('应渲染为 HTML', () => {
      const { controller } = createController()
      const created = controller.createPage({ templateId: 'tpl-blank' })
      const { html } = controller.renderPage(created.id)
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('data-component')
    })

    it('不存在的页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.renderPage('bad-id')).toThrow('Page not found')
    })
  })

  /* =========== 组件管理 =========== */

  describe('POST /api/lowcode/pages/:pageId/components — addComponent', () => {
    it('应添加组件到页面', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'button', props: { text: 'OK' } })
      expect(comp.id).toBeDefined()
      expect(comp.type).toBe('button')
      expect(comp.props).toEqual({ text: 'OK' })
    })

    it('不传 props 默认为空对象', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'input' })
      expect(comp.props).toEqual({})
    })

    it('不存在的页面应抛错', () => {
      const { controller } = createController()
      expect(() => controller.addComponent('bad-id', { type: 'button' })).toThrow('Page not found')
    })
  })

  describe('PUT /api/lowcode/pages/:pageId/components/:componentId — updateComponent', () => {
    it('应合并更新组件 props', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'button', props: { text: 'OK' } })
      const updated = controller.updateComponent(page.id, comp.id, { props: { text: 'Submit' } })
      expect(updated.props).toEqual({ text: 'Submit' })
    })

    it('不存在的组件应抛错', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.updateComponent(page.id, 'bad-comp-id', { props: {} })).toThrow('Component not found')
    })
  })

  describe('DELETE /api/lowcode/pages/:pageId/components/:componentId — removeComponent', () => {
    it('应删除组件', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      const comp = controller.addComponent(page.id, { type: 'button' })
      expect(() => controller.removeComponent(page.id, comp.id)).not.toThrow()
    })

    it('不存在的组件应抛错', () => {
      const { controller } = createController()
      const page = controller.createPage({ templateId: 'tpl-blank' })
      expect(() => controller.removeComponent(page.id, 'bad-id')).toThrow('Component not found')
    })
  })

  /* =========== 模板查询 =========== */

  describe('GET /api/lowcode/templates/:id — getTemplate', () => {
    it('应返回已注册模板', () => {
      const { controller } = createController()
      const tpl = controller.getTemplate('tpl-dashboard')
      expect(tpl).toBeDefined()
      expect(tpl!.id).toBe('tpl-dashboard')
    })

    it('不存在的模板应抛错', () => {
      const { controller } = createController()
      expect(() => controller.getTemplate('unknown')).toThrow('Template not found')
    })
  })

  /* =========== 审计指标 =========== */

  describe('POST /api/lowcode/metrics — recordMetric', () => {
    it('应记录指标并返回检查结果', () => {
      const { controller } = createController()
      const result = controller.recordMetric({ name: 'error_rate', value: 1.5, tags: { env: 'prod' } }) as Record<string, unknown>
      expect(result.recorded).toBeDefined()
      expect((result.recorded as Record<string, unknown>).name).toBe('error_rate')
      expect((result.recorded as Record<string, unknown>).value).toBe(1.5)
      expect((result.thresholdCheck as Record<string, unknown>).exceeded).toBe(false)
      expect(result.alert).toBeNull()
    })

    it('超过阈值应触发告警', () => {
      const { controller } = createController()
      const result = controller.recordMetric({ name: 'error_rate', value: 5, tags: { env: 'prod' } }) as Record<string, unknown>
      expect((result.thresholdCheck as Record<string, unknown>).exceeded).toBe(true)
      expect(result.alert).not.toBeNull()
      expect((result.alert as Record<string, unknown>).metricName).toBe('error_rate')
      expect((result.alert as Record<string, unknown>).currentValue).toBe(5)
    })

    it('不带 tags 仍可正常记录', () => {
      const { controller } = createController()
      const result = controller.recordMetric({ name: 'cpu_usage', value: 90 }) as Record<string, unknown>
      expect((result.recorded as Record<string, unknown>).tags).toEqual({})
    })
  })

  describe('GET /api/lowcode/metrics/:name/trend — getMetricTrend', () => {
    it('应返回时间窗口内的趋势', () => {
      const { controller } = createController()
      controller.recordMetric({ name: 'cpu_usage', value: 50 })
      controller.recordMetric({ name: 'cpu_usage', value: 60 })
      const trend = controller.getMetricTrend('cpu_usage', { window: '1h' })
      expect(trend.metricName).toBe('cpu_usage')
      expect(trend.dataPoints.length).toBe(2)
      expect(trend.window).toBe('1h')
    })

    it('无数据返回空数组', () => {
      const { controller } = createController()
      const trend = controller.getMetricTrend('never_recorded', { window: '1h' })
      expect(trend.dataPoints).toEqual([])
    })

    it('默认 window 为 1h', () => {
      const { controller } = createController()
      const trend = controller.getMetricTrend('cpu_usage', {})
      expect(trend.window).toBe('1h')
    })
  })

  describe('GET /api/lowcode/alerts — getAlertHistory', () => {
    it('应返回所有告警', () => {
      const { controller } = createController()
      controller.recordMetric({ name: 'error_rate', value: 10 })
      controller.recordMetric({ name: 'latency_p99', value: 1000 })
      const alerts = controller.getAlertHistory({})
      expect(alerts.length).toBe(2)
    })

    it('应按指标名称过滤', () => {
      const { controller } = createController()
      controller.recordMetric({ name: 'error_rate', value: 10 })
      controller.recordMetric({ name: 'latency_p99', value: 1000 })
      const alerts = controller.getAlertHistory({ metricName: 'error_rate' })
      expect(alerts.length).toBe(1)
      expect(alerts[0].metricName).toBe('error_rate')
    })

    it('无告警返回空数组', () => {
      const { controller } = createController()
      const alerts = controller.getAlertHistory({})
      expect(alerts).toEqual([])
    })
  })
})
