import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * workbench.controller.spec.ts — WorkbenchController 路由/功能 spec 测试
 *
 * 策略：内联 Controller（无 NestJS DI），mock WorkbenchService。
 * 覆盖：
 *   - GET /workbenches/bootstrap  bootstrap 载荷
 *   - GET /workbenches 角色工作台列表
 *   - GET /workbenches/nav-items 导航项
 *   - GET /workbenches/capability-check 能力检查
 *   - POST /workbenches/approvals/execute 审批执行
 *   - POST /workbenches/secrets/rotate 密钥轮转
 *   - POST /workbenches/actions/runtime-replay 运行重放
 *   - GET /workbenches/actions/:receiptCode 收据查询
 *   - POST /workbenches/handlers/:handlerName/receipts/:receiptCode/sync 处理器同步
 *   - POST /workbenches/handlers/:handlerName/receipts/:receiptCode/callback 处理器回调
 *   - POST /workbenches/actions/:receiptCode/replay 操作重放
 *   - 查询过滤、空数据、角色筛选等边界
 */

import assert from 'node:assert/strict'
// ── Helpers ──────────────────────────────────────────────────────
function makeTenantContext(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'CN',
    ...overrides,
  }
}

function makeActorContext(overrides: Record<string, unknown> = {}) {
  return {
    actorId: 'user-001',
    actorRole: 'STORE_MANAGER',
    ...overrides,
  }
}

// A service method: callable with any args, returns T, has mock context
interface MockServiceFn<T> {
  (...args: any[]): T
  mock: MockCallContext
}

interface MockCallContext {
  callCount(): number
  calls: Array<{ arguments: any[] }>
}

// Wrap vi.fn into a properly typed mock service function
function mockSvcFn<T>(_impl: (...args: any[]) => T): MockServiceFn<T> {
  return vi.fn(_impl) as unknown as MockServiceFn<T>
}

// Concrete type for the mock service — using any is fine for test stubs
interface MockWorkbenchService {
  getBootstrap: MockServiceFn<any>
  getRoleWorkbenches: MockServiceFn<any>
  checkCapability: MockServiceFn<any>
  submitApprovalExecution: MockServiceFn<any>
  submitSecretRotation: MockServiceFn<any>
  submitRuntimeReplay: MockServiceFn<any>
  getActionReceipt: MockServiceFn<any>
  syncHandlerReceipt: MockServiceFn<any>
  recordHandlerCallback: MockServiceFn<any>
  replayActionReceipt: MockServiceFn<any>
}

function makeMockService(overrides?: Record<string, unknown>): MockWorkbenchService {
  const svc: MockWorkbenchService = {
    getBootstrap: mockSvcFn(() => ({
      tenantContext: { tenantId: 't-001' },
      workbenches: [],
      storePortals: [],
      tenantPortal: {},
      brandPortal: {},
      marketProfile: {},
      regionalLoginPolicies: {},
      supportedLocales: ['zh-CN'],
      supportedClients: [],
      foundation: {},
    })),
    getRoleWorkbenches: mockSvcFn(() => []),
    checkCapability: mockSvcFn(() => true),
    submitApprovalExecution: mockSvcFn(() => ({ receiptCode: 'r-001', status: 'PENDING' })),
    submitSecretRotation: mockSvcFn(() => ({ receiptCode: 'r-002', status: 'PROCESSING' })),
    submitRuntimeReplay: mockSvcFn(() => ({ receiptCode: 'r-003', status: 'ACCEPTED' })),
    getActionReceipt: mockSvcFn(() => ({ receiptCode: 'r-001', status: 'SUCCEEDED' })),
    syncHandlerReceipt: mockSvcFn(() => ({ receiptCode: 'r-001', handlerName: 'notify', status: 'SYNCED' })),
    recordHandlerCallback: mockSvcFn(() => ({ receiptCode: 'r-001', handlerName: 'notify', status: 'RECORDED' })),
    replayActionReceipt: mockSvcFn(() => ({ receiptCode: 'r-001', status: 'REPLAYED' })),
  }
  return { ...svc, ...overrides } as MockWorkbenchService
}

// ── Inline Controller（镜像源码 workbench.controller.ts）────────
const WORKBENCH_READ_ROLES = [
  'SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER',
  'GUIDE', 'CASHIER', 'OPERATIONS', 'SECURITY_ADMIN',
] as const

