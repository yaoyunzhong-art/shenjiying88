import { describe, it, expect, beforeEach } from 'vitest'
import { LowcodePageController } from './lowcode-page.controller'
import { LowcodeAuditService } from './lowcode-audit.service'

/**
 * 🐜 [lowcode] 角色扩展测试
 * 覆盖低代码页面管理与审核边界场景
 */

function setup() {
  const auditService = new LowcodeAuditService()
  const controller = new LowcodePageController(auditService)
  return { auditService, controller }
}

describe('👔店长 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('创建页面模板', () => {
    const page = svc.controller.createPage({
      name: '首页',
      type: 'page',
      schema: { components: [] },
    })
    expect(page).toBeDefined()
    expect(page.name).toBe('首页')
  })
})

describe('🔧安监 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('审核通过页面', () => {
    const page = svc.controller.createPage({ name: '待审', type: 'page', schema: {} })
    const result = svc.controller.approvePage(page.id)
    expect(result).toBeDefined()
  })

  it('审核记录查询', () => {
    svc.auditService.recordAudit({ pageId: 'p1', reviewer: '安全员', action: 'approve', comment: '合规' })
    const history = svc.auditService.getAuditHistory('p1')
    expect(history.length).toBeGreaterThanOrEqual(1)
  })
})

describe('🎯运行专员 lowcode 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('列出所有已创建页面', () => {
    svc.controller.createPage({ name: 'A', type: 'page', schema: {} })
    svc.controller.createPage({ name: 'B', type: 'modal', schema: {} })
    const pages = svc.controller.listPages()
    expect(pages.length).toBeGreaterThanOrEqual(2)
  })
})
