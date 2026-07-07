import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRagController } from './ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'
import { CollectionType } from './ai-rag.entity'
import type { StoredDocument, RetrievedChunk } from './ai-rag.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 辅助函数 ──

function makeController(): AiRagController {
  const kb = new KnowledgeBaseManager()
  const rag = new RAGPipeline(kb)
  const scriptGen = new SalesScriptGenerator()
  return new AiRagController(kb, rag, scriptGen)
}

/** 将 Observable 转为 Promise 获取结果 */
function obsPromise<T = any>(obs: any): Promise<{ success: boolean; data: T; message?: string }> {
  return new Promise((resolve) => obs.subscribe((v: any) => resolve(v)))
}

// ──────────── 👔 店长：管理RAG知识库文档 ────────────
describe(`${ROLES.TenantAdmin} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以创建知识库文档（正常流程）', async () => {
    const result = await obsPromise(
      ctrl.createDocument({
        collection: CollectionType.PRODUCTS,
        content: '智能营销系统提供AI驱动的精准用户画像、多渠道自动触达和实时数据分析功能。',
        id: 'doc-admin-01',
        title: '营销系统产品简介',
      })
    )
    assert.equal(result.success, true)
    assert.equal(result.data.id, 'doc-admin-01')
    assert.equal(result.data.collection, CollectionType.PRODUCTS)
    assert.equal(result.data.metadata.title, '营销系统产品简介')
    assert.ok(result.data.chunks.length >= 1)
    assert.ok(result.data.createdAt)
    assert.ok(result.data.updatedAt)
  })

  it('店长可以更新已存在的文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.PRODUCTS,
      content: '旧版内容',
      id: 'doc-admin-02',
    }))
    const result = await obsPromise(
      ctrl.updateDocument('products', 'doc-admin-02', {
        content: '新版更新内容，增加更多AI特性描述。',
        title: '更新版产品简介',
      })
    )
    assert.equal(result.success, true)
    assert.equal(result.data.id, 'doc-admin-02')
    assert.equal(result.data.metadata.title, '更新版产品简介')
    assert.ok(result.data.chunks[0].content.includes('新版'))
  })

  it('店长可以删除知识库文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.FAQ,
      content: '常见问题：如何重置密码？',
      id: 'doc-admin-03',
    }))
    const delResult = await obsPromise(ctrl.deleteDocument('faq', 'doc-admin-03'))
    assert.equal(delResult.success, true)

    const getResult = await obsPromise(ctrl.getDocument('faq', 'doc-admin-03'))
    assert.equal(getResult.success, false)
    assert.ok(getResult.message?.includes('不存在'))
  })

  it('店长可以列出指定集合的全部文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.FAQ, content: 'Q1内容', id: 'doc-admin-04' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.FAQ, content: 'Q2内容', id: 'doc-admin-05' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.PRODUCTS, content: '产品介绍', id: 'doc-admin-06' }))

    const faqResult = await obsPromise(ctrl.listDocuments('faq'))
    assert.equal(faqResult.success, true)
    assert.equal(faqResult.data.length, 2)

    const prodResult = await obsPromise(ctrl.listDocuments('products'))
    assert.equal(prodResult.success, true)
    assert.equal(prodResult.data.length, 1)
  })

  it('店长更新不存在的文档应返回失败（边界）', async () => {
    const result = await obsPromise(
      ctrl.updateDocument('products', 'doc-admin-nonexistent', { content: '更新内容' })
    )
    assert.equal(result.success, false)
    assert.ok(result.message?.includes('不存在'))
  })

  it('店长删除不存在的文档应返回失败（边界）', async () => {
    const result = await obsPromise(ctrl.deleteDocument('products', 'doc-admin-nonexistent'))
    assert.equal(result.success, false)
    assert.ok(result.message?.includes('不存在'))
  })

  it('店长可以获取集合统计信息（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.SUPPORT, content: '支持文档1', id: 'doc-admin-07' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.SUPPORT, content: '支持文档2', id: 'doc-admin-08' }))
    const result = await obsPromise(ctrl.getCollectionStats('support'))
    assert.equal(result.success, true)
    assert.equal(result.data.documentCount, 2)
    assert.ok(result.data.chunkCount >= 2)
  })

  it('店长可以查看单个文档详情（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.POLICIES,
      content: '门店安全政策：每日检查消防设备。',
      id: 'doc-admin-09',
      title: '安全政策',
    }))
    const result = await obsPromise(ctrl.getDocument('policies', 'doc-admin-09'))
    assert.equal(result.success, true)
    assert.equal(result.data.id, 'doc-admin-09')
    assert.equal(result.data.metadata.title, '安全政策')
    assert.ok(result.data.chunks.length >= 1)
  })
})

// ──────────── 🛒 前台：查询FAQ/知识库 ────────────
describe(`${ROLES.Reception} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以查询 FAQ 知识库获取答案（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.FAQ,
      content: '如何办理会员卡？答：携带身份证到前台即可办理，免费注册。如何充值？答：支持现金、微信、支付宝。',
      id: 'doc-fd-01',
    }))
    const result = await ctrl.query({ question: '如何办理会员卡', collection: CollectionType.FAQ })
    assert.equal(result.success, true)
    assert.ok(result.data?.answer)
    assert.ok(result.data!.sources.includes('doc-fd-01'))
    assert.ok(result.data!.retrievedChunks > 0)
    assert.ok(result.data!.latencyMs >= 0)
  })

  it('前台可以通过 RAG 检索获取相关文档片段（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.FAQ,
      content: '营业时间：周一至周日 10:00-22:00。节假日照常营业。',
      id: 'doc-fd-02',
    }))
    const result = await obsPromise(ctrl.retrieve({ question: '营业时间', collection: CollectionType.FAQ, topK: 3 }))
    assert.equal(result.success, true)
    assert.ok(result.data.length >= 1)
    assert.ok(result.data.some((c: RetrievedChunk) => c.chunk.content.includes('营业时间')))
  })

  it('前台可以通过对话接口与知识库交互（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.FAQ,
      content: '停车服务：本店提供免费停车2小时，超过按5元/小时收费。',
      id: 'doc-fd-03',
    }))
    const result = await ctrl.chat({
      messages: [{ role: 'user', content: '停车怎么收费' }],
      collection: CollectionType.FAQ,
    })
    assert.equal(result.success, true)
    assert.ok(result.data?.reply)
    assert.ok(result.data!.sources.length > 0)
  })

  it('前台查询空知识库应得到回复（边界）', async () => {
    const result = await ctrl.query({ question: '有没有任何信息', collection: CollectionType.FAQ })
    assert.equal(result.success, true)
    assert.ok(result.data?.answer)
  })

  it('前台检索空知识库应返回空数组（边界）', async () => {
    const result = await obsPromise(ctrl.retrieve({ question: '任何问题', collection: CollectionType.SUPPORT, topK: 5 }))
    assert.equal(result.success, true)
    assert.equal(result.data.length, 0)
  })
})

