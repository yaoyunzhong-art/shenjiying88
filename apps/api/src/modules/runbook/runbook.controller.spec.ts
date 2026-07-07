/**
 * runbook.controller.spec.ts
 *
 * RunbookController 全路由 spec —— 覆盖全部 10 个端点 (正例+反例+边界+路由元数据)
 * 
 * D-Controller spec 补全类型
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { RunbookController } from './runbook.controller'
import type { Runbook, AlertMapping } from './runbook.entity'

describe('RunbookController', () => {
  // ── mock service 工厂 ──
  function createMockService() {
    const store = new Map<string, Runbook>()
    const alertStore = new Map<string, AlertMapping>()
    let nextId = 1

    return {
      create: (dto: any) => {
        const id = `rb-${String(nextId++).padStart(3, '0')}`
        const now = new Date()
        const runbook: Runbook = {
          id,
          title: dto.title,
          category: dto.category,
          severity: dto.severity,
          applicableVersions: dto.applicableVersions || [],
          prerequisites: dto.prerequisites || [],
          steps: dto.steps || [],
          estimatedTotalMinutes: dto.estimatedTotalMinutes || 10,
          relatedAlerts: dto.relatedAlerts,
          relatedRunbooks: dto.relatedRunbooks,
          status: dto.status || 'draft',
          tags: dto.tags || [],
          createdAt: now,
          updatedAt: now,
        }
        store.set(id, runbook)
        return runbook
      },
      get: (id: string) => store.get(id) ?? null,
      list: (filter?: any) => {
        let result = Array.from(store.values())
        if (filter?.category) result = result.filter(r => r.category === filter.category)
        if (filter?.severity) result = result.filter(r => r.severity === filter.severity)
        if (filter?.status) result = result.filter(r => r.status === filter.status)
        if (filter?.tag) result = result.filter(r => r.tags.includes(filter.tag))
        return result
      },
      search: (keyword: string) => {
        if (!keyword) return []
        const lower = keyword.toLowerCase()
        return Array.from(store.values()).filter(r =>
          r.title.toLowerCase().includes(lower) ||
          r.tags.some(t => t.toLowerCase().includes(lower))
        )
      },
      update: (id: string, dto: any) => {
        const existing = store.get(id)
        if (!existing) throw new Error(`Runbook not found: ${id}`)
        const updated = { ...existing, ...dto, id, createdAt: existing.createdAt, updatedAt: new Date() }
        store.set(id, updated)
        return updated
      },
      delete: (id: string) => {
        if (!store.has(id)) throw new Error(`Runbook not found: ${id}`)
        store.delete(id)
      },
      mapAlert: (alertName: string, runbookId: string, possibleCauses: string[], severity: string, autoAction?: string) => {
        const mapping: AlertMapping = { alertName, runbookId, possibleCauses, severity: severity as any, autoAction }
        alertStore.set(alertName, mapping)
        return mapping
      },
      findByAlert: (alertName: string) => alertStore.get(alertName) ?? null,
      getCriticalSteps: (runbookId: string) => {
        const runbook = store.get(runbookId)
        if (!runbook) throw new Error(`Runbook not found: ${runbookId}`)
        return runbook.steps.filter(s => s.rollbackCommand || s.warningMessage)
      },
      validate: (runbookId: string) => {
        const runbook = store.get(runbookId)
        const errors: string[] = []
        const warnings: string[] = []
        if (!runbook) {
          errors.push(`Runbook not found: ${runbookId}`)
          return { valid: false, errors, warnings }
        }
        if (!runbook.title) errors.push('标题不能为空')
        if (runbook.steps.length === 0) errors.push('必须包含至少一个步骤')
        if (!runbook.lastTestedAt) warnings.push('尚未测试过')
        return { valid: errors.length === 0, errors, warnings }
      },
    }
  }

  const makeCreateDto = (overrides: any = {}) => ({
    title: '部署 API 服务',
    category: 'deployment' as const,
    severity: 'high' as const,
    applicableVersions: ['v2.0.0+'],
    prerequisites: ['Docker 已安装'],
    steps: [{ stepNumber: 1, title: '环境检查', description: '检查服务器' }],
    estimatedTotalMinutes: 20,
    status: 'draft' as const,
    tags: ['部署', 'API'],
    ...overrides,
  })

  describe('路由注册与模块元数据', () => {
    it('Controller 有正确的路由前缀', () => {
      const path = Reflect.getMetadata('path', RunbookController)
      expect(path).toBe('runbook')
    })

    it('ValidationPipe 已在 Controller 级别注册', () => {
      const pipes = Reflect.getMetadata('__pipes__', RunbookController)
      expect(pipes).toBeDefined()
      expect(pipes.length).toBeGreaterThan(0)
    })
  })

  describe('POST /runbook — create', () => {
    it('正例: 创建 Runbook 返回完整对象', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.create(makeCreateDto())

      expect(result.id).toBeDefined()
      expect(result.title).toBe('部署 API 服务')
      expect(result.category).toBe('deployment')
      expect(result.severity).toBe('high')
      expect(result.status).toBe('draft')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.steps).toHaveLength(1)
    })

    it('正例: 创建带有 steps 数组的 Runbook', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.create(
        makeCreateDto({
          steps: [
            { stepNumber: 1, title: '步骤1', description: '第一步' },
            { stepNumber: 2, title: '步骤2', description: '第二步', command: 'kubectl get pods' },
          ],
        })
      )

      expect(result.steps).toHaveLength(2)
      expect(result.steps[0].stepNumber).toBe(1)
      expect(result.steps[1].command).toBe('kubectl get pods')
    })

    it('边界: 服务异常传播', () => {
      const svc = createMockService()
      svc.create = () => { throw new Error('内部服务错误') }
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.create(makeCreateDto())).toThrow('内部服务错误')
    })
  })

  describe('GET /runbook — list', () => {
    it('正例: 无参数返回所有 Runbook', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: '部署A' }))
      ctrl.create(makeCreateDto({ title: '部署B' }))

      const result = ctrl.list({})
      expect(result.length).toBe(2)
    })

    it('正例: 按 category 筛选', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: '部署服务', category: 'deployment' }))
      ctrl.create(makeCreateDto({ title: '故障排查', category: '故障排查' }))
      ctrl.create(makeCreateDto({ title: '扩容', category: 'scaling' }))

      const result = ctrl.list({ category: 'deployment' })
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('deployment')
    })

    it('正例: 按 severity 筛选', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: '严重故障', severity: 'critical' }))
      ctrl.create(makeCreateDto({ title: '普通告警', severity: 'low' }))

      const result = ctrl.list({ severity: 'critical' })
      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe('critical')
    })

    it('正例: 按 tag 筛选', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: 'K8s 部署', tags: ['Kubernetes', '部署'] }))
      ctrl.create(makeCreateDto({ title: 'DNS 配置', tags: ['网络'] }))

      const result = ctrl.list({ tag: 'Kubernetes' })
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('K8s 部署')
    })

    it('反例: 无匹配筛选条件返回空数组', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto())
      const result = ctrl.list({ tag: '不存在的标签' })
      expect(result).toEqual([])
    })

    it('边界: 空数据库时返回空数组', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.list({})
      expect(result).toEqual([])
    })
  })

  describe('GET /runbook/search — search', () => {
    it('正例: 按标题搜索', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: '数据库故障恢复' }))
      ctrl.create(makeCreateDto({ title: '前端部署' }))

      const result = ctrl.search('数据库')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('数据库故障恢复')
    })

    it('正例: 按标签搜索', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: 'K8s 扩容', tags: ['Kubernetes', '扩容'] }))

      const result = ctrl.search('Kubernetes')
      expect(result).toHaveLength(1)
    })

    it('正例: 大小写不敏感搜索', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto({ title: 'Database Recovery' }))

      const result = ctrl.search('database')
      expect(result).toHaveLength(1)
    })

    it('反例: 空关键词返回空数组', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      ctrl.create(makeCreateDto())
      const result = ctrl.search('')
      expect(result).toEqual([])
    })

    it('反例: 无匹配返回空数组', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.search('不存在的关键词')
      expect(result).toEqual([])
    })
  })

  describe('GET /runbook/:id — get', () => {
    it('正例: 按 ID 查询返回 Runbook', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const result = ctrl.get(created.id)
      expect(result.id).toBe(created.id)
      expect(result.title).toBe('部署 API 服务')
    })

    it('反例: 不存在的 ID 抛出 NotFoundException', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.get('non-existent')).toThrow(NotFoundException)
    })

    it('反例: 空的 ID 处理', () => {
      const svc = createMockService()
      svc.get = (id: string) => id === '' ? null : { id, title: 'ok' }
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.get('')).toThrow(NotFoundException)
    })
  })

  describe('PUT /runbook/:id — update', () => {
    it('正例: 更新标题', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const updated = ctrl.update(created.id, { title: '新标题' })
      expect(updated.title).toBe('新标题')
      expect(updated.severity).toBe('high') // 保持其他字段
    })

    it('正例: 更新 severity 和 status', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto({ status: 'draft' }))
      const updated = ctrl.update(created.id, { severity: 'critical', status: 'active' })
      expect(updated.severity).toBe('critical')
      expect(updated.status).toBe('active')
    })

    it('反例: 更新不存在的 Runbook 抛异常', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.update('non-existent', { title: 'xxx' })).toThrow()
    })

    it('边界: 空更新对象不改变数据', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto({ title: '原标题' }))
      const updated = ctrl.update(created.id, {})
      expect(updated.title).toBe('原标题')
    })
  })

  describe('DELETE /runbook/:id — delete', () => {
    it('正例: 删除成功返回 { success: true }', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const result = ctrl.delete(created.id)
      expect(result.success).toBe(true)

      // 确认已删除
      expect(() => ctrl.get(created.id)).toThrow(NotFoundException)
    })

    it('反例: 删除不存在的 Runbook 抛异常', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.delete('non-existent')).toThrow()
    })

    it('边界: 重复删除已删除的对象抛异常', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      ctrl.delete(created.id)
      expect(() => ctrl.delete(created.id)).toThrow()
    })
  })

  describe('POST /runbook/alert-mapping — mapAlert', () => {
    it('正例: 创建告警映射', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const mapping = ctrl.mapAlert({
        alertName: 'ALERT_cpu_high',
        runbookId: created.id,
        possibleCauses: ['流量突增', '内存泄漏'],
        severity: 'high',
        autoAction: 'scale-up',
      })

      expect(mapping.alertName).toBe('ALERT_cpu_high')
      expect(mapping.runbookId).toBe(created.id)
      expect(mapping.possibleCauses).toHaveLength(2)
      expect(mapping.autoAction).toBe('scale-up')
    })

    it('正例: 创建不含 autoAction 的告警映射', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const mapping = ctrl.mapAlert({
        alertName: 'ALERT_memory_high',
        runbookId: created.id,
        possibleCauses: ['内存泄漏'],
        severity: 'medium',
      })

      expect(mapping.alertName).toBe('ALERT_memory_high')
      expect(mapping.autoAction).toBeUndefined()
    })
  })

  describe('GET /runbook/alert-mapping/:alertName — findByAlert', () => {
    it('正例: 按告警名称查找', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      ctrl.mapAlert({
        alertName: 'ALERT_db_down',
        runbookId: created.id,
        possibleCauses: ['主库故障'],
        severity: 'critical',
      })

      const found = ctrl.findByAlert('ALERT_db_down')
      expect(found).not.toBeNull()
      expect(found!.alertName).toBe('ALERT_db_down')
      expect(found!.severity).toBe('critical')
    })

    it('反例: 不存在的告警返回 null', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.findByAlert('ALERT_nonexistent')
      expect(result).toBeNull()
    })

    it('反例: 空 alertName 返回 null', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.findByAlert('')
      expect(result).toBeNull()
    })
  })

  describe('GET /runbook/:id/critical-steps — getCriticalSteps', () => {
    it('正例: 返回包含回滚或警告的关键步骤', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(
        makeCreateDto({
          steps: [
            { stepNumber: 1, title: '正常步骤', description: '普通操作' },
            { stepNumber: 2, title: '关键步骤', description: '危险操作', rollbackCommand: 'helm rollback', warningMessage: '注意备份' },
            { stepNumber: 3, title: '回滚步骤', description: '可以回滚', rollbackCommand: 'kubectl rollout undo' },
          ],
        })
      )

      const critical = ctrl.getCriticalSteps(created.id)
      expect(critical).toHaveLength(2)
      expect(critical[0].title).toBe('关键步骤')
      expect(critical[1].title).toBe('回滚步骤')
    })

    it('正例: 没有关键步骤返回空数组', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const critical = ctrl.getCriticalSteps(created.id)
      expect(critical).toEqual([])
    })

    it('反例: 不存在的 Runbook 抛异常', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      expect(() => ctrl.getCriticalSteps('non-existent')).toThrow()
    })
  })

  describe('GET /runbook/:id/validate — validate', () => {
    it('正例: 有效 Runbook 返回 valid=true', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const result = ctrl.validate(created.id)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('正例: 验证结果包含 warnings', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const created = ctrl.create(makeCreateDto())
      const result = ctrl.validate(created.id)
      expect(result.warnings).toBeDefined()
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('反例: 不存在的 Runbook 返回 valid=false', () => {
      const svc = createMockService()
      const ctrl = new RunbookController(svc)

      const result = ctrl.validate('non-existent')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
