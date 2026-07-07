import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { OpsManualService, Role } from './ops-manual.service'

describe('OpsManualService', () => {
  let service: OpsManualService

  beforeEach(() => {
    service = new OpsManualService()
  })

  describe('generateManual', () => {
    it('should generate store manager manual', () => {
      const manual = service.generateManual('store_manager')
      expect(manual.role).toBe('store_manager')
      expect(manual.sections.length).toBeGreaterThan(0)
    })

    it('should generate sales staff manual', () => {
      const manual = service.generateManual('sales_staff')
      expect(manual.role).toBe('sales_staff')
    })

    it('should generate cashier manual', () => {
      const manual = service.generateManual('cashier')
      expect(manual.role).toBe('cashier')
    })

    it('should generate customer service manual', () => {
      const manual = service.generateManual('customer_service')
      expect(manual.role).toBe('customer_service')
    })
  })

  describe('getManualInfo', () => {
    it('should return manual info', () => {
      const info = service.getManualInfo('store_manager')
      expect(info.title).toBeDefined()
      expect(info.version).toBeDefined()
      expect(info.sections).toBeGreaterThan(0)
    })
  })

  describe('exportMarkdown', () => {
    it('should export manual as markdown', () => {
      const manual = service.generateManual('store_manager')
      const markdown = service.exportMarkdown(manual)
      expect(markdown).toContain('# 店长运营手册')
      expect(markdown).toContain('##')
    })
  })

  describe('exportHTML', () => {
    it('should export manual as HTML', () => {
      const manual = service.generateManual('store_manager')
      const html = service.exportHTML(manual)
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('店长运营手册')
    })
  })

  describe('exportChecklist', () => {
    it('should export manual as checklist', () => {
      const manual = service.generateManual('store_manager')
      const checklist = service.exportChecklist(manual)
      expect(checklist).toContain('检查清单')
      expect(checklist).toContain('[ ]')
    })
  })

  describe('exportPDFJSON', () => {
    it('should export manual as PDF JSON', () => {
      const manual = service.generateManual('store_manager')
      const json = service.exportPDFJSON(manual)
      const parsed = JSON.parse(json)
      expect(parsed.title).toBeDefined()
      expect(parsed.sections).toBeDefined()
    })
  })

  describe('searchManual', () => {
    it('should search manual content', () => {
      const results = service.searchManual('store_manager', '排班')
      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('getSOP', () => {
    it('should return SOP steps', () => {
      const sop = service.getSOP('store_manager', 'sm-overview')
      expect(Array.isArray(sop)).toBe(true)
    })

    it('should return empty array for non-existent section', () => {
      const sop = service.getSOP('store_manager', 'nonexistent')
      expect(sop).toEqual([])
    })
  })
})
