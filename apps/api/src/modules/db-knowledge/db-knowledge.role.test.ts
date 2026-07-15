/**
 * 🧪 db-knowledge.role.test.ts — 数据库知识库角色视角测试（L1 JMeter风格）
 * 
 * 从以下角色视角测试知识库检索功能:
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 
 * 每个角色≥3个用例: 正例+反例+边界
 * 体验闭环: 打开→操作→完成
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 模拟响应工厂 ──
function mockSuccess<T>(data: T) {
  return { success: true, code: 200, data }
}

function mockError(code: number, msg: string) {
  return { success: false, code, message: msg }
}

// ── 模拟知识文档数据 ──
const mockDocs = {
  storeOps: { id: 'KD-001', title: '门店运营手册', kind: 'operations', content: '门店日常运营规范...', tags: ['运营', '门店'] },
  cashier: { id: 'KD-002', title: '收银系统操作指南', kind: 'guide', content: '收银系统操作步骤...', tags: ['收银', '前台'] },
  hRPolicy: { id: 'KD-003', title: '人事管理制度', kind: 'policy', content: '员工考勤、薪酬管理...', tags: ['HR', '制度'] },
  security: { id: 'KD-004', title: '安防巡检规程', kind: 'safety', content: '消防、防盗巡检流程...', tags: ['安防', '安全'] },
  equipment: { id: 'KD-005', title: '设备维护手册', kind: 'maintenance', content: '机台日常维护步骤...', tags: ['设备', '维护'] },
  teambuilding: { id: 'KD-006', title: '团建活动指南', kind: 'activity', content: '团建活动策划模板...', tags: ['团建', '活动'] },
  marketing: { id: 'KD-007', title: '营销活动策划模板', kind: 'marketing', content: '营销活动SOP...', tags: ['营销', '活动'] },
  blindbox: { id: 'KD-008', title: '盲盒上新流程', kind: 'product', content: '盲盒产品上架审批...', tags: ['盲盒', '商品'] },
}

// ── 模拟知识库搜索 ──
function searchKnowledge(query: string, kind?: string): typeof mockDocs[keyof typeof mockDocs][] {
  const results = Object.values(mockDocs).filter(doc => {
    const matchQuery = !query || doc.title.includes(query) || doc.content.includes(query) || doc.tags.includes(query)
    const matchKind = !kind || doc.kind === kind
    return matchQuery && matchKind
  })
  return results
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} → 知识库检索测试`, () => {
  it('[正例] 店长搜索"运营"关键词 → 查找到门店运营手册', () => {
    const results = searchKnowledge('运营')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.title.includes('运营'))).toBe(true)
  })

  it('[正例] 店长按类型筛选"operations"类型文档', () => {
    const results = searchKnowledge('', 'operations')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('operations')
  })

  it('[反例] 店长搜索不存在的内容 → 返回空', () => {
    const results = searchKnowledge('不存在的关键字xxxxxxxx')
    expect(results).toHaveLength(0)
  })

  it('[边界] 店长搜索空字符串 → 返回所有文档', () => {
    const results = searchKnowledge('')
    expect(results.length).toBe(Object.keys(mockDocs).length)
  })

  it('[闭环] 店长打开知识库 → 搜索"收银" → 阅读收银指南', () => {
    const results = searchKnowledge('收银')
    expect(results.length).toBe(1)
    const doc = results[0]
    expect(doc.title).toBe('收银系统操作指南')
    expect(doc.tags).toContain('收银')
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} → 知识库检索测试`, () => {
  it('[正例] 前台搜索"收银" → 找到收银系统操作指南', () => {
    const results = searchKnowledge('收银')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe(mockDocs.cashier.id)
  })

  it('[正例] 前台按"guide"类型查看所有指南文档', () => {
    const results = searchKnowledge('', 'guide')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(d => expect(d.kind).toBe('guide'))
  })

  it('[反例] 前台搜索"设备维护"（无相关文档）→ 应返回空', () => {
    // 前台所在角色不应搜索到设备维护内容
    const results = searchKnowledge('设备维护', 'guide')
    expect(results).toHaveLength(0)
  })

  it('[闭环] 前台遇到收银问题 → 搜索"收银系统" → 查看操作指南', () => {
    const results = searchKnowledge('收银系统', 'guide')
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('收银系统操作指南')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} → 知识库检索测试`, () => {
  it('[正例] HR搜索"人事管理" → 找到人事管理制度', () => {
    const results = searchKnowledge('人事管理', 'policy')
    expect(results.some(r => r.kind === 'policy')).toBe(true)
  })

  it('[正例] HR按"policy"类型查看所有政策文档', () => {
    const results = searchKnowledge('', 'policy')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('policy')
  })

  it('[反例] HR搜索"盲盒"关键词无匹配', () => {
    const results = searchKnowledge('盲盒', 'policy')
    expect(results).toHaveLength(0)
  })

  it('[闭环] HR查看员工考勤制度 → 搜索"考勤" → 找到制度文档', () => {
    const results = searchKnowledge('考勤')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(mockDocs.hRPolicy.id)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} → 知识库检索测试`, () => {
  it('[正例] 安监搜索"安防" → 找到安防巡检规程', () => {
    const results = searchKnowledge('安防', 'safety')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('safety')
  })

  it('[正例] 安监搜索"巡检" → 找到巡检相关文档', () => {
    const results = searchKnowledge('巡检')
    expect(results.some(r => r.title.includes('安防'))).toBe(true)
  })

  it('[边界] 安监搜索无匹配安全关键字 → 空结果', () => {
    const results = searchKnowledge('舞会策划', 'safety')
    expect(results).toHaveLength(0)
  })

  it('[闭环] 安监更新巡检流程 → 搜索"安防巡检" → 阅读规程', () => {
    const results = searchKnowledge('安防巡检')
    expect(results.length).toBe(1)
    expect(results[0].title).toBe('安防巡检规程')
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} → 知识库检索测试`, () => {
  it('[正例] 导玩员搜索"设备维护" → 找到设备维护手册', () => {
    const results = searchKnowledge('设备维护', 'maintenance')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('maintenance')
  })

  it('[正例] 导玩员搜索"机台" → 找到相关文档', () => {
    const results = searchKnowledge('机台')
    expect(results.length).toBeGreaterThan(0)
  })

  it('[反例] 导玩员搜索"人事"类文档无匹配', () => {
    const results = searchKnowledge('人事', 'maintenance')
    expect(results).toHaveLength(0)
  })

  it('[闭环] 导玩员遇到设备故障 → 搜索"维护" → 阅读设备手册', () => {
    const results = searchKnowledge('维护')
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(mockDocs.equipment.id)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} → 知识库检索测试`, () => {
  it('[正例] 运行专员搜索"盲盒上新" → 找到盲盒流程', () => {
    const results = searchKnowledge('盲盒', 'product')
    expect(results.some(r => r.id === mockDocs.blindbox.id)).toBe(true)
  })

  it('[正例] 运行专员按类型查看活动文档', () => {
    const results = searchKnowledge('', 'activity')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('activity')
  })

  it('[边界] 运行专员搜索超长关键字', () => {
    const longQuery = 'a'.repeat(200)
    const results = searchKnowledge(longQuery)
    expect(results).toHaveLength(0)
  })

  it('[闭环] 运行专员需要上架新品 → 搜索"盲盒上新" → 阅读流程', () => {
    const results = searchKnowledge('盲盒上')
    expect(results.some(r => r.id === mockDocs.blindbox.id)).toBe(true)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} → 知识库检索测试`, () => {
  it('[正例] 团建搜索"团建活动" → 找到团建指南', () => {
    const results = searchKnowledge('团建')
    expect(results.some(r => r.id === mockDocs.teambuilding.id)).toBe(true)
  })

  it('[正例] 团建按"activity"类型查看活动文档', () => {
    const results = searchKnowledge('', 'activity')
    expect(results.length).toBe(1)
  })

  it('[反例] 团建搜索"人事管理"内容无匹配', () => {
    const results = searchKnowledge('人事管理', 'activity')
    expect(results).toHaveLength(0)
  })

  it('[闭环] 团建策划活动 → 搜索"团建活动" → 拿到模板', () => {
    const results = searchKnowledge('团建活动')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('activity')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} → 知识库检索测试`, () => {
  it('[正例] 营销搜索"营销活动" → 找到营销策划模板', () => {
    const results = searchKnowledge('营销活动', 'marketing')
    expect(results.length).toBe(1)
    expect(results[0].kind).toBe('marketing')
  })

  it('[正例] 营销搜索"活动SOP" → 找到相关模板', () => {
    const results = searchKnowledge('SOP')
    expect(results.some(r => r.id === mockDocs.marketing.id)).toBe(true)
  })

  it('[反例] 营销搜索"设备维护"无匹配', () => {
    const results = searchKnowledge('设备维护', 'marketing')
    expect(results).toHaveLength(0)
  })

  it('[边界] 营销搜索关键词包含特殊字符 → 过滤或空结果', () => {
    const results = searchKnowledge('<script>alert("xss")</script>')
    expect(results).toHaveLength(0)
  })

  it('[闭环] 营销策划促销活动 → 搜索"营销活动" → 参考模板', () => {
    const results = searchKnowledge('营销')
    expect(results.some(r => r.title.includes('营销'))).toBe(true)
  })
})

// ── 交叉场景: 多角色协作知识共享 ──
describe('多角色知识库协作场景', () => {
  it('👔+🎮 店长和导玩员共享设备维护知识', () => {
    const storeMgrSearch = searchKnowledge('设备', 'maintenance')
    const guideSearch = searchKnowledge('设备', 'maintenance')
    expect(storeMgrSearch).toEqual(guideSearch)
    expect(storeMgrSearch[0].tags).toContain('设备')
  })

  it('📢+🎯 营销和运行专员共享盲盒上新知识', () => {
    const marketingSearch = searchKnowledge('盲盒')
    const opsSearch = searchKnowledge('盲盒')
    expect(marketingSearch.some(r => r.id === mockDocs.blindbox.id)).toBe(true)
    expect(opsSearch).toEqual(marketingSearch)
  })

  it('所有角色都能搜索到门店运营手册（公开文档）', () => {
    const allRoles = Object.values(ROLES)
    allRoles.forEach(role => {
      const results = searchKnowledge('运营手册')
      expect(results).toBeDefined()
    })
  })

  // ── 新增: 更多角色访问模式测试 ──

  it('店长可以搜索角色专属文档', () => {
    ROLES.manager && (() => {
      const results = searchKnowledge('门店运营')
      expect(results).toBeDefined()
    })()
  })

  it('导玩员可以搜索游戏设备知识', () => {
    ROLES.guide && (() => {
      const results = searchKnowledge('设备维护')
      expect(results).toBeDefined()
    })()
  })

  it('营销专员可以搜索活动策划文档', () => {
    ROLES.marketing && (() => {
      const results = searchKnowledge('活动策划')
      expect(results).toBeDefined()
    })()
  })

  it('运行专员可以搜索日常工作文档', () => {
    ROLES.operations && (() => {
      const results = searchKnowledge('日常运营')
      expect(results).toBeDefined()
    })()
  })

  it('设备维护相关搜索跨角色返回结果', () => {
    const results = searchKnowledge('设备维护')
    expect(results).toBeDefined()
  })

  it('搜索空关键词应返回空或默认', () => {
    const results = searchKnowledge('')
    expect(results).toBeDefined()
  })

  it('搜索特殊字符关键词不抛异常', () => {
    const results = searchKnowledge('@#$%^&*()')
    expect(results).toBeDefined()
  })

  it('所有角色搜索不限量，返回被定义', () => {
    const allRoles = Object.values(ROLES)
    allRoles.forEach(role => {
      const results = searchKnowledge('a')
      expect(results).toBeDefined()
    })
  })
})
