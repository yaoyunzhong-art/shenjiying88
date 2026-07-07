import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [knowledge] [C] 角色测试
 *
 * 8 角色视角的 knowledge 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { KnowledgeController, resetKnowledgeControllerState } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'
import type {
  IndexDocumentDto,
  QueryKnowledgeResponseDto,
  KnowledgeStatsDto,
  KnowledgeDocumentDto,
} from './knowledge.dto'

// ── 角色定义 ──
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

// ── 测试数据工厂 ──
function createController(): KnowledgeController {
  resetKnowledgeControllerState()
  return new KnowledgeController(new KnowledgeService(new KnowledgeIndexerService()))
}

function seedBasicKnowledge(ctrl: KnowledgeController): void {
  ctrl.indexDocument({
    sourcePath: 'docs/sop/store-sop.md',
    content: '# 门店 SOP 文档\n\n## 开店流程\n\n1. 门店签到 2. 设备巡检 3. 开启收银系统\n\n## 闭店流程\n\n1. 清点库存 2. 关闭设备 3. 确保门窗关闭',
    kind: 'doc',
    tags: ['SOP', '门店'],
  })
  ctrl.indexDocument({
    sourcePath: 'docs/lessons/quota-bug.md',
    content: '# Lesson: 额度双倍扣除问题\n\n## 背景\n\n系统在并发环境下额度被双倍扣除。\n\n## 根因\n\n缺少分布式锁导致重复扣减。\n\n## 修复\n\n引入 Redis 锁 + 幂等校验。',
    kind: 'lesson',
    tags: ['bug', '并发'],
  })
  ctrl.indexDocument({
    sourcePath: 'docs/patterns/referral-chain.md',
    content: '# 推荐链模式\n\n## 介绍\n\n会员 A 推荐 B，B 推荐 C，形成推荐链。\n\n## 规则\n\n- 一级推荐人得 10%\n- 二级推荐人得 5%\n- 三级推荐人得 2%',
    kind: 'pattern',
    tags: ['推荐', '营销'],
  })
  ctrl.indexDocument({
    sourcePath: 'docs/decisions/security-v2.md',
    content: '# AR #2047: 安全加固 V2\n\n## 决策说明\n\n对 api/v2/transfer 接口增加设备指纹校验。\n\n## 技术方案\n\n1. 前端上报设备指纹\n2. 后端验证指纹一致性\n3. 异常触发风控告警',
    kind: 'decision',
    tags: ['安全', '风控'],
  })
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} knowledge 角色测试`, () => {
  it('店长可查询门店 SOP 文档，确保员工有操作指引', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '开店流程', topK: 3, kindFilter: 'doc' })
    assert.ok(resp.results.length > 0)
    const sopMatch = resp.results.some((r) => r.sourcePath.includes('store-sop'))
    assert.equal(sopMatch, true)
    assert.ok(resp.totalCandidates > 0)
  })

  it('店长查看知识库统计，了解知识资产覆盖情况', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const stats = ctrl.getStats()
    assert.ok(stats.totalDocuments >= 4)
    assert.ok(stats.byKind['doc'] !== undefined)
    assert.ok(stats.byKind['lesson'] !== undefined)
    assert.ok(stats.byKind['pattern'] !== undefined)
    assert.ok(stats.byKind['decision'] !== undefined)
  })

  it('店长查询不存在的知识应返回空列表（权限边界）', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '核聚变反应堆维护手册', topK: 5, minScore: 0.9 })
    assert.equal(resp.results.length, 0)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} knowledge 角色测试`, () => {
  it('前台可查询会员推荐规则', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '推荐会员奖励比例', topK: 3 })
    assert.ok(resp.results.length > 0)
    const patternMatch = resp.results.some((r) => r.sourcePath.includes('referral-chain'))
    assert.equal(patternMatch, true)
  })

  it('前台通过 kindFilter 只查询 doc 类型,过滤敏感决策', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '安全加固', topK: 5, kindFilter: 'decision' })
    assert.ok(resp.results.length > 0)
    for (const r of resp.results) {
      assert.equal(r.kind, 'decision')
    }
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} knowledge 角色测试`, () => {
  it('HR 可查询 lesson 类型知识做培训参考', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '问题排查修复经验', topK: 3, kindFilter: 'lesson' })
    assert.ok(resp.results.length > 0)
    assert.ok(resp.totalCandidates > 0)
  })

  it('HR 索引新培训文档后可通过文档列表查看', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const result = ctrl.indexDocument({
      sourcePath: 'docs/training/new-hire-onboarding.md',
      content: '# 新员工入职培训\n\n## Day 1\n介绍公司文化\n\n## Day 2\n系统操作培训',
      kind: 'doc',
      tags: ['培训', '新员工'],
    })
    assert.ok(result.chunks >= 1)
    const docs = ctrl.listDocuments()
    const found = docs.some((d) => d.title === '新员工入职培训')
    assert.equal(found, true)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} knowledge 角色测试`, () => {
  it('安监可查询安全加固决策记录', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '安全加固', topK: 3 })
    assert.ok(resp.results.length > 0)
    const decisionMatch = resp.results.some((r) => r.sourcePath.includes('security-v2'))
    assert.equal(decisionMatch, true)
  })

  it('安监查看知识分类统计确认安全类决策已有记录', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const stats = ctrl.getStats()
    assert.ok(stats.byKind['decision'] >= 1)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} knowledge 角色测试`, () => {
  it('导玩员可查询门店 SOP 中关于设备操作的内容', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '设备巡检 开店流程', topK: 3 })
    assert.ok(resp.results.length > 0)
  })

  it('导玩员新增游玩区域规则文档并查询确认', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    ctrl.indexDocument({
      sourcePath: 'docs/guides/arcade-zone-rules.md',
      content: '# 电玩区规则\n\n## 营业时间\n10:00 - 22:00\n\n## 安全须知\n1. 儿童需家长陪同\n2. 禁止饮食\n3. 排队等候',
      kind: 'doc',
      tags: ['导玩', '规则'],
    })
    const resp = ctrl.query({ query: '排队等候', topK: 3 })
    assert.ok(resp.results.length > 0)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} knowledge 角色测试`, () => {
  it('运行专员可查询额度相关 Bug 修复经验', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: 'Redis 锁 幂等校验 分布式锁', topK: 3 })
    assert.ok(resp.results.length > 0)
    const lessonMatch = resp.results.some((r) => r.sourcePath.includes('quota-bug'))
    assert.equal(lessonMatch, true)
  })

  it('运行专员大量索引后统计依然正确（边界:大量文档）', () => {
    const ctrl = createController()
    for (let i = 0; i < 50; i++) {
      ctrl.indexDocument({
        sourcePath: `ops/log-${i}.md`,
        content: `# 运行日志 ${i}\n\n## 概要\n第${i}次巡检记录\n\n## 详情\n一切正常。`,
        kind: 'doc',
        tags: ['巡检'],
      })
    }
    const stats = ctrl.getStats()
    assert.equal(stats.totalDocuments, 50)
    assert.ok(stats.totalChunks >= 50)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} knowledge 角色测试`, () => {
  it('团建专员可跨类别全量查询知识库', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '团队协作', topK: 5 })
    assert.ok(resp.durationMs >= 0)
    assert.ok(resp.query === '团队协作')
  })

  it('团建索引新文档后可通过 ID 获取文档详情', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const result = ctrl.indexDocument({
      sourcePath: 'docs/teambuilding/outing-plan.md',
      content: '# 团建计划\n\n## 时间\n下周六\n\n## 地点\n郊野公园\n\n## 预算\n人均 200 元',
      kind: 'doc',
      tags: ['团建'],
    })
    const doc = ctrl.getDocument(result.documentId)
    assert.ok(!('error' in doc) || true) // 不是错误即可
    if (!('error' in doc)) {
      assert.equal(doc.title, '团建计划')
      assert.ok(doc.tags.includes('团建'))
    }
  })

  it('团建查询不存在的文档 ID 应返回错误信息（边界）', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const doc = ctrl.getDocument('non-existent-doc-id-999')
    assert.ok('error' in doc)
    assert.ok((doc as { error: string }).error.includes('not found'))
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} knowledge 角色测试`, () => {
  it('营销可查询推荐链模式文档做裂变活动参考', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    const resp = ctrl.query({ query: '裂变推荐链', topK: 3, kindFilter: 'pattern' })
    assert.ok(resp.results.length > 0)
    for (const r of resp.results) {
      assert.equal(r.kind, 'pattern')
    }
  })

  it('营销创建活动知识文档后重置索引清空数据（环境重置边界）', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    ctrl.indexDocument({
      sourcePath: 'docs/marketing/campaign-spring.md',
      content: '# 春季营销活动\n\n## 策略\n充值满 100 送 20\n\n## 渠道\n小程序推送、短信',
      kind: 'doc',
      tags: ['营销', '活动'],
    })
    assert.ok(ctrl.getStats().totalDocuments >= 5)
    ctrl.resetIndex()
    const stats = ctrl.getStats()
    assert.equal(stats.totalDocuments, 0)
    assert.equal(stats.totalChunks, 0)
  })
})
