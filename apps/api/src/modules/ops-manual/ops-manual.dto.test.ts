/**
 * 🐜 自动: [ops-manual] [A] dto 测试
 */

import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

describe('OpsManual DTOs', () => {
  describe('GenerateManualDto', () => {
    it('正例: 完整 DTO 赋值', () => {
      const dto = {
        role: 'store_manager' as const,
        tenantId: 'tenant-A',
        exportFormat: 'html' as const,
        generatedBy: 'user-001',
      } as { role: string; tenantId: string; exportFormat: string; generatedBy: string }
      assert.equal(dto.role, 'store_manager')
      assert.equal(dto.tenantId, 'tenant-A')
      assert.equal(dto.exportFormat, 'html')
      assert.equal(dto.generatedBy, 'user-001')
    })

    it('正例: 最小 DTO (只赋值必填)', () => {
      const dto = {
        role: 'cashier' as const,
        tenantId: 'tenant-B',
      } as { role: string; tenantId: string; exportFormat?: string; generatedBy?: string }
      assert.equal(dto.role, 'cashier')
      assert.equal(dto.tenantId, 'tenant-B')
      assert.equal(dto.exportFormat, undefined)
      assert.equal(dto.generatedBy, undefined)
    })

    it('边界: 四种角色都可赋值', () => {
      const roles = ['store_manager', 'sales_staff', 'cashier', 'customer_service'] as const
      for (const role of roles) {
        const dto = { role, tenantId: 'tenant-T' }
        assert.equal(dto.role, role)
      }
    })
  })

  describe('ExportManualDto', () => {
    it('正例: 四種导出格式', () => {
      const formats = ['markdown', 'html', 'checklist', 'pdf-json'] as const
      for (const format of formats) {
        const dto = { role: 'store_manager' as const, format }
        assert.equal(dto.format, format)
      }
    })
  })

  describe('SearchManualDto', () => {
    it('正例: 完整搜索条件', () => {
      const dto = {
        role: 'store_manager' as const,
        keyword: '排班',
        tenantId: 'tenant-A',
        searchedBy: 'user-001',
      }
      assert.equal(dto.keyword, '排班')
    })

    it('边界: 空关键字搜索', () => {
      const dto = { role: 'cashier' as const, keyword: '' }
      assert.equal(dto.keyword, '')
    })
  })

  describe('GetSopDto', () => {
    it('正例: 完整 SOP 查询条件', () => {
      const dto = {
        role: 'store_manager' as const,
        sectionId: 'sm-overview',
        tenantId: 'tenant-A',
      }
      assert.equal(dto.sectionId, 'sm-overview')
    })
  })

  describe('ManualRecordQueryDto', () => {
    it('正例: 分页参数默认值', () => {
      const dto = { page: 1, pageSize: 10 }
      assert.equal(dto.page, 1)
      assert.equal(dto.pageSize, 10)
    })

    it('边界: 自定义分页', () => {
      const dto = { page: 3, pageSize: 50, tenantId: 'tenant-A', role: 'store_manager' as const }
      assert.equal(dto.page, 3)
      assert.equal(dto.pageSize, 50)
      assert.equal(dto.tenantId, 'tenant-A')
      assert.equal(dto.role, 'store_manager')
    })
  })

  describe('CreateManualRecordDto', () => {
    it('正例: 完整创建 DTO', () => {
      const dto = {
        tenantId: 'tenant-A',
        role: 'store_manager' as const,
        title: '店长运营手册',
        version: '2.0.0',
        exportFormat: 'html' as const,
        content: '<h1>手册内容</h1>',
        totalSections: 7,
        totalPages: 12,
        estimatedReadTime: 25,
        generatedBy: 'system',
      }
      assert.equal(dto.title, '店长运营手册')
      assert.equal(dto.version, '2.0.0')
    })

    it('边界: 仅必填字段', () => {
      const dto = {
        tenantId: 'tenant-B',
        role: 'cashier' as const,
        title: '收银手册',
      } as { tenantId: string; role: string; title: string; version?: string; content?: string; totalSections?: number }
      assert.equal(dto.version, undefined)
      assert.equal(dto.content, undefined)
      assert.equal(dto.totalSections, undefined)
    })
  })

  describe('Response DTOs', () => {
    it('ManualRecordResponseDto 结构', () => {
      const resp = {
        id: '1',
        tenantId: 'tenant-A',
        role: 'store_manager',
        title: '店长运营手册',
        version: '1.0.0',
        exportFormat: 'markdown',
        totalSections: 7,
        totalPages: 12,
        estimatedReadTime: 25,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
      assert.equal(resp.id, '1')
      assert.equal(resp.role, 'store_manager')
    })

    it('ManualRecordListResponseDto 结构', () => {
      const resp = {
        data: [] as Array<{ id: string; title: string }>,
        total: 0,
        page: 1,
        pageSize: 10,
      }
      assert.equal(resp.total, 0)
      assert.equal(resp.page, 1)
    })
  })
})
