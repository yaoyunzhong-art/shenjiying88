import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  KnowledgeBaseManager,
  RAGPipeline,
  SalesScriptGenerator,
} from './ai-rag.service'

/**
 * 🐜 [ai-rag] 角色扩展测试
 * 覆盖 RAG 知识库的边界条件和复杂场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function setup() {
  const kb = new KnowledgeBaseManager()
  const rag = new RAGPipeline(kb)
  const scriptGen = new SalesScriptGenerator()
  return { kb, rag, scriptGen }
}

describe(`${ROLES.StoreManager} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('店长创建知识库文档并查看统计', () => {
    svc.kb.addDocument('store', { id: 'doc1', content: '门店管理制度手册内容包含排班和考勤' })
    const stats = svc.kb.getCollectionStats('store')
    expect(stats.documentCount).toBe(1)
    expect(stats.chunkCount).toBeGreaterThanOrEqual(1)
  })

  it('店长查询空集合统计不报错', () => {
    const stats = svc.kb.getCollectionStats('empty-collection')
    expect(stats.documentCount).toBe(0)
    expect(stats.chunkCount).toBe(0)
  })
})

describe(`${ROLES.FrontDesk} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('前台向知识库添加多篇文档并列表', () => {
    svc.kb.addDocument('faq', { id: 'faq1', content: '营业时间是早9点到晚10点' })
    svc.kb.addDocument('faq', { id: 'faq2', content: '会员卡可以在前台办理' })
    const docs = svc.kb.listDocuments('faq')
    expect(docs).toHaveLength(2)
  })

  it('前台查询不存在文档返回 null', () => {
    const doc = svc.kb.getDocument('faq', 'no-such')
    expect(doc).toBeNull()
  })
})

describe(`${ROLES.HR} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('HR 更新已存在文档内容', () => {
    svc.kb.addDocument('hr', { id: 'policy', content: '旧版考勤制度' })
    const updated = svc.kb.updateDocument('hr', 'policy', '新版考勤制度 v2')
    expect(updated).not.toBeNull()
    expect(updated!.chunks[0].content).toContain('新版')
  })

  it('HR 更新不存在文档返回 null', () => {
    const updated = svc.kb.updateDocument('hr', 'no-such', '内容')
    expect(updated).toBeNull()
  })
})

describe(`${ROLES.Safety} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('安监创建含敏感词文档并通过 RAG 检索', async () => {
    svc.kb.addDocument('security', { id: 'sec1', content: '安全管理规定禁止打架斗殴和分裂行为' })
    const result = await svc.rag.query('安全管理规定', 'security')
    expect(result.sources).toContain('sec1')
    expect(result.answer.length).toBeGreaterThan(0)
  })

  it('安监删除文档后确认已删除', () => {
    svc.kb.addDocument('audit', { id: 'del1', content: '待删除文档' })
    const deleted = svc.kb.deleteDocument('audit', 'del1')
    expect(deleted).toBe(true)
    expect(svc.kb.getDocument('audit', 'del1')).toBeNull()
  })
})

describe(`${ROLES.Guide} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('导玩员检索时获取带分值的 chunk 列表', () => {
    svc.kb.addDocument('games', { id: 'g1', content: '投篮机操作指南' })
    svc.kb.addDocument('games', { id: 'g2', content: '跳舞机使用说明' })
    const chunks = svc.rag.retrieve('投篮机', 'games', 3)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
    expect(chunks[0].score).toBeGreaterThan(0)
  })
})

describe(`${ROLES.Ops} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('运行专员对空集合 RAG 查询返回无结果信息', async () => {
    const result = await svc.rag.query('任何问题', 'empty')
    expect(result.answer).toContain('没有找到')
    expect(result.sources).toEqual([])
  })

  it('运行专员获取 RAG 统计信息', () => {
    svc.kb.addDocument('ops', { id: 'o1', content: '日常运营流程 A' })
    svc.kb.addDocument('ops', { id: 'o2', content: '日常运营流程 B' })
    const stats = svc.rag.getStats('ops')
    expect(stats.documents).toBe(2)
    expect(stats.chunks).toBeGreaterThanOrEqual(2)
  })
})

describe(`${ROLES.Teambuilding} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建专员多轮对话 RAG 持续回答', async () => {
    svc.kb.addDocument('team', { id: 't1', content: '团建活动策划包含破冰游戏、拓展训练和烧烤' })
    const r1 = await svc.rag.chat([{ role: 'user', content: '团建包含哪些活动' }], 'team')
    expect(r1.reply.length).toBeGreaterThan(0)
    expect(r1.sources).toContain('t1')
  })

  it('团建专员对话无 user message 返回默认问候', async () => {
    const r = await svc.rag.chat([{ role: 'system', content: '你好' }], 'team')
    expect(r.reply).toContain('请问')
  })
})

describe(`${ROLES.Marketing} ai-rag 扩展测试`, () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销专员生成产品话术不同语气返回不同内容', () => {
    const pro = svc.scriptGen.generateProductScript('prod-001', 'professional')
    const fri = svc.scriptGen.generateProductScript('prod-001', 'friendly')
    expect(pro.startsWith('【专业版】')).toBe(true)
    expect(fri.startsWith('【亲和版】')).toBe(true)
  })

  it('营销专员处理价格异议话术', () => {
    const script = svc.scriptGen.generateObjectionScript('prod-001', 'price')
    expect(script.length).toBeGreaterThan(10)
    expect(script).toContain('产品')
  })

  it('营销专员生成跟进话术', () => {
    const script = svc.scriptGen.generateFollowUpScript('cust-001')
    expect(script).toContain('张总')
    expect(script).toContain('智能营销系统')
  })

  it('营销专员本地化话术到英文', () => {
    const script = svc.scriptGen.localizeScript('您好，谢谢，优惠', 'en-US')
    expect(script).toContain('Hello')
    expect(script).toContain('Thanks')
    expect(script).toContain('discount')
  })

  it('营销专员生成未知产品话术不报错', () => {
    const script = svc.scriptGen.generateProductScript('prod-unknown', 'professional')
    expect(script).toContain('产品 prod-unknown')
  })
})
