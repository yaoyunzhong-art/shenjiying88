import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [knowledge] [C] 角色场景测试
 *
 * 8 角色视角的知识库业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个业务场景（正常流程 + 异常/权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { KnowledgeController, resetKnowledgeControllerState } from './knowledge.controller'
import { KnowledgeService } from './knowledge.service'
import { KnowledgeIndexerService } from './knowledge-indexer.service'

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
    sourcePath: 'docs/handbook/employee-handbook.md',
    content: '# 员工手册\n\n## 考勤制度\n\n上班时间 09:00-18:00 弹性半小时\n\n## 休假政策\n\n年假 5 天起 每满一年增加 1 天',
    kind: 'doc',
    tags: ['HR', '制度'],
  })
  ctrl.indexDocument({
    sourcePath: 'docs/security/network-policy.md',
    content: '# 网络安全策略\n\n## 端口管理\n\n开放 80 443 8080\n\n## 白名单\n\nAPI 网关 IP 白名单',
    kind: 'doc',
    tags: ['安全'],
  })
  ctrl.indexDocument({
    sourcePath: 'docs/marketing/campaign-checklist.md',
    content: '# 活动检查清单\n\n## 准备步骤\n\n1. 确认预算 2. 设计素材 3. 短信推送 4. 优惠券发放 5. 活动后复盘',
    kind: 'doc',
    tags: ['营销', '活动'],
  })
}

/** 计算两个字符串在相同位置相同字符的比例 (0~1) */
function charOverlap(a: string, b: string): number {
  if (!a || !b) return 0
  const setA = new Set(a.toLowerCase())
  const setB = new Set(b.toLowerCase())
  let common = 0
  for (const ch of setA) {
    if (setB.has(ch)) common++
  }
  return common / Math.max(setA.size, setB.size)
}

