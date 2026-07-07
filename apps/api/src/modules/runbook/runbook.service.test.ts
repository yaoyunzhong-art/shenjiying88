import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { RunbookService } from './runbook.service'

describe('RunbookService', () => {
  let service: RunbookService

  beforeEach(() => {
    service = new RunbookService()
  })

  describe('create', () => {
    it('should create a new runbook', () => {
      const runbook = service.create({
        title: 'Test Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0+'],
        prerequisites: ['Server prepared'],
        steps: [
          {
            stepNumber: 1,
            title: 'Test Step',
            description: 'Test description',
            command: 'echo test',
          },
        ],
        estimatedTotalMinutes: 10,
        tags: ['test'],
        status: 'draft',
      })
      expect(runbook.id).toBeDefined()
      expect(runbook.title).toBe('Test Runbook')
    })
  })

  describe('get', () => {
    it('should return runbook by id', () => {
      const created = service.create({
        title: 'Test Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0+'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 10,
        tags: [],
        status: 'draft',
      })
      const found = service.get(created.id)
      expect(found?.title).toBe('Test Runbook')
    })

    it('should return null for non-existent runbook', () => {
      const found = service.get('nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('list', () => {
    it('should list all runbooks', () => {
      const runbooks = service.list()
      expect(runbooks.length).toBeGreaterThan(0)
    })

    it('should filter by category', () => {
      const runbooks = service.list({ category: 'deployment' })
      expect(runbooks.every(r => r.category === 'deployment')).toBe(true)
    })

    it('should filter by severity', () => {
      const runbooks = service.list({ severity: 'critical' })
      expect(runbooks.every(r => r.severity === 'critical')).toBe(true)
    })
  })

  describe('update', () => {
    it('should update runbook', () => {
      const runbook = service.create({
        title: 'Original Title',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0+'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 10,
        tags: [],
        status: 'draft',
      })
      const updated = service.update(runbook.id, { title: 'Updated Title' })
      expect(updated.title).toBe('Updated Title')
    })
  })

  describe('delete', () => {
    it('should delete runbook', () => {
      const runbook = service.create({
        title: 'To Delete',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0+'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 10,
        tags: [],
        status: 'draft',
      })
      service.delete(runbook.id)
      expect(service.get(runbook.id)).toBeNull()
    })
  })

  describe('mapAlert', () => {
    it('should map alert to runbook', () => {
      const mapping = service.mapAlert('ALERT_test', 'deploy-api-single', ['High CPU'], 'high')
      expect(mapping.alertName).toBe('ALERT_test')
    })
  })

  describe('findByAlert', () => {
    it('should find runbook by alert', () => {
      service.mapAlert('ALERT_test', 'deploy-api-single', ['High CPU'], 'high')
      const found = service.findByAlert('ALERT_test')
      expect(found?.alertName).toBe('ALERT_test')
    })
  })

  describe('generateExecutionReport', () => {
    it('should generate execution report', () => {
      const report = service.generateExecutionReport('deploy-api-single', [
        {
          step: 1,
          startedAt: new Date(),
          completedAt: new Date(),
          success: true,
          output: 'Success',
        },
      ])
      expect(report).toContain('Runbook 执行报告')
    })
  })

  describe('getCriticalSteps', () => {
    it('should return critical steps', () => {
      const steps = service.getCriticalSteps('deploy-api-single')
      expect(Array.isArray(steps)).toBe(true)
    })
  })

  describe('validate', () => {
    it('should validate runbook', () => {
      const result = service.validate('deploy-api-single')
      expect(result.valid).toBe(true)
    })

    it('should return errors for non-existent runbook', () => {
      const result = service.validate('nonexistent')
      expect(result.valid).toBe(false)
    })
  })

  describe('search', () => {
    it('should search runbooks by keyword', () => {
      const results = service.search('部署')
      expect(results.length).toBeGreaterThan(0)
    })
  })
})
