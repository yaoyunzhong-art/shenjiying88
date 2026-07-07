import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ops-manual.test.ts - T129-2 运营手册生成器测试
 */
import assert from 'node:assert/strict'
import { OpsManualService, type Role } from './ops-manual.service'

describe('OpsManualService', () => {
  let svc: OpsManualService

  beforeEach(() => {
    svc = new OpsManualService()
  })

  // ── generateStoreManagerManual ────────────────────────────────────────────

  describe('generateStoreManagerManual', () => {
    it('包含全部7个章节', () => {
      const manual = svc.generateStoreManagerManual()
      assert.equal(manual.role, 'store_manager')
      assert.equal(manual.sections.length, 7)

      const titles = manual.sections.map(s => s.title)
      assert.ok(titles.includes('门店运营概览'))
      assert.ok(titles.includes('人员管理'))
      assert.ok(titles.includes('财务管理'))
      assert.ok(titles.includes('库存管理'))
      assert.ok(titles.includes('营销活动'))
      assert.ok(titles.includes('客诉处理'))
      assert.ok(titles.includes('数据看板'))
    })

    it('章节包含checkpoints和warnings', () => {
      const manual = svc.generateStoreManagerManual()
      const section = manual.sections[0]
      assert.ok(section.checkpoints && section.checkpoints.length > 0)
      assert.ok(section.warnings && section.warnings.length > 0)
    })

    it('章节按order排序', () => {
      const manual = svc.generateStoreManagerManual()
      for (let i = 0; i < manual.sections.length; i++) {
        assert.equal(manual.sections[i].order, i + 1)
      }
    })
  })

  // ── generateSalesStaffManual ──────────────────────────────────────────────

  describe('generateSalesStaffManual', () => {
    it('包含全部6个章节', () => {
      const manual = svc.generateSalesStaffManual()
      assert.equal(manual.role, 'sales_staff')
      assert.equal(manual.sections.length, 6)

      const titles = manual.sections.map(s => s.title)
      assert.ok(titles.includes('产品知识'))
      assert.ok(titles.includes('销售技巧'))
      assert.ok(titles.includes('会员运营'))
      assert.ok(titles.includes('盲盒销售'))
      assert.ok(titles.includes('赛事参与'))
      assert.ok(titles.includes('收入计算'))
    })

    it('有子章节结构', () => {
      const manual = svc.generateSalesStaffManual()
      const section = manual.sections[0]
      assert.ok(section.subsections && section.subsections.length > 0)
    })
  })

  // ── generateCashierManual ────────────────────────────────────────────────

  describe('generateCashierManual', () => {
    it('包含全部6个章节', () => {
      const manual = svc.generateCashierManual()
      assert.equal(manual.role, 'cashier')
      assert.equal(manual.sections.length, 6)

      const titles = manual.sections.map(s => s.title)
      assert.ok(titles.includes('收银系统'))
      assert.ok(titles.includes('收款方式'))
      assert.ok(titles.includes('离线收银'))
      assert.ok(titles.includes('退款处理'))
      assert.ok(titles.includes('促销核销'))
      assert.ok(titles.includes('对账差错'))
    })

    it('收款方式包含多个子章节', () => {
      const manual = svc.generateCashierManual()
      const paymentSection = manual.sections.find(s => s.title === '收款方式')
      assert.ok(paymentSection?.subsections)
      assert.ok(paymentSection!.subsections!.length >= 3)
    })
  })

  // ── generateCustomerServiceManual ────────────────────────────────────────

  describe('generateCustomerServiceManual', () => {
    it('包含全部6个章节', () => {
      const manual = svc.generateCustomerServiceManual()
      assert.equal(manual.role, 'customer_service')
      assert.equal(manual.sections.length, 6)

      const titles = manual.sections.map(s => s.title)
      assert.ok(titles.includes('常见问题'))
      assert.ok(titles.includes('会员问题'))
      assert.ok(titles.includes('订单问题'))
      assert.ok(titles.includes('投诉处理'))
      assert.ok(titles.includes('退款跟进'))
      assert.ok(titles.includes('话术模板'))
    })

    it('话术模板有多个子章节', () => {
      const manual = svc.generateCustomerServiceManual()
      const scriptSection = manual.sections.find(s => s.title === '话术模板')
      assert.ok(scriptSection?.subsections)
      assert.ok(scriptSection!.subsections!.length >= 4)
    })
  })

  // ── generateManual ───────────────────────────────────────────────────────

  describe('generateManual', () => {
    it('根据role返回对应手册', () => {
      const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
      for (const role of roles) {
        const manual = svc.generateManual(role)
        assert.equal(manual.role, role)
        assert.ok(manual.sections.length > 0)
      }
    })
  })

  // ── exportMarkdown ───────────────────────────────────────────────────────

  describe('exportMarkdown', () => {
    it('输出有效Markdown（含标题层级）', () => {
      const manual = svc.generateStoreManagerManual()
      const md = svc.exportMarkdown(manual)

      assert.ok(md.includes('# 店长运营手册'))
      assert.ok(md.includes('## 1. 门店运营概览'))
      assert.ok(md.includes('## 2. 人员管理'))
      assert.ok(md.includes('**关键检查点**:'))
      assert.ok(md.includes('- [ ]'))
      assert.ok(md.includes('**⚠️ 风险警示**:'))
    })

    it('包含版本和更新时间信息', () => {
      const manual = svc.generateStoreManagerManual()
      const md = svc.exportMarkdown(manual)

      assert.ok(md.includes('**版本**:'))
      assert.ok(md.includes(manual.version))
    })

    it('子章节以h3呈现', () => {
      const manual = svc.generateSalesStaffManual()
      const md = svc.exportMarkdown(manual)
      assert.ok(md.includes('### 子章节'))
    })
  })

  // ── exportHTML ───────────────────────────────────────────────────────────

  describe('exportHTML', () => {
    it('输出有效HTML', () => {
      const manual = svc.generateStoreManagerManual()
      const html = svc.exportHTML(manual)

      assert.ok(html.includes('<!DOCTYPE html>'))
      assert.ok(html.includes('<html lang="zh-CN">'))
      assert.ok(html.includes('<title>店长运营手册</title>'))
      assert.ok(html.includes('<h2>'))
      assert.ok(html.includes('</section>'))
    })

    it('包含样式', () => {
      const manual = svc.generateStoreManagerManual()
      const html = svc.exportHTML(manual)
      assert.ok(html.includes('<style>'))
      assert.ok(html.includes('body {'))
      assert.ok(html.includes('h1 {'))
    })

    it('包含检查点和警示', () => {
      const manual = svc.generateCashierManual()
      const html = svc.exportHTML(manual)
      assert.ok(html.includes('checkpoints'))
      assert.ok(html.includes('warnings'))
    })
  })

  // ── exportChecklist ──────────────────────────────────────────────────────

  describe('exportChecklist', () => {
    it('输出检查清单格式', () => {
      const manual = svc.generateStoreManagerManual()
      const checklist = svc.exportChecklist(manual)

      assert.ok(checklist.includes('# 店长运营手册 - 检查清单'))
      assert.ok(checklist.includes('[ ]'))
      assert.ok(checklist.includes('**⚠️ 警示**'))
      assert.ok(checklist.includes('**总计:'))
    })

    it('每个章节都有检查项', () => {
      const manual = svc.generateCashierManual()
      const checklist = svc.exportChecklist(manual)
      const checkboxCount = (checklist.match(/\[ \]/g) || []).length
      assert.ok(checkboxCount >= 6)
    })
  })

  // ── exportPDFJSON ────────────────────────────────────────────────────────

  describe('exportPDFJSON', () => {
    it('输出有效JSON', () => {
      const manual = svc.generateCustomerServiceManual()
      const jsonStr = svc.exportPDFJSON(manual)

      assert.doesNotThrow(() => JSON.parse(jsonStr))
    })

    it('JSON包含必要字段', () => {
      const manual = svc.generateSalesStaffManual()
      const jsonStr = svc.exportPDFJSON(manual)
      const pdfJson = JSON.parse(jsonStr)

      assert.equal(pdfJson.title, '导购运营手册')
      assert.ok(pdfJson.metadata)
      assert.ok(pdfJson.sections)
      assert.ok(Array.isArray(pdfJson.sections))
    })

    it('sections包含checkpoints和warnings', () => {
      const manual = svc.generateStoreManagerManual()
      const jsonStr = svc.exportPDFJSON(manual)
      const pdfJson = JSON.parse(jsonStr)

      assert.ok(pdfJson.sections[0].checkpoints)
      assert.ok(pdfJson.sections[0].warnings)
    })
  })

  // ── searchManual ─────────────────────────────────────────────────────────

  describe('searchManual', () => {
    it('搜索关键词匹配', () => {
      const results = svc.searchManual('store_manager', '排班')
      assert.ok(results.length > 0)
      assert.ok(results[0].matchedContent.includes('排班'))
    })

    it('搜索结果包含sectionId和title', () => {
      const results = svc.searchManual('cashier', '退款')
      assert.ok(results.length > 0)
      assert.ok(results[0].sectionId)
      assert.ok(results[0].title)
      assert.ok(results[0].matchedContent)
    })

    it('无匹配结果返回空数组', () => {
      const results = svc.searchManual('sales_staff', 'xyzabc123')
      assert.equal(results.length, 0)
    })

    it('支持搜索子章节内容', () => {
      const results = svc.searchManual('store_manager', '订货')
      assert.ok(results.length > 0)
    })
  })

  // ── getSOP ───────────────────────────────────────────────────────────────

  describe('getSOP', () => {
    it('返回步骤序列', () => {
      const sop = svc.getSOP('store_manager', 'sm-overview')
      assert.ok(sop.length > 0)
      assert.ok(sop[0].step)
      assert.ok(sop[0].action)
      assert.ok(sop[0].script)
    })

    it('SOP包含tips', () => {
      const sop = svc.getSOP('store_manager', 'sm-overview')
      assert.ok(sop[0].tips)
    })

    it('无效sectionId返回空数组', () => {
      const sop = svc.getSOP('cashier', 'invalid-id-123')
      assert.equal(sop.length, 0)
    })

    it('导购手册销售技巧有SOP', () => {
      const sop = svc.getSOP('sales_staff', 'sf-selling-reception')
      assert.ok(sop.length > 0)
    })
  })

  // ── getManualInfo ────────────────────────────────────────────────────────

  describe('getManualInfo', () => {
    it('返回元信息', () => {
      const info = svc.getManualInfo('store_manager')
      assert.equal(info.title, '店长运营手册')
      assert.ok(info.version)
      assert.equal(info.sections, 7)
      assert.ok(info.estimatedReadTime > 0)
    })

    it('各角色元信息正确', () => {
      const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
      const expectedSections = [7, 6, 6, 6]
      for (let i = 0; i < roles.length; i++) {
        const info = svc.getManualInfo(roles[i])
        assert.equal(info.sections, expectedSections[i])
      }
    })
  })

  // ── RoleManual 完整性 ────────────────────────────────────────────────────

  describe('RoleManual 完整性', () => {
    it('所有手册包含必要字段', () => {
      const roles: Role[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
      for (const role of roles) {
        const manual = svc.generateManual(role)
        assert.ok(manual.role)
        assert.ok(manual.title)
        assert.ok(manual.version)
        assert.ok(manual.lastUpdated instanceof Date)
        assert.ok(manual.sections)
        assert.ok(manual.totalPages > 0)
        assert.ok(manual.estimatedReadTime > 0)
      }
    })

    it('lastUpdated是有效日期', () => {
      const manual = svc.generateManual('store_manager')
      assert.ok(!isNaN(manual.lastUpdated.getTime()))
    })
  })
})
