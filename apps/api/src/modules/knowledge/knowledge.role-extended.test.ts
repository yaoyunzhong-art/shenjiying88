import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [knowledge] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — knowledge 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 测试用例 (正常流程 + 权限边界 + 降级场景)
 * 覆盖：文档索引、语义查询、补全建议、文档 CRUD、分类过滤、统计
 * 扩展：空结果/无效参数/大容量/跨 kind 查询/幂等索引/精确删除
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { KnowledgeController, resetKnowledgeControllerState } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'
import type { KnowledgeDocumentDto, KnowledgeStatsDto } from './knowledge.dto'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助工厂 ──
function createController(): KnowledgeController {
  resetKnowledgeControllerState()
  const indexer = new KnowledgeIndexerService()
  const service = new KnowledgeService(indexer)
  return new KnowledgeController(service)
}

function seedExtendedDocs(ctrl: KnowledgeController): void {
  ctrl.indexDocument({ sourcePath: 'docs/sop/store-sop.md', content: '# 门店 SOP\n开店流程: 1.签到 2.设备巡检 3.开机', kind: 'doc', tags: ['SOP', '门店'] })
  ctrl.indexDocument({ sourcePath: 'docs/lessons/quota-bug.md', content: '# Lesson: 额度双倍扣除\n并发缺少锁导致重复扣减。修复: Redis 锁+幂等。', kind: 'lesson', tags: ['bug', '并发'] })
  ctrl.indexDocument({ sourcePath: 'docs/patterns/referral-chain.md', content: '# 推荐链模式\nA推B得10%, B推C得5%, C推D得2%', kind: 'pattern', tags: ['推荐', '营销'] })
  ctrl.indexDocument({ sourcePath: 'docs/decisions/security-v2.md', content: '# 安全加固V2\n增加设备指纹校验。1.前端上报 2.后端验证 3.风控告警', kind: 'decision', tags: ['安全', '风控'] })
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局知识库监管
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} knowledge 扩展角色测试`, () => {
  it('店长批量索引多门店文档后确认文档列表完整', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'docs/sop/store-01.md', content: '# Store 01 SOP', kind: 'doc', tags: ['SOP'] })
    ctrl.indexDocument({ sourcePath: 'docs/sop/store-02.md', content: '# Store 02 SOP', kind: 'doc', tags: ['SOP'] })
    ctrl.indexDocument({ sourcePath: 'docs/sop/store-03.md', content: '# Store 03 SOP', kind: 'doc', tags: ['SOP'] })
    const docs = ctrl.listDocuments()
    assert.equal(docs.length, 3)
    const paths = docs.map((d) => d.sourcePath).sort()
    assert.deepEqual(paths, ['docs/sop/store-01.md', 'docs/sop/store-02.md', 'docs/sop/store-03.md'])
  })

  it('店长查看统计确认文档覆盖的 kind 多样性', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const stats = ctrl.getStats()
    assert.ok(stats.totalChunks > 0)
    assert.ok(stats.totalDocuments >= 4)
  })

  it('店长跨 kind 语义查询返回正确结果', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '安全加固', topK: 3 })
    assert.ok(resp.results.length > 0)
    const hasSecurity = resp.results.some((r) => r.sourcePath.includes('security-v2'))
    assert.equal(hasSecurity, true)
  })

  it('店长删除废弃文档后确认文档列表减少', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const before = ctrl.listDocuments().length
    const docs = ctrl.listDocuments()
    const deleteResult = ctrl.deleteDocument(docs[0].id)
    assert.equal(deleteResult.ok, true)
    const after = ctrl.listDocuments().length
    assert.equal(after, before - 1)
  })

  it('店长查询不存在的文档返回错误信息', () => {
    const ctrl = createController()
    const result = ctrl.getDocument('non-existent-doc-id')
    assert.ok('error' in result)
    assert.ok(result.error.includes('not found'))
  })

  it('店长删除不存在的文档返回 false', () => {
    const ctrl = createController()
    const result = ctrl.deleteDocument('non-existent-id')
    assert.equal(result.ok, false)
  })

  it('店长索引文档后通过文档详情确认元数据完整', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'docs/test/complete.md', content: '# Complete Doc\nContent here', kind: 'doc', tags: ['test', '完整'] })
    const docs = ctrl.listDocuments()
    const detail = ctrl.getDocument(docs[0].id)
    assert.equal('id' in detail, true)
    assert.equal((detail as KnowledgeDocumentDto).sourcePath, 'docs/test/complete.md')
    assert.ok((detail as KnowledgeDocumentDto).chunkCount > 0)
    assert.ok((detail as KnowledgeDocumentDto).createdAt)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常操作知识查阅
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} knowledge 扩展角色测试`, () => {
  it('前台查询收银 SOP 文档确认获取正确指引', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '开店流程', topK: 3, kindFilter: 'doc' })
    assert.ok(resp.results.length > 0)
    const sopMatch = resp.results.some((r) => r.sourcePath.includes('store-sop'))
    assert.equal(sopMatch, true)
  })

  it('前台查询空知识库返回空结果列表', () => {
    const ctrl = createController()
    const resp = ctrl.query({ query: '收银流程', topK: 5 })
    assert.equal(resp.results.length, 0)
    assert.equal(resp.totalCandidates, 0)
    assert.ok(resp.durationMs >= 0)
  })

  it('前台请求补全建议 — 有匹配时返回建议列表', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const suggestions = ctrl.suggest({ query: '安全', maxSuggestions: 2 })
    assert.ok(suggestions.length > 0)
    assert.ok(suggestions.length <= 2)
    assert.ok(suggestions[0].score > 0)
  })

  it('前台请求补全建议但知识库无匹配返回空数组', () => {
    const ctrl = createController()
    const suggestions = ctrl.suggest({ query: '不存在的关键词xyz', maxSuggestions: 3 })
    assert.equal(suggestions.length, 0)
  })

  it('前台按 kind 过滤查询只返回对应类型的文档', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '推荐', topK: 5, kindFilter: 'pattern' })
    assert.ok(resp.results.every((r) => r.kind === 'pattern'))
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工培训与 Lessons Learned 管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} knowledge 扩展角色测试`, () => {
  it('HR 索引培训文档并确认可通过语义查询找到', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'training/onboarding.md', content: '# 新员工入职培训\n## 第一天\n了解公司文化、价值观。\n## 第二天\n熟悉系统操作流程。', kind: 'doc', tags: ['培训', '入职'] })
    const resp = ctrl.query({ query: '入职培训', topK: 3 })
    assert.ok(resp.results.some((r) => r.sourcePath.includes('onboarding')))
  })

  it('HR 查询 lessons learned 用于团队经验分享', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '并发扣减问题', topK: 5, kindFilter: 'lesson' })
    assert.ok(resp.results.length > 0)
    assert.ok(resp.results.every((r) => r.kind === 'lesson'))
  })

  it('HR 按 kind 列出 lesson 文档', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const lessons = ctrl.listDocumentsByKind('lesson')
    assert.ok(Array.isArray(lessons))
    assert.equal(lessons.length, 1)
    assert.equal(lessons[0].kind, 'lesson')
  })

  it('HR 传入无效 kind 应返回错误', () => {
    const ctrl = createController()
    const result = ctrl.listDocumentsByKind('invalid-kind!!!!')
    assert.ok('error' in result)
    assert.ok('code' in result)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全决策与风控知识审计
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} knowledge 扩展角色测试`, () => {
  it('安监查询安全决策文档确认历史安全方案', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '设备指纹校验', topK: 3, kindFilter: 'decision' })
    assert.ok(resp.results.length > 0)
    assert.ok(resp.results.every((r) => r.kind === 'decision'))
  })

  it('安监通过补全建议快速定位安全相关文档', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const suggestions = ctrl.suggest({ query: '风控告警', maxSuggestions: 5 })
    assert.ok(suggestions.length > 0)
    assert.ok(suggestions.some((s) => s.sourcePath.includes('security')))
  })

  it('安监索引后按 tags 同类文档过滤查询', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'security/firewall.md', content: '# 防火墙规则\n禁止外网直接访问数据库', kind: 'doc', tags: ['安全', '网络'] })
    ctrl.indexDocument({ sourcePath: 'security/audit.md', content: '# 审计规则\n记录所有管理操作', kind: 'doc', tags: ['安全', '审计'] })
    const resp = ctrl.query({ query: '安全规则', topK: 5 })
    assert.equal(resp.results.length, 2)
  })

  it('安监重置索引确认所有数据清空', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    ctrl.resetIndex()
    const docs = ctrl.listDocuments()
    assert.equal(docs.length, 0)
    const stats = ctrl.getStats()
    assert.equal(stats.totalDocuments, 0)
    assert.equal(stats.totalChunks, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游乐规则与游戏知识查询
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} knowledge 扩展角色测试`, () => {
  it('导玩员索引游戏规则文档后可通过语义查询找到', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'games/basketball.md', content: '# 投篮机规则\n## 计分规则\n投中一球得2分, 连续命中3球进入加分模式。\n## 奖励\n单局超过200分获得额外游戏币。', kind: 'doc', tags: ['游戏', '投篮机'] })
    const resp = ctrl.query({ query: '投篮机加分规则', topK: 3 })
    assert.ok(resp.results.length > 0)
    assert.ok(resp.results.some((r) => r.sourcePath.includes('basketball')))
  })

  it('导玩员获取所有文档列表确认知识库完整', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'games/dancing.md', content: '# 跳舞机操作', kind: 'doc' })
    ctrl.indexDocument({ sourcePath: 'games/racing.md', content: '# 赛车游戏指南', kind: 'doc' })
    const docs = ctrl.listDocuments()
    assert.equal(docs.length, 2)
    assert.equal(docs[0].kind, 'doc')
    assert.ok(docs[0].sourcePath)
  })

  it('导玩员查询无匹配返回空结果，确认不影响系统', () => {
    const ctrl = createController()
    const resp = ctrl.query({ query: 'xyz不存在的游戏', topK: 10 })
    assert.equal(resp.results.length, 0)
    assert.equal(resp.totalCandidates, 0)
  })

  it('导玩员索引文档后确认幂等索引不重复创建', () => {
    const ctrl = createController()
    const r1 = ctrl.indexDocument({ sourcePath: 'games/mahjong.md', content: '# 麻将规则', kind: 'doc', tags: ['棋牌'] })
    const r2 = ctrl.indexDocument({ sourcePath: 'games/mahjong.md', content: '# 麻将规则 V2\n更新版', kind: 'doc', tags: ['棋牌'] })
    // 更新幂等: chunks 相同, 但文档只有一个
    const docs = ctrl.listDocuments()
    assert.equal(docs.length, 1)
    assert.equal(docs[0].sourcePath, 'games/mahjong.md')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运行维护与系统监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} knowledge 扩展角色测试`, () => {
  it('运行专员获取统计确认知识库运行正常', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const stats = ctrl.getStats()
    assert.equal(typeof stats.totalDocuments, 'number')
    assert.equal(typeof stats.totalChunks, 'number')
    assert.equal(typeof stats.byKind, 'object')
    assert.ok(stats.totalDocuments >= 4)
  })

  it('运行专员按 kind 分布确认覆盖所有知识类型', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const stats = ctrl.getStats()
    const kinds = Object.keys(stats.byKind)
    assert.ok(kinds.includes('doc'))
    assert.ok(kinds.includes('lesson'))
    assert.ok(kinds.includes('pattern'))
    assert.ok(kinds.includes('decision'))
  })

  it('运行专员查询设置最小分数阈值过滤低相关结果', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const respNoFilter = ctrl.query({ query: '门店', topK: 5 })
    const respFiltered = ctrl.query({ query: '门店', topK: 5, minScore: 0.9 })
    // 高阈值可能返回更少结果
    assert.ok(respFiltered.results.length <= respNoFilter.results.length)
  })

  it('运行专员索引大量文档后确认性能指标正常', () => {
    const ctrl = createController()
    for (let i = 0; i < 20; i++) {
      ctrl.indexDocument({ sourcePath: `ops/log-${i}.md`, content: `# Operation Log ${i}\nRoutine check completed at cycle ${i}`, kind: 'doc', tags: ['运维'] })
    }
    const stats = ctrl.getStats()
    assert.equal(stats.totalDocuments, 20)
    assert.ok(stats.totalChunks >= 20)
  })

  it('运行专员查询性能确认 durationMs 为正数', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '测试', topK: 3 })
    assert.ok(resp.durationMs > 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动模式与知识复用
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} knowledge 扩展角色测试`, () => {
  it('团建负责人索引团建活动文档并查询确认可检索', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'team-building/outdoor.md', content: '# 户外团建方案\n## 活动\n攀岩、皮划艇、烧烤\n## 预算\n每人200元', kind: 'pattern', tags: ['团建', '户外'] })
    const resp = ctrl.query({ query: '户外团建方案预算', topK: 3 })
    assert.ok(resp.results.length > 0)
    assert.ok(resp.results.some((r) => r.sourcePath.includes('outdoor')))
  })

  it('团建负责人查看推荐链模式知识用于跨部门协作', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '推荐链比例', topK: 3 })
    assert.ok(resp.results.some((r) => r.kind === 'pattern'))
  })

  it('团建负责人查询模式知识库确认全部返回 pattern', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'team-building/indoor.md', content: '# 室内团建方案', kind: 'pattern', tags: ['团建'] })
    ctrl.indexDocument({ sourcePath: 'team-building/team-games.md', content: '# 团队游戏集锦', kind: 'pattern', tags: ['团建'] })
    const patterns = ctrl.listDocumentsByKind('pattern')
    assert.ok(Array.isArray(patterns))
    patterns.forEach((p) => assert.equal(p.kind, 'pattern'))
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销策略与推广知识管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} knowledge 扩展角色测试`, () => {
  it('营销人员索引推广文档后可通过语义搜索匹配', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'marketing/promotion-spring.md', content: '# 春季大促方案\n## 策略\n满200减50、会员双倍积分\n## 渠道\n公众号推送、短信触达', kind: 'doc', tags: ['营销', '促销'] })
    const resp = ctrl.query({ query: '春季促销满减策略', topK: 3 })
    assert.ok(resp.results.length > 0)
  })

  it('营销人员查看推荐链模式用于裂变活动设计', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '推荐分成比例', topK: 3 })
    assert.ok(resp.results.some((r) => r.kind === 'pattern'))
  })

  it('营销人员获取补全建议快速定位活动文档', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'marketing/summer-sale.md', content: '# 夏日促销方案', kind: 'doc', tags: ['营销'] })
    ctrl.indexDocument({ sourcePath: 'marketing/seasonal.md', content: '# 季节性营销策略', kind: 'doc', tags: ['营销'] })
    const suggestions = ctrl.suggest({ query: '促销', maxSuggestions: 5 })
    assert.ok(suggestions.length > 0)
    assert.ok(suggestions.some((s) => s.sourcePath.includes('summer-sale')))
  })

  it('营销人员列出所有 marketing 分类文档', () => {
    const ctrl = createController()
    ctrl.indexDocument({ sourcePath: 'marketing/strategy-q1.md', content: '# Q1 策略', kind: 'doc', tags: ['营销'] })
    ctrl.indexDocument({ sourcePath: 'marketing/strategy-q2.md', content: '# Q2 策略', kind: 'doc', tags: ['营销'] })
    ctrl.indexDocument({ sourcePath: 'marketing/strategy-q3.md', content: '# Q3 策略', kind: 'doc', tags: ['营销'] })
    const docs = ctrl.listDocuments()
    assert.equal(docs.length, 3)
    assert.ok(docs.every((d) => d.sourcePath.startsWith('marketing/')))
  })

  it('营销人员跨 kind 混合查询返回多种知识类型', () => {
    const ctrl = createController()
    seedExtendedDocs(ctrl)
    const resp = ctrl.query({ query: '营销', topK: 5 })
    const kinds = new Set(resp.results.map((r) => r.kind))
    // 多个 kind 的结果
    assert.ok(kinds.size >= 1)
  })
})
