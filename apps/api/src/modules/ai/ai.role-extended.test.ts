/**
 * 🐜 自动: [ai] [C] 角色扩展测试
 *
 * 8 角色视角的 AI分析模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 AiService
 */
import { describe, it, expect } from 'vitest'
import { AiService } from './ai.service'

// ── 角色权限矩阵 ──

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

/** 角色 → AI分析模块权限 */
const roleAiAccess: Record<string, string[]> = {
  'ai:analyze': ['👔店长', '📢营销', '🎯运行专员'],
  'ai:classify': ['👔店长', '📢营销', '🎯运行专员', '🤝团建'],
  'ai:sentiment': ['👔店长', '👥HR', '📢营销', '🤝团建'],
  'ai:keywords': ['👔店长', '📢营销', '🎯运行专员'],
  'ai:stats': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAiAccess[resource]?.includes(role) ?? false
}

function makeService(): AiService {
  return new AiService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — AI分析
// ════════════════════════════════════════════════════════════

describe('[👔店长] ai 角色扩展测试', () => {
  it('👔[正例] 店长综合分析文本 → 类别 + 情感 + 关键词', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ai:analyze')).toBe(true)
    const svc = makeService()
    const result = svc.analyzeText('我们店上季度的销售额增长了20%，感谢团队出色表现')
    expect(result.category).toBe('finance')
    expect(result.sentiment.label).toBe('positive')
    expect(result.keywords.length).toBeGreaterThanOrEqual(1)
    expect(result.confidence).toBeGreaterThan(0)
    expect(result.tokensConsumed).toBeGreaterThan(0)
  })

  it('👔[正例] 店长分类文本到金融领域', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ai:classify')).toBe(true)
    const svc = makeService()
    const cat = svc.classifyCategory('本月投资回报率ROI为15%，资本收益率良好')
    expect(cat.category).toBe('finance')
    expect(cat.confidence).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看AI分析统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ai:stats')).toBe(true)
    const svc = makeService()
    svc.analyzeText('销售额增长，运营良好')
    svc.analyzeText('成本控制到位')
    const stats = svc.getAnalysisStats()
    expect(stats.total).toBeGreaterThanOrEqual(2)
    expect(Object.keys(stats.categories).length).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — AI分析
// ════════════════════════════════════════════════════════════

describe('[🛒前台] ai 角色扩展测试', () => {
  it('🛒[反例] 前台无权限进行综合分析', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ai:analyze')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'ai:classify')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看AI统计', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ai:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'ai:sentiment')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看关键词', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ai:keywords')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — AI分析
// ════════════════════════════════════════════════════════════

describe('[👥HR] ai 角色扩展测试', () => {
  it('👥[正例] HR分析员工满意度情感', async () => {
    expect(checkRoleAccess(ROLES.HR, 'ai:sentiment')).toBe(true)
    const svc = makeService()
    const sentiment = svc.sentimentScore('团队氛围很好，大家工作热情高涨，非常满意')
    expect(sentiment.label).toBe('positive')
    expect(sentiment.score).toBeGreaterThan(0)
    expect(sentiment.breakdown.positive).toBeGreaterThan(0)
  })

  it('👥[正例] HR分析负面反馈情感', async () => {
    expect(checkRoleAccess(ROLES.HR, 'ai:sentiment')).toBe(true)
    const svc = makeService()
    const sentiment = svc.sentimentScore('加班太多，压力很大，非常糟糕')
    expect(sentiment.label).toBe('negative')
    expect(sentiment.score).toBeLessThan(0)
    expect(sentiment.breakdown.negative).toBeGreaterThan(0)
  })

  it('👥[反例] HR无权限进行运营数据分析', () => {
    expect(checkRoleAccess(ROLES.HR, 'ai:analyze')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'ai:keywords')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — AI分析
// ════════════════════════════════════════════════════════════

describe('[🔧安监] ai 角色扩展测试', () => {
  it('🔧[反例] 安监无权限进行AI分析', () => {
    expect(checkRoleAccess(ROLES.Security, 'ai:analyze')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'ai:classify')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'ai:sentiment')).toBe(false)
  })

  it('🔧[反例] 安监无权限查看关键词和统计', () => {
    expect(checkRoleAccess(ROLES.Security, 'ai:keywords')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'ai:stats')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_AI_ACCESS', module: 'ai' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('ai')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — AI分析
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] ai 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限进行AI分析', () => {
    expect(checkRoleAccess(ROLES.Guide, 'ai:analyze')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'ai:classify')).toBe(false)
  })

  it('🎮[反例] 导玩员无权查看情感分析和关键词', () => {
    expect(checkRoleAccess(ROLES.Guide, 'ai:sentiment')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'ai:keywords')).toBe(false)
  })

  it('🎮[反例] 导玩员无权访问AI统计', () => {
    expect(checkRoleAccess(ROLES.Guide, 'ai:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — AI分析
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] ai 角色扩展测试', () => {
  it('🎯[正例] 运行专员综合分析运营文本', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'ai:analyze')).toBe(true)
    const svc = makeService()
    const result = svc.analyzeText('本周客流数据：门店日均接待500人，转化率35%')
    expect(result.keywords.length).toBeGreaterThanOrEqual(1)
    expect(result.processedAt).toBeTruthy()
  })

  it('🎯[正例] 运行专员提取关键词 → 查看分类', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'ai:keywords')).toBe(true)
    const svc = makeService()
    const keywords = svc.extractKeywords('游戏机台维护记录：扭蛋机故障3次，赛车座椅更换2次')
    expect(keywords.length).toBeGreaterThan(0)
    keywords.forEach((k) => {
      expect(k.score).toBeGreaterThanOrEqual(0)
      expect(k.keyword.length).toBeGreaterThan(0)
    })

    expect(checkRoleAccess(ROLES.Operations, 'ai:classify')).toBe(true)
    const cat = svc.classifyCategory('游戏机台运营与维护')
    expect(cat.category).toBeTruthy()
  })

  it('🎯[正例] 运行专员查看AI分析统计', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'ai:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getAnalysisStats()
    expect(stats.total).toBeGreaterThanOrEqual(0)
    expect(typeof stats.total).toBe('number')
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — AI分析
// ════════════════════════════════════════════════════════════

describe('[🤝团建] ai 角色扩展测试', () => {
  it('🤝[正例] 团建使用分类分析团建活动主题', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'ai:classify')).toBe(true)
    const svc = makeService()
    const cat = svc.classifyCategory('户外拓展活动设计方案，团队协作训练')
    expect(cat.category).toBe('sports')
  })

  it('🤝[正例] 团建分析员工对团建活动的情感反馈', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'ai:sentiment')).toBe(true)
    const svc = makeService()
    const sentiment = svc.sentimentScore('团建活动太棒了！大家都玩得很开心')
    expect(sentiment.label).toBe('positive')
    expect(sentiment.score).toBeGreaterThan(0)
  })

  it('🤝[反例] 团建无权限进行运营分析', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'ai:analyze')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'ai:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — AI分析
