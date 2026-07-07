/**
 * lowcode.controller.test.ts
 * 低代码聚合控制器测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LowcodeController } from './lowcode.controller'
import { LowcodeService } from './lowcode.service'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

function createController() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new AuditAlertService()
  const service = new LowcodeService(pageBuilder, auditService)
  const controller = new LowcodeController(service, pageBuilder)
  return { controller, service, pageBuilder }
}

describe('LowcodeController', () => {
  let ctx: ReturnType<typeof createController>

  beforeEach(() => {
    ctx = createController()
  })

  // ─── Template CRUD ────────────────────────────

  describe('POST /api/lowcode/admin/templates — createTemplate', () => {
    it('应创建模板', () => {
      const result = ctx.controller.createTemplate({
        name: 'Test Template',
        components: [{ type: 'navbar', defaultProps: { title: 'Test' } }],
      })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Test Template')
      expect(result.status).toBe('active')
      expect((result.components as Array<unknown>).length).toBe(1)
    })

    it('description 可选', () => {
      const result = ctx.controller.createTemplate({
        name: 'No Desc',
        components: [],
      })
      expect(result.description).toBeUndefined()
    })
  })

  describe('GET /api/lowcode/admin/templates — listTemplates', () => {
    it('应返回空列表当无模板', () => {
      const result = ctx.controller.listTemplates()
      expect(result).toEqual([])
    })

    it('应返回所有模板', () => {
      ctx.controller.createTemplate({ name: 'T1', components: [] })
      ctx.controller.createTemplate({ name: 'T2', components: [] })
      const result = ctx.controller.listTemplates()
      expect(result).toHaveLength(2)
    })
  })

  describe('GET /api/lowcode/admin/templates/:id — getTemplate', () => {
    it('应返回指定模板', () => {
      const created = ctx.controller.createTemplate({ name: 'GetMe', components: [{ type: 'navbar', defaultProps: {} }] })
      const result = ctx.controller.getTemplate(created.id as string)
      expect(result.name).toBe('GetMe')
    })

    it('不存在的模板应抛出', () => {
      expect(() => ctx.controller.getTemplate('bad-id')).toThrow('Template not found')
    })
  })

  describe('PUT /api/lowcode/admin/templates/:id — updateTemplate', () => {
    it('应更新模板名称', () => {
      const created = ctx.controller.createTemplate({ name: 'OldName', components: [] })
      const result = ctx.controller.updateTemplate(created.id as string, { name: 'NewName' })
      expect(result.name).toBe('NewName')
    })

    it('不存在的模板应抛出', () => {
      expect(() => ctx.controller.updateTemplate('bad-id', { name: 'X' })).toThrow('Template not found')
    })
  })

  describe('DELETE /api/lowcode/admin/templates/:id — deleteTemplate', () => {
    it('存在的模板应正常删除', () => {
      const created = ctx.controller.createTemplate({ name: 'ToDelete', components: [] })
      expect(() => ctx.controller.deleteTemplate(created.id as string)).not.toThrow()
    })

    it('不存在的模板应抛出', () => {
      expect(() => ctx.controller.deleteTemplate('bad-id')).toThrow('Template not found')
    })
  })

  // ─── Snapshot ─────────────────────────────────

  describe('POST /api/lowcode/admin/snapshots — createSnapshot', () => {
    it('应创建快照', () => {
      const page = ctx.pageBuilder.createPage('tpl-blank', { name: 'Snap Page' })
      const result = ctx.controller.createSnapshot({ pageId: page.id, changelog: 'v1', publishedBy: 'admin' })
      expect(result.id).toBeDefined()
      expect(result.pageId).toBe(page.id)
      expect(result.version).toBe(1)
      expect(result.changelog).toBe('v1')
    })

    it('不存在的页面应抛出', () => {
      expect(() => ctx.controller.createSnapshot({ pageId: 'bad-id' })).toThrow('Page not found')
    })
  })

  describe('GET /api/lowcode/admin/snapshots/:pageId — listSnapshots', () => {
    it('应返回页面快照列表', () => {
      const page = ctx.pageBuilder.createPage('tpl-blank')
      ctx.controller.createSnapshot({ pageId: page.id })
      const result = ctx.controller.listSnapshots(page.id)
      expect(result).toHaveLength(1)
    })

    it('无快照返回空数组', () => {
      const result = ctx.controller.listSnapshots('no-snaps')
      expect(result).toEqual([])
    })
  })

  // ─── Component Library ────────────────────────

  describe('POST /api/lowcode/admin/components — registerComponent', () => {
    it('应注册组件到组件库', () => {
      const result = ctx.controller.registerComponent({ name: 'MyBtn', type: 'button', defaultProps: { text: 'OK' } })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('MyBtn')
      expect(result.type).toBe('button')
    })
  })

  describe('GET /api/lowcode/admin/components — listComponents', () => {
    it('应返回组件库列表', () => {
      ctx.controller.registerComponent({ name: 'Btn', type: 'button' })
      const result = ctx.controller.listComponents()
      expect(result).toHaveLength(1)
    })

    it('空库返回空数组', () => {
      expect(ctx.controller.listComponents()).toEqual([])
    })
  })

  // ─── Page Export / Import ─────────────────────

  describe('GET /api/lowcode/admin/pages/:id/export — exportPage', () => {
    it('应导出页面', () => {
      const page = ctx.pageBuilder.createPage('tpl-dashboard', { name: 'Export' })
      const result = ctx.controller.exportPage(page.id)
      expect(result.templateId).toBe('tpl-dashboard')
      expect(result.name).toBe('Export')
    })

    it('不存在的页面应抛出', () => {
      expect(() => ctx.controller.exportPage('bad-id')).toThrow('Page not found')
    })
  })

  describe('POST /api/lowcode/admin/pages/import — importPage', () => {
    it('应导入页面', () => {
      const result = ctx.controller.importPage({
        data: { templateId: 'tpl-blank', name: 'Imported', components: [], status: 'draft', version: 1 },
      })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Imported')
    })

    it('应支持重命名导入', () => {
      const result = ctx.controller.importPage({
        data: { templateId: 'tpl-blank', name: 'Original', components: [], status: 'draft', version: 1 },
        name: 'Renamed',
      })
      expect(result.name).toBe('Renamed')
    })
  })

  // ─── Dashboard ────────────────────────────────

  describe('GET /api/lowcode/admin/dashboard — getDashboardStats', () => {
    it('应返回统计', () => {
      const result = ctx.controller.getDashboardStats()
      expect(result.totalPages).toBe(0)
      expect(result.totalTemplates).toBe(0)
      expect(result.totalComponents).toBe(0)
    })

    it('有数据时统计应反映', () => {
      ctx.pageBuilder.createPage('tpl-blank')
      ctx.controller.createTemplate({ name: 'T', components: [] })
      ctx.controller.registerComponent({ name: 'C', type: 'chart' })
      const result = ctx.controller.getDashboardStats()
      expect(result.totalPages).toBe(1)
      expect(result.totalTemplates).toBe(1)
    })
  })
})