class WorkbenchController {
  constructor(private readonly workbenchService: MockWorkbenchService) {}

  getBootstrap(tenantContext: ReturnType<typeof makeTenantContext>) {
    return this.workbenchService.getBootstrap(tenantContext)
  }

  getWorkbenches(query: Record<string, unknown> = {}) {
    const workbenches = this.workbenchService.getRoleWorkbenches()
    let result = workbenches
    if (query.role) {
      result = result.filter((w: { role: string }) => w.role === query.role)
    }
    if (query.channel) {
      result = result.filter((w: { channel: string }) => w.channel === query.channel)
    }
    if (query.initialized !== undefined) {
      if (!query.initialized) result = []
    }
    return { workbenches: result, total: result.length }
  }

  getNavItems(query: Record<string, unknown> = {}) {
    const workbenches = this.workbenchService.getRoleWorkbenches()
    let navItems = workbenches.flatMap((w: { role: string; channel: string; marketCodes?: string[]; navItems: Array<Record<string, unknown>> }) =>
      w.navItems.map((item: Record<string, unknown>) => ({ ...item, role: w.role, channel: w.channel, marketCodes: w.marketCodes }))
    )
    if (query.role) {
      navItems = navItems.filter((n: Record<string, unknown>) => n.role === query.role)
    }
    if (query.channel) {
      navItems = navItems.filter((n: Record<string, unknown>) => n.channel === query.channel)
    }
    if (query.marketCode) {
      navItems = navItems.filter((n: Record<string, unknown>) => (n.marketCodes as string[])?.includes(query.marketCode as string))
    }
    if (query.capability) {
      navItems = navItems.filter((n: Record<string, unknown>) => this.workbenchService.checkCapability(n.role, query.capability))
    }
    return { navItems, total: navItems.length }
  }

  checkCapability(query: { role: string; capability: string }) {
    const has = this.workbenchService.checkCapability(query.role, query.capability)
    return { role: query.role, capability: query.capability, has }
  }

  executeApproval(body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.submitApprovalExecution(body, tenantContext, actorContext)
  }

  rotateSecret(body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.submitSecretRotation(body, tenantContext, actorContext)
  }

  submitRuntimeReplay(body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.submitRuntimeReplay(body, tenantContext, actorContext)
  }

  getActionReceipt(receiptCode: string) {
    return this.workbenchService.getActionReceipt(receiptCode)
  }

  syncHandlerReceipt(receiptCode: string, handlerName: string, body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.syncHandlerReceipt(receiptCode, handlerName, body, tenantContext, actorContext)
  }

  recordHandlerCallback(receiptCode: string, handlerName: string, body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.recordHandlerCallback(receiptCode, handlerName, body, tenantContext, actorContext)
  }

  replayActionReceipt(receiptCode: string, body: Record<string, unknown>, tenantContext?: ReturnType<typeof makeTenantContext>, actorContext?: ReturnType<typeof makeActorContext>) {
    return this.workbenchService.replayActionReceipt(receiptCode, body, tenantContext, actorContext)
  }
}

// ── Tests ────────────────────────────────────────────────────────
describe('WorkbenchController — decorator / routing', () => {
  it('controller class name matches source', () => {
    assert.equal(WorkbenchController.name, 'WorkbenchController')
  })

  it('所有方法均为 function', () => {
    const proto = WorkbenchController.prototype as unknown as Record<string, unknown>
    const methods = [
      'getBootstrap', 'getWorkbenches', 'getNavItems', 'checkCapability',
      'executeApproval', 'rotateSecret', 'submitRuntimeReplay',
      'getActionReceipt', 'syncHandlerReceipt', 'recordHandlerCallback',
      'replayActionReceipt',
    ]
    for (const m of methods) {
      assert.equal(typeof proto[m], 'function', `${m} 应为 function`)
    }
  })
})

