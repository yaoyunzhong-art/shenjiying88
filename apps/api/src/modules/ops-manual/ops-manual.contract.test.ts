/**
 * 🐜 自动: [ops-manual] [D] contract.test 补全
 *
 * 运营手册模块合约类型验证测试
 * 验证合约接口与实体类型兼容性
 */

import { describe, it, expect } from 'vitest'
import {
  type ManualGenerateContract,
  type ManualExportContract,
  type ManualSearchContract,
  type SearchEntryContract,
  type ManualInfoContract,
  type SOPStepContract,
  type ManualRecordContract,
  OpsManualRole,
  OpsManualExportFormat,
  OPS_MANUAL_ROLES,
  OPS_MANUAL_EXPORT_FORMATS,
  OPS_MANUAL_CONSTANTS,
} from './ops-manual.contract'
import { OpsManualService } from './ops-manual.service'
import { OpsManualController } from './ops-manual.controller'
import {
  GenerateManualDto,
  ExportManualDto,
  ExportManualResponseDto,
  SearchManualDto,
  SearchResultDto,
  SearchManualResponseDto,
  GetSopDto,
  GetSopResponseDto,
  SopStepDto,
  ManualInfoQueryDto,
  ManualInfoResponseDto,
  CreateManualRecordDto,
  ManualRecordResponseDto,
  ManualRecordListResponseDto,
  ManualRecordQueryDto,
} from './ops-manual.dto'