// ──────────── 🎮 导玩员：生成销售话术 ────────────
describe(`${ROLES.Guide} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以生成产品介绍话术（正常流程）', async () => {
    const result = await obsPromise(ctrl.generateProductScript({ productId: 'prod-001', tone: 'professional' }))
    assert.equal(result.success, true)
    assert.ok(result.data.includes('【专业版】'))
    assert.ok(result.data.includes('智能营销系统'))
    assert.ok(result.data.includes('AI 驱动的精准用户画像'))
  })

  it('导玩员可以生成使用不同语气的话术（正常流程）', async () => {
    const friendlyResult = await obsPromise(ctrl.generateProductScript({ productId: 'prod-001', tone: 'friendly' }))
    assert.equal(friendlyResult.success, true)
    assert.ok(friendlyResult.data.includes('【亲和版】'))

    const urgentResult = await obsPromise(ctrl.generateProductScript({ productId: 'prod-001', tone: 'urgent' }))
    assert.equal(urgentResult.success, true)
    assert.ok(urgentResult.data.includes('【紧迫版】'))
  })

  it('导玩员可以生成异议处理话术（正常流程）', async () => {
    const result = await obsPromise(ctrl.generateObjectionScript({ productId: 'prod-001', objectionType: 'price' }))
    assert.equal(result.success, true)
    assert.ok(result.data.length > 0)
  })

  it('导玩员可以生成客户跟进话术（正常流程）', async () => {
    const result = await obsPromise(ctrl.generateFollowUp({ customerId: 'cust-001' }))
    assert.equal(result.success, true)
    assert.ok(result.data.includes('张总') || result.data.includes('顾问'))
  })

  it('导玩员可以本地化话术（正常流程）', async () => {
    const result = await obsPromise(ctrl.localizeScript({ script: 'Hi, thanks!', locale: 'zh-CN' }))
    assert.equal(result.success, true)
    assert.ok(result.data.includes('您好') || result.data.includes('谢谢'))
  })

  it('导玩员生成话术时给定不存在的产品ID应返回默认信息（边界）', async () => {
    const result = await obsPromise(ctrl.generateProductScript({ productId: 'prod-nonexistent', tone: 'professional' }))
    assert.equal(result.success, true)
    assert.ok(result.data.length > 0)
  })
})

// ──────────── 🤝 团建：查团建活动资料 ────────────
describe(`${ROLES.Teambuilding} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以创建团建活动资料文档（正常流程）', async () => {
    const result = await obsPromise(ctrl.createDocument({
      collection: CollectionType.POLICIES,
      content: '团建活动方案：户外拓展训练、团队合作游戏、烧烤派对等。人均预算200-500元。',
      id: 'doc-tb-01',
      title: '团建活动指南',
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.metadata.title, '团建活动指南')
    assert.ok(result.data.chunks.length > 0)
  })

  it('团建可以查询团队活动资料（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.POLICIES,
      content: '团建场地推荐：城市公园、拓展基地、室内场馆。需提前一周预约。',
      id: 'doc-tb-02',
    }))
    const result = await obsPromise(ctrl.listDocuments('policies'))
    assert.equal(result.success, true)
    assert.ok(result.data.some((d: StoredDocument) => d.id === 'doc-tb-02'))
  })

  it('团建可以通过 RAG 检索团建相关资料（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.POLICIES,
      content: '团建保险：每位参与者需购买意外险，保额不低于50万元。',
      id: 'doc-tb-03',
    }))
    const result = await obsPromise(ctrl.retrieve({ question: '团建保险怎么买', collection: CollectionType.POLICIES }))
    assert.equal(result.success, true)
    assert.ok(result.data.some((c: RetrievedChunk) => c.chunk.content.includes('团建保险') || c.chunk.content.includes('意外险')))
  })

  it('团建可以修改已创建的团建资料文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.POLICIES,
      content: '旧版团建活动安排',
      id: 'doc-tb-04',
    }))
    const result = await obsPromise(ctrl.updateDocument('policies', 'doc-tb-04', {
      content: '新版团建活动安排，新增CS对抗项目。',
      title: '2026团建指南',
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.metadata.title, '2026团建指南')
    assert.ok(result.data.chunks[0].content.includes('CS对抗'))
  })

  it('团建获取集合统计时应包含团建资料（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.POLICIES, content: '团建政策A', id: 'doc-tb-05' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.POLICIES, content: '团建政策B', id: 'doc-tb-06' }))
    const result = await obsPromise(ctrl.getCollectionStats('policies'))
    assert.equal(result.success, true)
    assert.equal(result.data.documentCount, 2)
  })
})