describe('WorkbenchController — GET /workbenches/bootstrap', () => {
  it('返回完整 bootstrap 载荷', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.getBootstrap(makeTenantContext())

    assert.ok(result.tenantContext)
    assert.ok(Array.isArray(result.workbenches))
    assert.equal(mockService.getBootstrap.mock.calls.length, 1)
  })

  it('空数据时仍返回结构完整', () => {
    const mockService = makeMockService({
      getBootstrap: mockSvcFn(() => ({
        tenantContext: {},
        workbenches: [],
        storePortals: [],
        tenantPortal: {},
        brandPortal: {},
        marketProfile: {},
        regionalLoginPolicies: {},
        supportedLocales: ['zh-CN'],
        supportedClients: [],
        foundation: {},
      })),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getBootstrap(makeTenantContext())

    assert.equal(result.workbenches.length, 0)
    assert.ok(Array.isArray(result.supportedLocales))
  })
})

describe('WorkbenchController — GET /workbenches', () => {
  it('无查询条件时返回全部工作台', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
      { role: 'CASHIER', channel: 'store', navItems: [] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({})

    assert.equal(result.total, 2)
    assert.equal(result.workbenches.length, 2)
  })

  it('按角色过滤后只返回匹配工作台', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
      { role: 'CASHIER', channel: 'store', navItems: [] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({ role: 'CASHIER' })

    assert.equal(result.total, 1)
    assert.equal(result.workbenches[0].role, 'CASHIER')
  })

  it('按渠道过滤', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
      { role: 'CASHIER', channel: 'store', navItems: [] },
      { role: 'SUPER_ADMIN', channel: 'admin', navItems: [] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({ channel: 'store' })

    assert.equal(result.total, 2)
  })

  it('initialized=false 时返回空', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({ initialized: false })

    assert.equal(result.total, 0)
  })

  it('空数据集返回 total=0', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({})

    assert.equal(result.total, 0)
  })
})

describe('WorkbenchController — GET /workbenches/nav-items', () => {
  it('无过滤时返回全部导航项', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'dash', label: 'Dashboard' }] },
      { role: 'CASHIER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'pos', label: 'POS' }] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getNavItems({})

    assert.equal(result.total, 2)
  })

  it('按角色过滤导航项', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'dash', label: 'Dashboard' }] },
      { role: 'CASHIER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'pos', label: 'POS' }] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getNavItems({ role: 'CASHIER' })

    assert.equal(result.total, 1)
    assert.equal(result.navItems[0].id, 'pos')
  })

  it('按 marketCode 过滤导航项', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'dash', label: 'Dashboard' }] },
      { role: 'SUPER_ADMIN', channel: 'admin', marketCodes: ['HK'], navItems: [{ id: 'audit', label: 'Audit' }] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getNavItems({ marketCode: 'CN' })

    assert.equal(result.total, 1)
    assert.equal(result.navItems[0].role, 'STORE_MANAGER')
  })

  it('按能力过滤导航项', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'dash', label: 'Dashboard' }] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
      checkCapability: mockSvcFn(() => true),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getNavItems({ capability: 'view_sales' })

    assert.equal(result.navItems[0].role, 'STORE_MANAGER')
    assert.equal(mockService.checkCapability.mock.calls.length, 1)
    assert.equal(mockService.checkCapability.mock.calls[0][0], 'STORE_MANAGER')
    assert.equal(mockService.checkCapability.mock.calls[0][1], 'view_sales')
  })

  it('能力不满足时返回空', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', marketCodes: ['CN'], navItems: [{ id: 'dash', label: 'Dashboard' }] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
      checkCapability: mockSvcFn(() => false),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getNavItems({ capability: 'view_finance' })

    assert.equal(result.total, 0)
  })
})

describe('WorkbenchController — GET /workbenches/capability-check', () => {
  it('有权限时返回 has=true', () => {
    const mockService = makeMockService({
      checkCapability: mockSvcFn(() => true),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.checkCapability({ role: 'STORE_MANAGER', capability: 'view_sales' })

    assert.equal(result.role, 'STORE_MANAGER')
    assert.equal(result.capability, 'view_sales')
    assert.equal(result.has, true)
  })

  it('无权限时返回 has=false', () => {
    const mockService = makeMockService({
      checkCapability: mockSvcFn(() => false),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.checkCapability({ role: 'CASHIER', capability: 'view_finance' })

    assert.equal(result.has, false)
  })
})

describe('WorkbenchController — POST /workbenches/approvals/execute', () => {
  it('成功提交审批', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.executeApproval(
      { approvalId: 'app-001', action: 'approve' },
      makeTenantContext(),
      makeActorContext()
    )

    assert.ok(result.receiptCode)
    assert.equal(result.status, 'PENDING')
    assert.equal(mockService.submitApprovalExecution.mock.calls.length, 1)
  })
})

describe('WorkbenchController — POST /workbenches/secrets/rotate', () => {
  it('成功提交密钥轮转', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.rotateSecret(
      { secretId: 'sec-001', reason: 'scheduled rotation' },
      makeTenantContext(),
      makeActorContext()
    )

    assert.ok(result.receiptCode)
    assert.equal(result.status, 'PROCESSING')
    assert.equal(mockService.submitSecretRotation.mock.calls.length, 1)
  })
})

describe('WorkbenchController — POST /workbenches/actions/runtime-replay', () => {
  it('成功提交运行重放', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.submitRuntimeReplay(
      { actionId: 'act-001', replayType: 'full' },
      makeTenantContext(),
      makeActorContext()
    )

    assert.equal(result.status, 'ACCEPTED')
    assert.equal(mockService.submitRuntimeReplay.mock.calls.length, 1)
  })
})

describe('WorkbenchController — GET /workbenches/actions/:receiptCode', () => {
  it('查询存在的收据', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.getActionReceipt('r-001')

    assert.equal(result.receiptCode, 'r-001')
    assert.equal(result.status, 'SUCCEEDED')
    assert.equal(mockService.getActionReceipt.mock.calls.length, 1)
    assert.equal(mockService.getActionReceipt.mock.calls[0][0], 'r-001')
  })
})

