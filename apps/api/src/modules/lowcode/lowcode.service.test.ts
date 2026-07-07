/**
 * lowcode.service.test.ts
 * 低代码聚合服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LowcodeService } from './lowcode.service'
import { LowCodePageBuilder, AuditAlertService } from './lowcode-audit.service'

function createService() {
  const pageBuilder = new LowCodePageBuilder()
  const auditService = new AuditAlertService()
  const service = new LowcodeService(pageBuilder, auditService)
  return { service, pageBuilder, auditService }
}

describe('LowcodeService', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => {
    ctx = createService()
  })

  // ─── Template Management ──────────────────────

  describe('registerTemplate', () => {
    it('应注册新模板并生成 id', () => {
      const tpl = ctx.service.registerTemplate({
        name: 'Custom Template',
        components: [{ type: 'navbar', defaultProps: { title: 'Custom' } }],
      })
      expect(tpl.id).toBeDefined()
      expect(tpl.name).toBe('Custom Template')
      expect(tpl.status).toBe('active')
      expect(tpl.components).toHaveLength(1)
    })

    it('应处理空组件列表', () => {
      const tpl = ctx.service.registerTemplate({
        name: 'Empty Template',
        components: [],
      })
      expect(tpl.components).toEqual([])
    })

    it('应支持自定义 metadata', () => {
      const tpl = ctx.service.registerTemplate({
        name: 'With Metadata',
        components: [],
        metadata: { author: 'admin', version: '2.0' },
      })
      expect(tpl.metadata.author).toBe('admin')
    })

    it('应支持设置 createdBy', () => {
      const tpl = ctx.service.registerTemplate({
        name: 'By User',
        components: [],
        createdBy: 'user-1',
      })
      expect(tpl.createdBy).toBe('user-1')
    })
  })

  describe('getTemplate / listTemplates', () => {
    it('应返回注册的模板', () => {
      ctx.service.registerTemplate({ name: 'T1', components: [] })
      const tpl = ctx.service.getTemplate(
        Array.from(ctx['service']['templates'].keys())[0],
      )
      expect(tpl).toBeDefined()
    })

    it('不存在的模板返回 undefined', () => {
      expect(ctx.service.getTemplate('non-existent')).toBeUndefined()
    })

    it('listTemplates 应返回所有模板', () => {
      ctx.service.registerTemplate({ name: 'T1', components: [] })
      ctx.service.registerTemplate({ name: 'T2', components: [] })
      expect(ctx.service.listTemplates()).toHaveLength(2)
    })

    it('listTemplates 应按 status 过滤', () => {
      ctx.service.registerTemplate({ name: 'Active', components: [] })
      const archId = Array.from(ctx['service']['templates'].keys())[0]
      ctx.service.updateTemplate(archId, { status: 'archived' })
      expect(ctx.service.listTemplates({ status: 'active' })).toHaveLength(0)
      expect(ctx.service.listTemplates({ status: 'archived' })).toHaveLength(1)
    })
  })

  describe('updateTemplate', () => {
    it('应更新模板名称', () => {
      ctx.service.registerTemplate({ name: 'Old', components: [] })
      const id = Array.from(ctx['service']['templates'].keys())[0]
      const updated = ctx.service.updateTemplate(id, { name: 'New' })
      expect(updated.name).toBe('New')
    })

    it('应支持部分更新', () => {
      ctx.service.registerTemplate({ name: 'Partial', components: [], description: 'Desc' })
      const id = Array.from(ctx['service']['templates'].keys())[0]
      const updated = ctx.service.updateTemplate(id, { name: 'Updated' })
      expect(updated.name).toBe('Updated')
      expect(updated.description).toBe('Desc')
    })

    it('不存在的模板应抛出', () => {
      expect(() => ctx.service.updateTemplate('bad-id', { name: 'X' })).toThrow('Template not found')
    })
  })

  describe('deleteTemplate', () => {
    it('应删除模板', () => {
      ctx.service.registerTemplate({ name: 'ToDelete', components: [] })
      const id = Array.from(ctx['service']['templates'].keys())[0]
      ctx.service.deleteTemplate(id)
      expect(ctx.service.getTemplate(id)).toBeUndefined()
    })

    it('不存在的模板应抛出', () => {
      expect(() => ctx.service.deleteTemplate('bad-id')).toThrow('Template not found')
    })
  })

  // ─── Snapshot Management ──────────────────────

  describe('createSnapshot', () => {
    it('应从已有页面创建快照', () => {
      const page = ctx.pageBuilder.createPage('tpl-blank', { name: 'Snap Test' })
      const snap = ctx.service.createSnapshot(page.id, 'Initial version', 'admin')
      expect(snap.id).toBeDefined()
      expect(snap.pageId).toBe(page.id)
      expect(snap.version).toBe(1)
      expect(snap.changelog).toBe('Initial version')
      expect(snap.publishedBy).toBe('admin')
    })

    it('不存在的页面应抛出', () => {
      expect(() => ctx.service.createSnapshot('bad-id')).toThrow('Page not found')
    })

    it('多次创建快照版本号递增', () => {
      const page = ctx.pageBuilder.createPage('tpl-blank')
      ctx.service.createSnapshot(page.id)
      ctx.service.createSnapshot(page.id)
      const snaps = ctx.service.listSnapshots(page.id)
      expect(snaps).toHaveLength(2)
      // Versions should be unique (1 and 2)
      const versions = snaps.map(s => s.version).sort((a,b) => a - b)
      expect(versions).toEqual([1, 2])
    })

    it('changelog 和 publishedBy 可选', () => {
      const page = ctx.pageBuilder.createPage('tpl-blank')
      const snap = ctx.service.createSnapshot(page.id)
      expect(snap.changelog).toBeUndefined()
      expect(snap.publishedBy).toBeUndefined()
    })
  })

  describe('listSnapshots', () => {
    it('应按 pageId 过滤', () => {
      const p1 = ctx.pageBuilder.createPage('tpl-blank')
      const p2 = ctx.pageBuilder.createPage('tpl-blank')
      ctx.service.createSnapshot(p1.id)
      ctx.service.createSnapshot(p2.id)
      expect(ctx.service.listSnapshots(p1.id)).toHaveLength(1)
      expect(ctx.service.listSnapshots(p2.id)).toHaveLength(1)
    })

    it('无快照页面返回空数组', () => {
      expect(ctx.service.listSnapshots('no-snaps')).toEqual([])
    })
  })

  // ─── Component Library ────────────────────────

  describe('registerComponent', () => {
    it('应注册组件到组件库', () => {
      const comp = ctx.service.registerComponent({
        name: 'Custom Button',
        type: 'button',
        defaultProps: { text: 'Click' },
      })
      expect(comp.id).toBeDefined()
      expect(comp.name).toBe('Custom Button')
      expect(comp.type).toBe('button')
      expect(comp.status).toBe('active')
    })

    it('应支持 schema 定义', () => {
      const comp = ctx.service.registerComponent({
        name: 'Data Table',
        type: 'table',
        schema: { columns: { type: 'array', required: true } },
      })
      expect(comp.schema).toEqual({ columns: { type: 'array', required: true } })
    })
  })

  describe('listComponentLibrary', () => {
    it('应返回所有注册组件', () => {
      ctx.service.registerComponent({ name: 'C1', type: 'button' })
      ctx.service.registerComponent({ name: 'C2', type: 'chart' })
      expect(ctx.service.listComponentLibrary()).toHaveLength(2)
    })

    it('无组件时返回空数组', () => {
      expect(ctx.service.listComponentLibrary()).toEqual([])
    })
  })

  // ─── Page Export / Import ─────────────────────

  describe('exportPage', () => {
    it('应导出页面数据', () => {
      const page = ctx.pageBuilder.createPage('tpl-dashboard', { name: 'Export Me' })
      const exported = ctx.service.exportPage(page.id)
      expect(exported.templateId).toBe('tpl-dashboard')
      expect(exported.name).toBe('Export Me')
      expect(exported.components).toBeDefined()
      expect(exported.version).toBe(1)
    })

    it('不存在的页面应抛出', () => {
      expect(() => ctx.service.exportPage('bad-id')).toThrow('Page not found')
    })
  })

  describe('importPage', () => {
    it('应导入页面', () => {
      const page = ctx.service.importPage({
        templateId: 'tpl-blank',
        name: 'Imported Page',
        components: [{ type: 'navbar', props: { title: 'Imported' } } as unknown as Record<string, unknown>],
        status: 'draft',
        version: 1,
      })
      expect(page).toBeDefined()
      expect(page.name).toBe('Imported Page')
    })

    it('应支持新名称覆盖', () => {
      const page = ctx.service.importPage(
        {
          templateId: 'tpl-blank',
          name: 'Original',
          components: [],
          status: 'draft',
          version: 1,
        },
        'New Name',
      )
      expect(page.name).toBe('New Name')
    })
  })

  // ─── Dashboard ────────────────────────────────

  describe('getDashboardStats', () => {
    it('应返回正确的统计', () => {
      const stats = ctx.service.getDashboardStats()
      expect(stats).toBeDefined()
      expect(typeof stats.totalPages).toBe('number')
      expect(typeof stats.totalTemplates).toBe('number')
      expect(typeof stats.totalComponents).toBe('number')
      expect(typeof stats.totalSnapshots).toBe('number')
    })

    it('创建页面和模板后统计应反映变化', () => {
      ctx.pageBuilder.createPage('tpl-blank')
      ctx.service.registerTemplate({ name: 'New', components: [] })
      ctx.service.registerComponent({ name: 'Btn', type: 'button' })
      const stats = ctx.service.getDashboardStats()
      expect(stats.totalPages).toBeGreaterThanOrEqual(1)
      expect(stats.totalTemplates).toBeGreaterThanOrEqual(1)
      expect(stats.totalComponents).toBeGreaterThanOrEqual(1)
    })

    it('published + draft = total', () => {
      ctx.pageBuilder.createPage('tpl-blank')
      ctx.pageBuilder.createPage('tpl-dashboard')
      const stats = ctx.service.getDashboardStats()
      expect(stats.publishedPages + stats.draftPages).toBe(stats.totalPages)
    })
  })
})