// ──────────── 📢 营销：营销话术生成 ────────────
describe(`${ROLES.Marketing} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以创建营销方案文档（正常流程）', async () => {
    const result = await obsPromise(ctrl.createDocument({
      collection: CollectionType.PRODUCTS,
      content: '营销方案：暑期促销活动，充值1000送200，新会员首单8折。',
      id: 'doc-mkt-01',
      title: '暑期营销方案',
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.id, 'doc-mkt-01')
    assert.equal(result.data.metadata.title, '暑期营销方案')
  })

  it('营销可以为不同产品生成专业版话术（正常流程）', async () => {
    const result = await obsPromise(ctrl.generateProductScript({ productId: 'prod-002', tone: 'professional' }))
    assert.equal(result.success, true)
    assert.ok(result.data.includes('【专业版】'))
    assert.ok(result.data.includes('会员管理系统'))
  })

  it('营销可以为不同异议类型生成话术（正常流程）', async () => {
    const priceResult = await obsPromise(ctrl.generateObjectionScript({ productId: 'prod-001', objectionType: 'price' }))
    assert.equal(priceResult.success, true)
    assert.ok(priceResult.data.length > 0)
  })

  it('营销可以针对不同客户生成跟进话术（正常流程）', async () => {
    const r1 = await obsPromise(ctrl.generateFollowUp({ customerId: 'cust-001' }))
    assert.equal(r1.success, true)
    assert.ok(r1.data.includes('张总'))

    const r2 = await obsPromise(ctrl.generateFollowUp({ customerId: 'cust-002' }))
    assert.equal(r2.success, true)
    assert.ok(r2.data.includes('李经理'))
  })

  it('营销可以本地化话术到不同语言（正常流程）', async () => {
    const enResult = await obsPromise(ctrl.localizeScript({ script: '您好，谢谢！', locale: 'en-US' }))
    assert.equal(enResult.success, true)
    assert.ok(enResult.data.includes('Hello') || enResult.data.includes('Thanks'))

    const twResult = await obsPromise(ctrl.localizeScript({ script: '谢谢', locale: 'zh-TW' }))
    assert.equal(twResult.success, true)
    assert.ok(twResult.data.includes('感謝'))
  })

  it('营销可以检索营销相关的知识库内容（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.PRODUCTS,
      content: '会员积分规则：每消费1元积1分，积分可兑换礼品和折扣。',
      id: 'doc-mkt-03',
    }))
    const result = await obsPromise(ctrl.retrieve({ question: '积分兑换规则', collection: CollectionType.PRODUCTS }))
    assert.equal(result.success, true)
    assert.ok(result.data.some((c: RetrievedChunk) => c.chunk.content.includes('积分')))
  })
})

// ──────────── 🎯 运行专员：浏览知识库统计 ────────────
describe(`${ROLES.Ops} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以查看知识库集合统计（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.PRODUCTS, content: '产品A', id: 'doc-ops-01' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.PRODUCTS, content: '产品B', id: 'doc-ops-02' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.PRODUCTS, content: '产品C', id: 'doc-ops-03' }))

    const result = await obsPromise(ctrl.getCollectionStats('products'))
    assert.equal(result.success, true)
    assert.equal(result.data.documentCount, 3)
    assert.ok(result.data.chunkCount >= 3)
  })

  it('运行专员可以查看 RAG 管道统计信息（正常流程）', async () => {
    const result = await obsPromise(ctrl.getRagStats(CollectionType.FAQ))
    assert.equal(result.success, true)
    assert.equal(typeof result.data.documents, 'number')
    assert.equal(typeof result.data.chunks, 'number')
  })

  it('运行专员可以列出各集合的文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.FAQ, content: 'FAQ内容', id: 'doc-ops-04' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.SUPPORT, content: 'Support内容', id: 'doc-ops-05' }))

    const faqList = await obsPromise(ctrl.listDocuments('faq'))
    assert.equal(faqList.success, true)
    assert.equal(faqList.data.length, 1)

    const supportList = await obsPromise(ctrl.listDocuments('support'))
    assert.equal(supportList.success, true)
    assert.equal(supportList.data.length, 1)
  })

  it('运行专员可以查看空集合的统计信息（边界）', async () => {
    const result = await obsPromise(ctrl.getCollectionStats('empty-collection'))
    assert.equal(result.success, true)
    assert.equal(result.data.documentCount, 0)
    assert.equal(result.data.chunkCount, 0)
  })

  it('运行专员可以监控 RAG 查询性能（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.FAQ,
      content: '请问如何联系客服？答：拨打400-888-0000或在线咨询。',
      id: 'doc-ops-06',
    }))
    const result = await ctrl.query({ question: '客服电话', collection: CollectionType.FAQ })
    assert.equal(result.success, true)
    assert.ok(result.data!.latencyMs >= 0)
    assert.ok(result.data!.retrievedChunks > 0)
  })
})