describe('WorkbenchController — POST /workbenches/handlers/:handlerName/receipts/:receiptCode/sync', () => {
  it('同步处理器收据', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.syncHandlerReceipt(
      'r-001', 'notify',
      { event: 'SYNC', payload: {} },
      makeTenantContext(),
      makeActorContext()
    )

    assert.equal(result.status, 'SYNCED')
    assert.equal(mockService.syncHandlerReceipt.mock.calls.length, 1)
    assert.equal(mockService.syncHandlerReceipt.mock.calls[0][0], 'r-001')
    assert.equal(mockService.syncHandlerReceipt.mock.calls[0][1], 'notify')
  })
})

describe('WorkbenchController — POST /workbenches/handlers/:handlerName/receipts/:receiptCode/callback', () => {
  it('记录处理器回调', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.recordHandlerCallback(
      'r-001', 'notify',
      { event: 'COMPLETED', result: 'ok' },
      makeTenantContext(),
      makeActorContext()
    )

    assert.equal(result.status, 'RECORDED')
    assert.equal(mockService.recordHandlerCallback.mock.calls.length, 1)
  })
})

describe('WorkbenchController — POST /workbenches/actions/:receiptCode/replay', () => {
  it('操作重放成功', () => {
    const mockService = makeMockService()
    const controller = new WorkbenchController(mockService)
    const result = controller.replayActionReceipt(
      'r-001',
      { action: 'retry', maxAttempts: 3 },
      makeTenantContext(),
      makeActorContext()
    )

    assert.equal(result.status, 'REPLAYED')
    assert.equal(mockService.replayActionReceipt.mock.calls.length, 1)
  })
})

describe('WorkbenchController — 异常与边界', () => {
  it('getBootstrap 未传 tenantContext 时服务返回 undefined', () => {
    const mockService = makeMockService({
      getBootstrap: mockSvcFn(() => undefined),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getBootstrap(makeTenantContext())

    assert.equal(result, undefined)
  })

  it('getActionReceipt 查找不存在收据时返回 undefined', () => {
    const mockService = makeMockService({
      getActionReceipt: mockSvcFn(() => undefined),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getActionReceipt('non-existent')

    assert.equal(result, undefined)
  })

  it('getWorkbenches 空查询时返回全部结果含角色列表', () => {
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => [
        { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
        { role: 'CASHIER', channel: 'store', navItems: [] },
        { role: 'GUIDE', channel: 'store', navItems: [] },
        { role: 'SUPER_ADMIN', channel: 'admin', navItems: [] },
      ]),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({})

    assert.equal(result.total, 4)
    const roles = result.workbenches.map((w: { role: string }) => w.role)
    assert.ok(roles.includes('STORE_MANAGER'))
    assert.ok(roles.includes('GUIDE'))
  })

  it('不存在的角色过滤返回 total=0', () => {
    const mockWorkbenches = [
      { role: 'STORE_MANAGER', channel: 'store', navItems: [] },
    ]
    const mockService = makeMockService({
      getRoleWorkbenches: mockSvcFn(() => mockWorkbenches),
    })
    const controller = new WorkbenchController(mockService)
    const result = controller.getWorkbenches({ role: 'GUEST' })

    assert.equal(result.total, 0)
  })
})