describe('OpsManual Contract Types', () => {
  describe('Contract → Entity type compatibility', () => {
    it('ManualGenerateContract matches GenerateManualDto fields', () => {
      const dto = new GenerateManualDto()
      dto.role = 'store_manager'
      dto.tenantId = 'tenant-001'
      dto.exportFormat = 'markdown'
      dto.generatedBy = 'admin'

      const contract: ManualGenerateContract = {
        role: dto.role,
        tenantId: dto.tenantId,
        exportFormat: dto.exportFormat,
        generatedBy: dto.generatedBy,
      }
      expect(contract.role).toBe('store_manager')
      expect(contract.tenantId).toBe('tenant-001')
      expect(contract.exportFormat).toBe('markdown')
      expect(contract.generatedBy).toBe('admin')
    })

    it('ManualExportContract maps from ExportManualDto', () => {
      const dto = new ExportManualDto()
      dto.role = 'cashier'
      dto.format = 'checklist'
      dto.tenantId = 'tenant-002'

      const contract: ManualExportContract = {
        role: dto.role,
        format: dto.format,
        tenantId: dto.tenantId,
      }
      expect(contract.role).toBe('cashier')
      expect(contract.format).toBe('checklist')
      expect(contract.tenantId).toBe('tenant-002')
    })

    it('ManualSearchContract maps from SearchManualDto', () => {
      const dto = new SearchManualDto()
      dto.role = 'sales_staff'
      dto.keyword = '接待流程'
      dto.tenantId = 'tenant-003'
      dto.searchedBy = 'staff-01'

      const contract: ManualSearchContract = {
        role: dto.role,
        keyword: dto.keyword,
        tenantId: dto.tenantId,
        searchedBy: dto.searchedBy,
      }
      expect(contract.role).toBe('sales_staff')
      expect(contract.keyword).toBe('接待流程')
    })

    it('SearchEntryContract aligns with SearchResultDto', () => {
      const dto = new SearchResultDto()
      dto.sectionId = 'sm-overview'
      dto.title = '门店运营概览'
      dto.matchedContent = '...日常运营管理全攻略...'

      const contract: SearchEntryContract = {
        sectionId: dto.sectionId,
        title: dto.title,
        matchedContent: dto.matchedContent,
      }
      expect(contract.sectionId).toBe('sm-overview')
      expect(contract.matchedContent).toContain('日常运营管理')
    })

    it('ManualInfoContract aligns with ManualInfoResponseDto', () => {
      const dto = new ManualInfoResponseDto()
      dto.title = '店长运营手册'
      dto.version = '2.0.0'
      dto.sections = 7
      dto.estimatedReadTime = 45
      dto.lastUpdated = new Date().toISOString()

      const contract: ManualInfoContract = {
        title: dto.title,
        version: dto.version,
        sections: dto.sections,
        estimatedReadTime: dto.estimatedReadTime,
        lastUpdated: dto.lastUpdated,
      }
      expect(contract.title).toBe('店长运营手册')
      expect(contract.sections).toBe(7)
      expect(contract.estimatedReadTime).toBe(45)
    })

    it('SOPStepContract aligns with SopStepDto', () => {
      const dto = new SopStepDto()
      dto.step = 1
      dto.action = '召开晨会'
      dto.script = '请确认今日目标'
      dto.tips = '提前10分钟准备'

      const contract: SOPStepContract = {
        step: dto.step,
        action: dto.action,
        script: dto.script,
        tips: dto.tips,
      }
      expect(contract.step).toBe(1)
      expect(contract.action).toBe('召开晨会')
      expect(contract.tips).toBe('提前10分钟准备')
    })

    it('ManualRecordContract aligns with ManualRecordResponseDto', () => {
      const dto = new ManualRecordResponseDto()
      dto.id = 'rec-001'
      dto.tenantId = 'tenant-001'
      dto.role = 'store_manager'
      dto.title = '店长运营手册'
      dto.version = '1.0.0'
      dto.exportFormat = 'markdown'
      dto.content = '# 店长手册'
      dto.totalSections = 7
      dto.totalPages = 15
      dto.estimatedReadTime = 45
      dto.generatedBy = 'admin'
      dto.createdAt = new Date().toISOString()
      dto.updatedAt = new Date().toISOString()

      const contract: ManualRecordContract = {
        id: dto.id,
        tenantId: dto.tenantId,
        role: dto.role,
        title: dto.title,
        version: dto.version,
        exportFormat: dto.exportFormat,
        content: dto.content,
        totalSections: dto.totalSections,
        totalPages: dto.totalPages,
        estimatedReadTime: dto.estimatedReadTime,
        generatedBy: dto.generatedBy,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
      }
      expect(contract.id).toBe('rec-001')
      expect(contract.totalPages).toBe(15)
      expect(contract.estimatedReadTime).toBe(45)
      expect(contract.content).toBe('# 店长手册')
    })
  })

  describe('Contract type constraints', () => {
    it('OPS_MANUAL_ROLES defines all 4 roles', () => {
      expect(OPS_MANUAL_ROLES).toEqual([
        'store_manager',
        'sales_staff',
        'cashier',
        'customer_service',
      ])
    })

    it('OPS_MANUAL_EXPORT_FORMATS defines all 4 export formats', () => {
      expect(OPS_MANUAL_EXPORT_FORMATS).toEqual([
        'markdown',
        'html',
        'pdf-json',
        'checklist',
      ])
    })

    it('OPS_MANUAL_CONSTANTS provides sensible defaults', () => {
      expect(OPS_MANUAL_CONSTANTS.DEFAULT_VERSION).toBe('1.0.0')
      expect(OPS_MANUAL_CONSTANTS.MAX_SEARCH_RESULTS).toBe(50)
      expect(OPS_MANUAL_CONSTANTS.DEFAULT_PAGE_SIZE).toBe(10)
      expect(OPS_MANUAL_CONSTANTS.MIN_KEYWORD_LENGTH).toBe(2)
    })

    it('SOPStepContract tips field is optional', () => {
      const stepWithoutTips: SOPStepContract = {
        step: 1,
        action: '开门迎客',
        script: '请检查设备正常',
      }
      expect(stepWithoutTips.tips).toBeUndefined()

      const stepWithTips: SOPStepContract = {
        step: 2,
        action: '接待客户',
        script: '热情问候',
        tips: '保持微笑',
      }
      expect(stepWithTips.tips).toBe('保持微笑')
    })

    it('ManualExportContract tenantId is optional', () => {
      const contract: ManualExportContract = {
        role: 'customer_service',
        format: 'html',
      }
      expect(contract.tenantId).toBeUndefined()
    })

    it('ManualGenerateContract exportFormat defaults gracefully', () => {
      const contract: ManualGenerateContract = {
        role: 'store_manager',
        tenantId: 'tenant-demo',
      }
      expect(contract.exportFormat).toBeUndefined()
    })

    it('ManualRecordContract content is optional', () => {
      const contract: ManualRecordContract = {
        id: 'rec-002',
        tenantId: 'tenant-001',
        role: 'cashier',
        title: '收银手册',
        version: '1.0.0',
        exportFormat: 'checklist',
        totalSections: 5,
        totalPages: 10,
        estimatedReadTime: 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(contract.content).toBeUndefined()
      expect(contract.generatedBy).toBeUndefined()
    })
  })

  describe('Runtime service → contract compatibility', () => {
    it('generateManual output conforms to ManualInfoContract shape', () => {
      const service = new OpsManualService()
      const manual = service.generateManual('store_manager')
      const info: ManualInfoContract = {
        title: manual.title,
        version: manual.version,
        sections: manual.sections.length,
        estimatedReadTime: manual.estimatedReadTime,
        lastUpdated: new Date().toISOString(),
      }
      expect(info.title).toBe(manual.title)
      expect(info.sections).toBe(7)
      expect(info.estimatedReadTime).toBeGreaterThan(0)
    })

    it('searchManual output produces SearchEntryContract-compatible results', () => {
      const service = new OpsManualService()
      const results = service.searchManual('store_manager', '运营')
      for (const r of results) {
        const contract: SearchEntryContract = {
          sectionId: r.sectionId,
          title: r.title,
          matchedContent: r.matchedContent,
        }
        expect(contract.sectionId).toBeTruthy()
        expect(contract.title).toBeTruthy()
        expect(contract.matchedContent).toBeTruthy()
      }
    })

    it('getSOP output produces SOPStepContract-compatible steps', () => {
      const service = new OpsManualService()
      const steps = service.getSOP('store_manager', 'sm-overview')
      for (const s of steps) {
        const contract: SOPStepContract = {
          step: s.step,
          action: s.action,
          script: s.script,
          tips: s.tips,
        }
        expect(contract.step).toBeGreaterThan(0)
        expect(contract.action).toBeTruthy()
        expect(contract.script).toBeTruthy()
      }
    })

    it('generateManual for each role produces valid info', () => {
      const service = new OpsManualService()
      const roles: Array<'store_manager' | 'sales_staff' | 'cashier' | 'customer_service'> = [
        'store_manager',
        'sales_staff',
        'cashier',
        'customer_service',
      ]
      for (const role of roles) {
        const manual = service.generateManual(role)
        const info: ManualInfoContract = {
          title: manual.title,
          version: manual.version,
          sections: manual.sections.length,
          estimatedReadTime: manual.estimatedReadTime,
          lastUpdated: new Date().toISOString(),
        }
        expect(info.title).toContain('运营手册')
        expect(info.sections).toBeGreaterThan(0)
        expect(info.estimatedReadTime).toBeGreaterThan(0)
      }
    })
  })

  describe('Edge cases for contract types', () => {
    it('handles empty search keyword gracefully', () => {
      const contract: ManualSearchContract = {
        role: 'cashier',
        keyword: '',
        tenantId: 'tenant-001',
      }
      expect(contract.keyword).toBe('')
    })

    it('handles empty export format at contract level', () => {
      // DTO validation handles empty; contract just passes through
      const contract: ManualExportContract = {
        role: 'sales_staff',
        format: '' as any,
      }
      expect(contract.format).toBe('')
    })

    it('ManualRecordContract without optional fields still valid', () => {
      const minimal: ManualRecordContract = {
        id: 'minimal',
        tenantId: 't1',
        role: 'customer_service',
        title: '客服手册',
        version: '1.0.0',
        exportFormat: 'html',
        totalSections: 0,
        totalPages: 0,
        estimatedReadTime: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      expect(minimal.id).toBe('minimal')
      expect(minimal.generatedBy).toBeUndefined()
    })

    it('SOPStepContract with zero step still valid (edge case)', () => {
      const contract: SOPStepContract = {
        step: 0,
        action: 'placeholder',
        script: 'placeholder',
      }
      expect(contract.step).toBe(0)
    })
  })
})