// ──────────── 👥 HR：培训文档管理 ────────────
describe(`${ROLES.HR} ai-rag 角色测试`, () => {
  let ctrl: AiRagController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以创建培训文档（正常流程）', async () => {
    const result = await obsPromise(ctrl.createDocument({
      collection: CollectionType.TRAINING,
      content: '新员工培训计划：第一周熟悉公司制度和文化，第二周岗位技能培训，第三周考核评估。',
      id: 'doc-hr-01',
      title: '新员工培训手册',
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.id, 'doc-hr-01')
    assert.equal(result.data.collection, CollectionType.TRAINING)
    assert.equal(result.data.metadata.title, '新员工培训手册')
  })

  it('HR 可以更新培训文档内容（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.TRAINING,
      content: '旧版培训内容',
      id: 'doc-hr-02',
    }))
    const result = await obsPromise(ctrl.updateDocument('training', 'doc-hr-02', {
      content: '新版培训内容：增加安全培训和客户服务技巧模块。',
      title: '2026培训手册（更新版）',
    }))
    assert.equal(result.success, true)
    assert.equal(result.data.metadata.title, '2026培训手册（更新版）')
    assert.ok(result.data.chunks[0].content.includes('安全培训'))
  })

  it('HR 可以列出培训集合中的全部文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '培训A', id: 'doc-hr-03' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '培训B', id: 'doc-hr-04' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '培训C', id: 'doc-hr-05' }))

    const result = await obsPromise(ctrl.listDocuments('training'))
    assert.equal(result.success, true)
    assert.equal(result.data.length, 3)
  })

  it('HR 可以删除过期的培训文档（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '已过期培训', id: 'doc-hr-06' }))
    const delResult = await obsPromise(ctrl.deleteDocument('training', 'doc-hr-06'))
    assert.equal(delResult.success, true)

    const getResult = await obsPromise(ctrl.getDocument('training', 'doc-hr-06'))
    assert.equal(getResult.success, false)
    assert.ok(getResult.message?.includes('不存在'))
  })

  it('HR 可以通过 RAG 查询培训资料（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({
      collection: CollectionType.TRAINING,
      content: '安全培训：所有新员工必须参加消防安全演练，学习灭火器使用方法。',
      id: 'doc-hr-07',
    }))
    const result = await obsPromise(ctrl.retrieve({ question: '消防安全培训', collection: CollectionType.TRAINING }))
    assert.equal(result.success, true)
    assert.ok(result.data.some((c: RetrievedChunk) => c.chunk.content.includes('消防安全')))
  })

  it('HR 可以获取培训文档集合的统计信息（正常流程）', async () => {
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '培训D', id: 'doc-hr-08' }))
    await obsPromise(ctrl.createDocument({ collection: CollectionType.TRAINING, content: '培训E', id: 'doc-hr-09' }))
    const result = await obsPromise(ctrl.getCollectionStats('training'))
    assert.equal(result.success, true)
    assert.equal(result.data.documentCount, 2)
  })

  it('HR 创建培训文档时不指定ID应自动生成（正常流程）', async () => {
    const result = await obsPromise(ctrl.createDocument({
      collection: CollectionType.TRAINING,
      content: '自动生成ID的培训文档',
    }))
    assert.equal(result.success, true)
    assert.ok(result.data.id)
    assert.ok(result.data.id.startsWith('doc-'))
  })
})