/** 查询并验证至少有一个结果与查询相关（检查字符重叠度） */
function assertQueryRelevant(
  result: ReturnType<KnowledgeController['query']>,
  keywords: string[],
) {
  assert.ok(result.results.length >= 1, '应返回至少 1 个结果')
  const hasRelevant = result.results.some(r =>
    keywords.some(kw => r.content.toLowerCase().includes(kw.toLowerCase()) || charOverlap(r.content, kw) > 0.3)
  )
  assert.ok(hasRelevant, `查询结果应包含关键字: ${keywords.join(', ')}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// 👔 店长 —— 门店整体运营知识
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 店长检索门店 SOP 文档获取日常运营指导', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)

    const result = ctrl.query({ query: '门店 SOP 开店流程', topK: 5 })
    assert.equal(result.query, '门店 SOP 开店流程')
    assert.ok(result.results.length >= 1)
  })

  it('场景2: 店长查看知识库统计了解文档覆盖度', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)

    const stats = ctrl.getStats()
    assert.ok(stats.totalDocuments >= 4)
    assert.ok(typeof stats.totalChunks === 'number')
    assert.ok(stats.totalChunks >= 4)
  })

  it('场景3(边界): 店长检索空内容应返回空结果不崩溃', () => {
    const ctrl = createController()
    const result = ctrl.query({ query: '', topK: 5 })
    assert.ok(Array.isArray(result.results))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒 前台 —— 日常会员知识检索
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 前台索引并检索会员权益指导对客沟通', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/member/benefits.md',
      content: '# 会员权益\n\n## VIP\n9.5 折 生日双倍积分\n\n## SVIP\n8.5 折 专属客服',
      kind: 'doc',
      tags: ['会员'],
    })

    const result = ctrl.query({ query: '会员权益 VIP', topK: 3 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2(边界): 前台查询不合法的 kind 过滤应返回友好错误', () => {
    const ctrl = createController()
    const docs = ctrl.listDocumentsByKind('INVALID_KIND_XYZ')
    assert.ok(typeof docs === 'object' && 'error' in (docs as any))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥 HR —— 员工手册与制度管理
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: HR 索引并检索员工手册中的考勤制度', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/hr/attendance-policy.md',
      content: '# 考勤制度\n\n## 上班时间\n09:00-18:00 弹性半小时\n\n## 迟到处罚\n每月累计 3 次警告',
      kind: 'doc',
      tags: ['HR', '考勤'],
    })

    const result = ctrl.query({ query: '考勤迟到处罚', topK: 5 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2(边界): HR 重新索引同一文档应幂等更新', () => {
    const ctrl = createController()
    const first = ctrl.indexDocument({
      sourcePath: 'docs/hr/training-plan.md',
      content: '# 培训计划 V1\n\n新人培训 3 天',
      kind: 'doc',
      tags: ['HR'],
    })
    const second = ctrl.indexDocument({
      sourcePath: 'docs/hr/training-plan.md',
      content: '# 培训计划 V2\n\n新人培训 5 天\n\n晋升培训 2 天',
      kind: 'doc',
      tags: ['HR'],
    })

    // 幂等: 同一 sourcePath 返回相同 documentId
    assert.equal(first.documentId, second.documentId)
    const doc = ctrl.getDocument(first.documentId)
    assert.ok(typeof doc === 'object' && !('error' in (doc as any)))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧 安监 —— 安全策略知识库
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 安监检索网络防火墙策略文档', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)

    const result = ctrl.query({ query: '网络安全策略端口管理', topK: 5 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2(边界): 安监删除不存在的文档应返回 ok=false', () => {
    const ctrl = createController()
    const result = ctrl.deleteDocument('non-existent-id')
    assert.equal(result.ok, false)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮 导玩员 —— 设备与游戏知识
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 导玩员索引设备故障手册供检索', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/equipment/troubleshooting.md',
      content: '# 设备故障排查\n\n## 投币器\n1. 检查硬币识别器 2. 重置电源 3. 联系供应商\n\n## 黑屏\n1. 检查电源线 2. 重启设备 3. 检查信号线',
      kind: 'doc',
      tags: ['设备'],
    })

    // 验证文档已索引
    const documents = ctrl.listDocuments()
    assert.ok(documents.some(d => d.sourcePath.includes('troubleshooting')))

    // 语义检索
    const result = ctrl.query({ query: '设备故障投币器', topK: 5 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2(边界): 导玩员检索超长 query 不应崩溃', () => {
    const ctrl = createController()
    const longQuery = '设备 ' + 'x'.repeat(10000)
    const result = ctrl.query({ query: longQuery, topK: 5 })
    assert.ok(Array.isArray(result.results))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 运行专员 —— 运维知识 + Lessons
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 运行专员检索 lessons 预防已知问题', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/lessons/redis-lock.md',
      content: '# Lesson: Redis 锁超时\n\n## 根因\n业务处理超时导致并发\n\n## 修复\nRedlock 算法 + 看门狗续期',
      kind: 'lesson',
      tags: ['Redis'],
    })
    ctrl.indexDocument({
      sourcePath: 'docs/lessons/db-pool.md',
      content: '# Lesson: 连接池耗尽\n\n## 根因\n长查询未释放连接\n\n## 修复\n1. 设置 timeout 2. 增加 maxPool 3. 优化慢查询',
      kind: 'lesson',
      tags: ['数据库'],
    })

    const result = ctrl.query({ query: 'Redis 锁并发问题', topK: 5 })
    assert.ok(result.results.length >= 1)
    assert.ok(result.results.some(r => r.kind === 'lesson'))
  })

  it('场景2(边界): 运行专员删除文档后确认不可查询', () => {
    const ctrl = createController()
    const { documentId } = ctrl.indexDocument({
      sourcePath: 'docs/temp/note.md',
      content: '# 临时记录\n\n待清理',
      kind: 'doc',
      tags: ['临时'],
    })

    assert.equal(ctrl.listDocuments().length, 1)
    assert.equal(ctrl.deleteDocument(documentId).ok, true)
    assert.equal(ctrl.listDocuments().length, 0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝 团建 —— 活动方案与场地管理
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 团建索引并检索活动方案文档', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/teambuilding/outdoor.md',
      content: '# 户外团建方案\n\n## 项目\n拓展训练 烧烤派对 团队竞赛\n\n## 预算\n每人 200 元 含交通餐饮',
      kind: 'doc',
      tags: ['团建', '户外'],
    })
    ctrl.indexDocument({
      sourcePath: 'docs/teambuilding/indoor.md',
      content: '# 室内团建方案\n\n## 项目\n桌游对战 KTV 歌唱赛 密室逃脱\n\n## 预算\n每人 150 元',
      kind: 'doc',
      tags: ['团建', '室内'],
    })

    const result = ctrl.query({ query: '团建方案户外预算', topK: 5 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2(边界): 团建查询不存在的文档应返回错误信息', () => {
    const ctrl = createController()
    const result = ctrl.getDocument('nonexistent-doc-id')
    assert.ok(typeof result === 'object')
    assert.ok('error' in (result as any))
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢 营销 —— 活动文档与知识库
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销知识库场景`, () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('场景1: 营销检索活动检查清单和营销参考', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/marketing/promotion-guide.md',
      content: '# 促销指南\n\n## 节假日促销\n春节满减 暑期充值 双十一折扣\n\n## 拉新\n推荐好友注册送积分',
      kind: 'doc',
      tags: ['营销', '促销'],
    })
    seedBasicKnowledge(ctrl)

    const result = ctrl.query({ query: '促销活动拉新推荐', topK: 5 })
    assert.ok(result.results.length >= 1)
  })

  it('场景2: 营销通过 suggest 获取知识补全建议', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/marketing/past-campaigns.md',
      content: '# 往期活动总结\n\n## Q1 春节活动\n预算 50 万 新增会员 2000 人\n\n## Q2 春季活动\n预算 30 万 新增会员 1500 人',
      kind: 'doc',
      tags: ['营销', '总结'],
    })

    const suggestions = ctrl.suggest({ query: '活动预算方案', maxSuggestions: 3 })
    assert.ok(Array.isArray(suggestions))
    assert.ok(suggestions.length >= 1)
    assert.ok(suggestions.every(s => typeof s.score === 'number'))
  })

  it('场景3(边界): 营销按 kind 过滤文档', () => {
    const ctrl = createController()
    ctrl.indexDocument({
      sourcePath: 'docs/spec/api-spec.md',
      content: '# API 规范\n\nGET /api/users 获取用户列表',
      kind: 'spec',
      tags: ['API'],
    })

    const specDocs = ctrl.listDocumentsByKind('spec')
    assert.ok(Array.isArray(specDocs))
    assert.equal(specDocs.length, 1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 跨角色集成场景
// ══════════════════════════════════════════════════════════════════════════════
describe('跨角色知识库集成场景', () => {
  beforeEach(() => {
    resetKnowledgeControllerState()
  })

  it('多角色共享同一知识库: 文档索引 -> 检索 -> 按 kind 过滤的一致视图', () => {
    const ctrl = createController()

    // 👔 店长索引核心运营文档
    ctrl.indexDocument({
      sourcePath: 'docs/operations/daily-report.md',
      content: '# 日报模板\n\n## 今日营业\n客流 200 人 营收 15000 元 新增会员 30 人',
      kind: 'doc',
      tags: ['运营'],
    })
    ctrl.indexDocument({
      sourcePath: 'docs/operations/weekly-report.md',
      content: '# 周报模板\n\n## 本周营业\n总客流 1400 人 总营收 105000 元',
      kind: 'doc',
      tags: ['运营'],
    })

    // 🛒 前台检索门店运营信息
    const frontResult = ctrl.query({ query: '日报营业数据', topK: 5 })
    assert.ok(frontResult.results.length >= 1)

    // 📢 营销查阅以做活动分析
    const marketingResult = ctrl.query({ query: '客流营收报告', topK: 5 })
    assert.ok(marketingResult.results.length >= 1)
  })

  it('重置索引后应呈现空状态', () => {
    const ctrl = createController()
    seedBasicKnowledge(ctrl)
    assert.ok(ctrl.listDocuments().length > 0)

    ctrl.resetIndex()
    assert.equal(ctrl.listDocuments().length, 0)
    assert.equal(ctrl.getStats().totalDocuments, 0)
  })
})
