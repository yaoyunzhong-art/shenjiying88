// runbook.controller.test.ts - 运维手册控制器测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { RunbookController } from './runbook.controller'
import { RunbookService } from './runbook.service'

describe('RunbookController', () => {
  let controller: RunbookController
  let service: RunbookService

  beforeEach(() => {
    service = new RunbookService()
    controller = new RunbookController(service)
  })

  describe('create', () => {
    it('应成功创建运行手册', () => {
      const result = controller.create({
        title: 'Test Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0+'],
        prerequisites: ['Test'],
        steps: [{ stepNumber: 1, title: 'Step 1', description: 'Do something' }],
        estimatedTotalMinutes: 10,
        status: 'draft',
        tags: ['test'],
      })
      expect(result.id).toBeDefined()
      expect(result.title).toBe('Test Runbook')
    })
  })

  describe('get', () => {
    it('应返回指定 ID 的 runbook', () => {
      const created = controller.create({
        title: 'Test',
        category: 'deployment',
        severity: 'low',
        applicableVersions: ['v1'],
        prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })
      const result = controller.get(created.id)
      expect(result.id).toBe(created.id)
    })

    it('不存在的 ID 应抛出 NotFoundException', () => {
      expect(() => controller.get('non-existent')).toThrow(NotFoundException)
    })
  })

  describe('list', () => {
    it('应返回所有 runbook', () => {
      controller.create({
        title: 'A', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      controller.create({
        title: 'B', category: 'scaling', severity: 'high',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const result = controller.list({})
      expect(result.length).toBeGreaterThanOrEqual(2)
    })

    it('应按分类筛选', () => {
      controller.create({
        title: 'Deploy', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const result = controller.list({ category: 'deployment' })
      expect(result.every(r => r.category === 'deployment')).toBe(true)
    })

    it('应按标签筛选', () => {
      controller.create({
        title: 'K8s Deploy', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: ['Kubernetes'],
      })
      const result = controller.list({ tag: 'Kubernetes' })
      expect(result.every(r => r.tags.includes('Kubernetes'))).toBe(true)
    })
  })

  describe('search', () => {
    it('应搜索到匹配的 runbook', () => {
      controller.create({
        title: '数据库故障恢复',
        category: '灾难恢复', severity: 'critical',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: '恢复', description: '恢复数据' }],
        estimatedTotalMinutes: 60, status: 'active', tags: ['数据库'],
      })
      const result = controller.search('数据库')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('无匹配时应返回空数组', () => {
      const result = controller.search('不存在的关键词')
      expect(result).toEqual([])
    })
  })

  describe('update', () => {
    it('应更新指定 runbook', () => {
      const created = controller.create({
        title: 'Old Title', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const updated = controller.update(created.id, { title: 'New Title' })
      expect(updated.title).toBe('New Title')
    })
  })

  describe('delete', () => {
    it('应删除指定 runbook', () => {
      const created = controller.create({
        title: 'To Delete', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const result = controller.delete(created.id)
      expect(result.success).toBe(true)
      expect(() => controller.get(created.id)).toThrow(NotFoundException)
    })
  })

  describe('alert-mapping', () => {
    it('应创建告警映射', () => {
      const created = controller.create({
        title: 'Test', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const mapping = controller.mapAlert({
        alertName: 'ALERT_cpu_high',
        runbookId: created.id,
        possibleCauses: ['流量突增'],
        severity: 'high',
        autoAction: 'scale-up',
      })
      expect(mapping.alertName).toBe('ALERT_cpu_high')
    })

    it('应通过告警名查找映射', () => {
      const created = controller.create({
        title: 'Test', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      controller.mapAlert({
        alertName: 'ALERT_db_down',
        runbookId: created.id,
        possibleCauses: ['主库故障'],
        severity: 'critical',
      })
      const found = controller.findByAlert('ALERT_db_down')
      expect(found).not.toBeNull()
      expect(found!.alertName).toBe('ALERT_db_down')
    })
  })

  describe('critical-steps', () => {
    it('应返回包含回滚或警告的关键步骤', () => {
      const created = controller.create({
        title: 'Deploy', category: 'deployment', severity: 'high',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [
          { stepNumber: 1, title: 'Normal', description: '正常步骤' },
          { stepNumber: 2, title: 'Critical', description: '关键步骤', rollbackCommand: 'helm rollback', warningMessage: '注意备份' },
        ],
        estimatedTotalMinutes: 10, status: 'active', tags: [],
      })
      const critical = controller.getCriticalSteps(created.id)
      expect(critical).toHaveLength(1)
      expect(critical[0].title).toBe('Critical')
    })
  })

  describe('validate', () => {
    it('应返回验证结果', () => {
      const created = controller.create({
        title: 'Valid Runbook', category: 'deployment', severity: 'low',
        applicableVersions: ['v1'], prerequisites: [],
        steps: [{ stepNumber: 1, title: 'S1', description: 'D1' }],
        estimatedTotalMinutes: 5, status: 'draft', tags: [],
      })
      const result = controller.validate(created.id)
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
    })
  })
})