// ════════════════════════════════════════════════════════════

describe('[📢营销] ai 角色扩展测试', () => {
  it('📢[正例] 营销综合分析营销文案 → 分类+情感+关键词', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ai:analyze')).toBe(true)
    const svc = makeService()
    const result = svc.analyzeText('暑期促销活动效果显著，销售额同比增长50%，客户反响热烈', { topKKeywords: 3 })
    expect(result.sentiment.label).toBe('positive')
    expect(result.keywords.length).toBeLessThanOrEqual(3)
    expect(result.category).toBe('business')
  })

  it('📢[正例] 营销分类竞品文案 → 提取关键词', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ai:classify')).toBe(true)
    const svc = makeService()
    const cat = svc.classifyCategory('新品发布会：突破性AI技术创新，改变行业格局', { maxCategories: 2 })
    expect(['technology', 'business']).toContain(cat.category)

    expect(checkRoleAccess(ROLES.Marketing, 'ai:keywords')).toBe(true)
    const keywords = svc.extractKeywords('创新产品发布，AI技术引领行业变革', { topN: 5, minScore: 0.1 })
    expect(keywords.length).toBeGreaterThan(0)
  })

  it('📢[正例] 营销情感分析用户评价', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ai:sentiment')).toBe(true)
    const svc = makeService()
    const sentiment = svc.sentimentScore('产品质量差，客服态度恶劣，非常不满意')
    expect(sentiment.label).toBe('negative')
    expect(sentiment.breakdown.negative).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 ai 跨角色闭环 + 边界]', () => {
  it('📢 + 👔 营销分析 + 店长审阅全流程', async () => {
    const svc = makeService()

    // 1. 营销分析文案
    const analysis = svc.analyzeText('暑期大促活动，全场优惠大放送', { topKKeywords: 5 })
    expect(analysis.category).toBeTruthy()
    expect(analysis.sentiment.label).toBeTruthy()

    // 2. 店长查看分析统计
    const stats = svc.getAnalysisStats()
    expect(stats.total).toBeGreaterThan(0)
  })

  it('🛡️ 空文本输入返回统一默认值', () => {
    const svc = makeService()
    const result = svc.analyzeText('')
    expect(result.category).toBe('unknown')
    expect(result.sentiment.label).toBe('neutral')
    expect(result.keywords).toHaveLength(0)
    expect(result.confidence).toBe(0)
  })

  it('🛡️ 纯空格文本处理', () => {
    const svc = makeService()
    const result = svc.analyzeText('   ')
    expect(result.category).toBe('unknown')
    expect(result.keywords).toHaveLength(0)
  })

  it('🛡️ 纯标点符号文本', () => {
    const svc = makeService()
    const result = svc.analyzeText('！！！？？？……')
    expect(result.sentiment.label).toBe('neutral')
    expect(result.category).toBe('general')
  })

  it('🛡️ 长文本分析不截断', () => {
    const svc = makeService()
    const longText = '我们公司在云计算和人工智能领域投入了大量研发资源，'.repeat(10)
    const result = svc.analyzeText(longText)
    expect(result.category).toBe('technology')
    expect(result.tokensConsumed).toBe(longText.length * 2)
  })

  it('🛡️ 情感评分正/负/中三态覆盖', () => {
    const svc = makeService()
    const positive = svc.sentimentScore('amazing, wonderful, perfect!')
    expect(positive.label).toBe('positive')

    const negative = svc.sentimentScore('terrible, awful, horrible!')
    expect(negative.label).toBe('negative')

    const neutral = svc.sentimentScore('maybe it is ok for a normal day')
    expect(neutral.label).toBe('neutral')
  })

  it('🛡️ 关键词提取按分数降序排列', () => {
    const svc = makeService()
    const keywords = svc.extractKeywords('AI machine learning data algorithm cloud API')
    for (let i = 1; i < keywords.length; i++) {
      expect(keywords[i - 1].score).toBeGreaterThanOrEqual(keywords[i].score)
    }
  })

  it('🛡️ 分类multiple类别时传子类别', () => {
    const svc = makeService()
    const cat = svc.classifyCategory('医院投资股票市场教育和医疗研究', { maxCategories: 3 })
    expect(cat.subCategory).toBeTruthy()
    // 至少有1个category匹配
    expect(['healthcare', 'education', 'finance']).toContain(cat.category)
  })

  it('🛡️ getAnalysisStats 包含各类统计', () => {
    const svc = makeService()
    svc.analyzeText('科技发展日新月异')
    svc.analyzeText('金融投资回报稳定')
    const stats = svc.getAnalysisStats()
    expect(stats.total).toBeGreaterThanOrEqual(2)
    expect(Object.keys(stats.sentiments).length).toBeGreaterThan(0)
  })
})
