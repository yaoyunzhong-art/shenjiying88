/**
 * lowcode.dto.test.ts
 * 低代码聚合 DTO 测试
 */

import { describe, it, expect } from 'vitest'
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateSnapshotDto,
  RegisterComponentDto,
  PageImportDto,
  DashboardStatsDto,
} from './lowcode.dto'

describe('lowcode DTOs', () => {
  describe('CreateTemplateDto', () => {
    it('应正确构造', () => {
      const dto = new CreateTemplateDto()
      dto.name = 'My Template'
      dto.description = 'A test template'
      dto.components = [{ type: 'navbar', defaultProps: { title: 'Test' } }]
      expect(dto.name).toBe('My Template')
      expect(dto.description).toBe('A test template')
      expect(dto.components).toHaveLength(1)
      expect(dto.components[0].type).toBe('navbar')
    })

    it('components 可为空数组', () => {
      const dto = new CreateTemplateDto()
      dto.name = 'Empty'
      dto.components = []
      expect(dto.components).toEqual([])
    })

    it('description 可选', () => {
      const dto = new CreateTemplateDto()
      dto.name = 'Minimal'
      dto.components = []
      expect(dto.description).toBeUndefined()
    })
  })

  describe('UpdateTemplateDto', () => {
    it('所有字段可选', () => {
      const dto = new UpdateTemplateDto()
      expect(dto.name).toBeUndefined()
      expect(dto.description).toBeUndefined()
      expect(dto.components).toBeUndefined()
      expect(dto.status).toBeUndefined()
    })

    it('应支持部分更新', () => {
      const dto = new UpdateTemplateDto()
      dto.name = 'Renamed'
      expect(dto.description).toBeUndefined()
      expect(dto.name).toBe('Renamed')
    })

    it('应接受 status 枚举值', () => {
      const dto = new UpdateTemplateDto()
      dto.status = 'archived'
      expect(dto.status).toBe('archived')
    })
  })

  describe('CreateSnapshotDto', () => {
    it('应包含必要的 pageId', () => {
      const dto = new CreateSnapshotDto()
      dto.pageId = 'page-001'
      expect(dto.pageId).toBe('page-001')
    })

    it('changelog 和 publishedBy 可选', () => {
      const dto = new CreateSnapshotDto()
      dto.pageId = 'page-001'
      expect(dto.changelog).toBeUndefined()
      expect(dto.publishedBy).toBeUndefined()
    })
  })

  describe('RegisterComponentDto', () => {
    it('应包含必要字段', () => {
      const dto = new RegisterComponentDto()
      dto.name = 'custom-btn'
      dto.type = 'button'
      expect(dto.name).toBe('custom-btn')
      expect(dto.type).toBe('button')
    })

    it('defaultProps 和 schema 可选', () => {
      const dto = new RegisterComponentDto()
      dto.name = 'chart'
      dto.type = 'chart'
      expect(dto.defaultProps).toBeUndefined()
      expect(dto.schema).toBeUndefined()
    })
  })

  describe('PageImportDto', () => {
    it('应包含 data 对象', () => {
      const dto = new PageImportDto()
      dto.data = { templateId: 'tpl-1', name: 'Page', components: [], status: 'draft', version: 1 }
      expect(dto.data).toBeDefined()
      expect(dto.data.templateId).toBe('tpl-1')
    })

    it('name 可选（导入时新名称）', () => {
      const dto = new PageImportDto()
      dto.data = { templateId: 'tpl-1', name: 'Page', components: [], status: 'draft', version: 1 }
      expect(dto.name).toBeUndefined()
    })
  })

  describe('DashboardStatsDto', () => {
    it('应正确赋值', () => {
      const dto = new DashboardStatsDto()
      dto.totalPages = 10
      dto.publishedPages = 5
      dto.draftPages = 5
      dto.totalTemplates = 3
      dto.totalComponents = 12
      dto.totalSnapshots = 8
      expect(dto.totalPages).toBe(10)
      expect(dto.publishedPages).toBe(5)
      expect(dto.draftPages).toBe(5)
      expect(dto.totalTemplates).toBe(3)
      expect(dto.totalComponents).toBe(12)
      expect(dto.totalSnapshots).toBe(8)
    })

    it('published + draft 应等于 total', () => {
      const dto = new DashboardStatsDto()
      dto.totalPages = 20
      dto.publishedPages = 12
      dto.draftPages = 8
      expect(dto.publishedPages + dto.draftPages).toBe(dto.totalPages)
    })
  })
})
