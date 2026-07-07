import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

describe('LowCodeAuditService', () => {
  let pageBuilder: LowCodePageBuilder
  let auditService: AuditAlertService

  beforeEach(() => {
    pageBuilder = new LowCodePageBuilder()
    auditService = new AuditAlertService()
  })

  describe('LowCodePageBuilder', () => {
    describe('createPage', () => {
      it('should create page from template', () => {
        const page = pageBuilder.createPage('tpl-dashboard', { name: 'My Dashboard' })
        expect(page.id).toBeDefined()
        expect(page.templateId).toBe('tpl-dashboard')
        expect(page.name).toBe('My Dashboard')
        expect(page.components.length).toBeGreaterThan(0)
      })

      it('should throw error for non-existent template', () => {
        expect(() => pageBuilder.createPage('nonexistent')).toThrow()
      })
    })

    describe('addComponent', () => {
      it('should add component to page', () => {
        const page = pageBuilder.createPage('tpl-blank')
        const component = pageBuilder.addComponent(page.id, { type: 'button', props: { text: 'Click me' } })
        expect(component.type).toBe('button')
      })

      it('should throw error for non-existent page', () => {
        expect(() => pageBuilder.addComponent('nonexistent', { type: 'button', props: {} })).toThrow()
      })
    })

    describe('updateComponent', () => {
      it('should update component props', () => {
        const page = pageBuilder.createPage('tpl-form')
        const component = page.components[0]
        const updated = pageBuilder.updateComponent(page.id, component.id, { label: 'Updated' })
        expect(updated.props.label).toBe('Updated')
      })
    })

    describe('removeComponent', () => {
      it('should remove component from page', () => {
        const page = pageBuilder.createPage('tpl-form')
        const component = page.components[0]
        const result = pageBuilder.removeComponent(page.id, component.id)
        expect(result).toBe(true)
      })
    })

    describe('publishPage', () => {
      it('should publish page', () => {
        const page = pageBuilder.createPage('tpl-dashboard')
        const published = pageBuilder.publishPage(page.id)
        expect(published.status).toBe('published')
      })
    })

    describe('renderPage', () => {
      it('should render page as HTML', () => {
        const page = pageBuilder.createPage('tpl-dashboard')
        const html = pageBuilder.renderPage(page.id)
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('data-component')
      })
    })
  })

  describe('AuditAlertService', () => {
    describe('recordMetric', () => {
      it('should record a metric', () => {
        const record = auditService.recordMetric('error_rate', 5.5)
        expect(record.name).toBe('error_rate')
        expect(record.value).toBe(5.5)
      })
    })

    describe('checkThresholds', () => {
      it('should return exceeded status', () => {
        auditService.recordMetric('error_rate', 10)
        const result = auditService.checkThresholds('error_rate')
        expect(result.exceeded).toBe(true)
      })
    })

    describe('fireAlertIfExceeded', () => {
      it('should fire alert when threshold exceeded', () => {
        const alert = auditService.fireAlertIfExceeded('error_rate', 10)
        expect(alert).toBeDefined()
        expect(alert?.currentValue).toBe(10)
      })

      it('should return null when threshold not exceeded', () => {
        const alert = auditService.fireAlertIfExceeded('error_rate', 1)
        expect(alert).toBeNull()
      })
    })

    describe('getAlertHistory', () => {
      it('should return alert history', () => {
        auditService.fireAlertIfExceeded('error_rate', 10)
        const history = auditService.getAlertHistory()
        expect(history.length).toBeGreaterThan(0)
      })

      it('should filter by metric name', () => {
        auditService.fireAlertIfExceeded('error_rate', 10)
        auditService.fireAlertIfExceeded('latency_p99', 600)
        const history = auditService.getAlertHistory({ metricName: 'error_rate' })
        expect(history.every(a => a.metricName === 'error_rate')).toBe(true)
      })
    })

    describe('getMetricTrend', () => {
      it('should return metric trend', () => {
        auditService.recordMetric('error_rate', 5)
        const trend = auditService.getMetricTrend('error_rate', '1h')
        expect(trend.metricName).toBe('error_rate')
      })
    })
  })
})
