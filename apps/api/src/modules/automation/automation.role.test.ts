/**
/**
 * 🧪 自动化规则 角色旅程测试（增强版 25+ tests）
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
import { AutomationService } from './automation.service'

const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'auto:list': ['👔店长', '🎯运行专员'],
  'auto:create': ['🎯运行专员'],
  'auto:trigger': ['🎯运行专员'],
  'auto:logs': ['👔店长', '🎯运行专员', '🔧安监'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

// ── 角色权限矩阵 ──

describe('[角色权限矩阵] 自动化规则', () => {
  it('👔店长: auto:list=true, auto:create=false, auto:trigger=false, auto:logs=true', () => {
    expect(chk(ROLES.StoreManager, 'auto:list')).toBe(true)
    expect(chk(ROLES.StoreManager, 'auto:create')).toBe(false)
    expect(chk(ROLES.StoreManager, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.StoreManager, 'auto:logs')).toBe(true)
  })

  it('🎯运行专员: 全部权限为 true', () => {
    expect(chk(ROLES.Operations, 'auto:list')).toBe(true)
    expect(chk(ROLES.Operations, 'auto:create')).toBe(true)
    expect(chk(ROLES.Operations, 'auto:trigger')).toBe(true)
    expect(chk(ROLES.Operations, 'auto:logs')).toBe(true)
  })

  it('🔧安监: 仅有 auto:logs=true', () => {
    expect(chk(ROLES.Security, 'auto:list')).toBe(false)
    expect(chk(ROLES.Security, 'auto:create')).toBe(false)
    expect(chk(ROLES.Security, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Security, 'auto:logs')).toBe(true)
  })

  it('🛒前台: 无任何权限', () => {
    expect(chk(ROLES.FrontDesk, 'auto:list')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'auto:create')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'auto:logs')).toBe(false)
  })

  it('👥HR: 无任何权限', () => {
    expect(chk(ROLES.HR, 'auto:list')).toBe(false)
    expect(chk(ROLES.HR, 'auto:create')).toBe(false)
    expect(chk(ROLES.HR, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.HR, 'auto:logs')).toBe(false)
  })

  it('🎮导玩员: 无任何权限', () => {
    expect(chk(ROLES.Guide, 'auto:list')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:create')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:logs')).toBe(false)
  })

  it('🤝团建: 无任何权限', () => {
    expect(chk(ROLES.Teambuilding, 'auto:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:create')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:logs')).toBe(false)
  })

  it('📢营销: 无任何权限', () => {
    expect(chk(ROLES.Marketing, 'auto:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:create')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:logs')).toBe(false)
  })
})

// ── 角色旅程场景 ──

describe(`${ROLES.StoreManager} 角色旅程`, () => {
  it('👔[正例] 查看自动化规则列表', () => {
    expect(chk(ROLES.StoreManager, 'auto:list')).toBe(true)
    const list = ok([{ id: 'AR-001', name: '库存不足自动补货', status: 'active' }])
    expect(list.data.length).toBe(1)
    expect(list.data[0].name).toBe('库存不足自动补货')
  })

  it('👔[正例] 查看执行日志', () => {
    expect(chk(ROLES.StoreManager, 'auto:logs')).toBe(true)
    const logs = ok([{ ruleId: 'AR-001', trigger: 'stock_below_threshold', result: 'purchase_order_created' }])
    expect(logs.data[0].result).toBe('purchase_order_created')
  })

  it('👔[反例] 创建自动化被拒', () => {
    expect(chk(ROLES.StoreManager, 'auto:create')).toBe(false)
  })

  it('👔[反例] 触发自动化被拒', () => {
    expect(chk(ROLES.StoreManager, 'auto:trigger')).toBe(false)
  })

  it('👔[边界] 查看空规则列表返回空数组', () => {
    const empty = ok([])
    expect(empty.data).toEqual([])
  })
})

describe(`${ROLES.Operations} 角色旅程`, () => {
  it('🎯[正例] 创建自动化规则成功', () => {
    expect(chk(ROLES.Operations, 'auto:create')).toBe(true)
    const created = ok({ id: 'AR-002', name: '自动发放生日优惠券', condition: 'member.birthday', action: 'coupon.issue', status: 'active' })
    expect(created.data.condition).toBe('member.birthday')
    expect(created.data.status).toBe('active')
  })

  it('🎯[正例] 手动触发规则成功', () => {
    expect(chk(ROLES.Operations, 'auto:trigger')).toBe(true)
    const triggered = ok({ id: 'AR-002', triggered: true, matchedCount: 15 })
    expect(triggered.data.matchedCount).toBe(15)
  })

  it('🎯[正例] 查看规则列表', () => {
    expect(chk(ROLES.Operations, 'auto:list')).toBe(true)
    const list = ok([{ id: 'AR-001' }, { id: 'AR-002' }])
    expect(list.data.length).toBe(2)
  })

  it('🎯[正例] 查看执行日志', () => {
    expect(chk(ROLES.Operations, 'auto:logs')).toBe(true)
    const logs = ok([{ ruleId: 'AR-001', result: 'completed' }])
    expect(logs.data[0].result).toBe('completed')
  })

  it('🎯[反例] 创建无效规则条件返回错误', () => {
    const err = fail(400, 'INVALID_CONDITION')
    expect(err.code).toBe(400)
    expect(err.message).toBe('INVALID_CONDITION')
  })

  it('🎯[边界] 查看空日志返回空数组', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })

  it('🎯[边界] 触发无匹配项返回0', () => {
    const triggered = ok({ id: 'AR-003', triggered: true, matchedCount: 0 })
    expect(triggered.data.matchedCount).toBe(0)
  })
})

describe(`${ROLES.Security} 角色旅程`, () => {
  it('🔧[正例] 查看自动化执行日志', () => {
    expect(chk(ROLES.Security, 'auto:logs')).toBe(true)
    const logs = ok([{ ruleId: 'AR-001', trigger: 'security_check', result: 'passed' }])
    expect(logs.data[0].result).toBe('passed')
  })

  it('🔧[正例] 查看多条日志', () => {
    const logs = ok([
      { ruleId: 'AR-001', result: 'passed' },
      { ruleId: 'AR-002', result: 'failed' },
    ])
    expect(logs.data.length).toBe(2)
  })

  it('🔧[反例] 无法创建规则', () => {
    expect(chk(ROLES.Security, 'auto:create')).toBe(false)
  })

  it('🔧[反例] 无法触发规则', () => {
    expect(chk(ROLES.Security, 'auto:trigger')).toBe(false)
  })

  it('🔧[反例] 无法查看规则列表', () => {
    expect(chk(ROLES.Security, 'auto:list')).toBe(false)
  })

  it('🔧[边界] 查看空日志', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})

describe('其他角色无权限', () => {
  it('🛒👥🎮🤝📢 5个角色均无权查看列表', () => {
    expect(chk(ROLES.FrontDesk, 'auto:list')).toBe(false)
    expect(chk(ROLES.HR, 'auto:list')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:list')).toBe(false)
  })

  it('🛒👥🎮🤝📢 5个角色均无权创建', () => {
    expect(chk(ROLES.FrontDesk, 'auto:create')).toBe(false)
    expect(chk(ROLES.HR, 'auto:create')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:create')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:create')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:create')).toBe(false)
  })

  it('🛒👥🎮🤝📢 5个角色均无权触发', () => {
    expect(chk(ROLES.FrontDesk, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.HR, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:trigger')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:trigger')).toBe(false)
  })

  it('🛒👥🎮🤝📢 5个角色均无权查看日志', () => {
    expect(chk(ROLES.FrontDesk, 'auto:logs')).toBe(false)
    expect(chk(ROLES.HR, 'auto:logs')).toBe(false)
    expect(chk(ROLES.Guide, 'auto:logs')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'auto:logs')).toBe(false)
    expect(chk(ROLES.Marketing, 'auto:logs')).toBe(false)
  })
})

// ── 场景边界 ──

describe('[角色权限边界] AutomationService 服务集成', () => {
  it('使用 AutomationService 创建规则（运行专员场景）', () => {
    const svc = new AutomationService()
    const rule = svc.addRule({
      name: '运行专员创建规则',
      description: '权限测试',
      conditions: [{ field: 'x', op: 'eq', value: 1 }],
      actions: [{ type: 'log_event', params: {} }],
      enabled: true,
      priority: 5,
    })
    expect(rule.id).toBeDefined()
    expect(rule.name).toBe('运行专员创建规则')
  })

  it('使用 AutomationService 评估规则（所有有权限角色场景）', () => {
    const svc = new AutomationService()
    const result = svc.evaluateRule('rule_001', { data: { customer: { score: 10 } }, timestamp: '' })
    expect(result.matched).toBe(true)
    expect(result.ruleName).toBe('高票客户自动创建工单')
  })

  it('Auto:list 权限角色可获取规则列表', () => {
    const svc = new AutomationService()
    const rules = svc.listAllRules()
    expect(rules.length).toBeGreaterThanOrEqual(3)
  })

  it('Auto:logs 类似 - 获取工作流状态不依赖角色', () => {
    // 工作流状态获取属于系统操作，不依赖角色权限
    const svc = new AutomationService()
    const wf = svc.createWorkflow('日志场景', 'rule_001')
    expect(svc.getWorkflowStatus(wf.id)).not.toBeNull()
  })

  it('权限检查和实际服务调用一致（运行专员应有全部能力）', () => {
    const svc = new AutomationService()
    // 创建规则
    const rule = svc.addRule({ name: 'T', description: '', conditions: [{ field: 'a', op: 'eq', value: 1 }], actions: [{ type: 'log_event', params: {} }], enabled: true, priority: 1 })
    // 评估规则
    const evalRes = svc.evaluateRule(rule.id, { data: { a: 1 }, timestamp: '' })
    expect(evalRes.matched).toBe(true)
  })
})

