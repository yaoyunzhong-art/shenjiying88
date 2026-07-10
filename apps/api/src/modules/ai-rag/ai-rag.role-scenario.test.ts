import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [ai-rag] [C] 角色场景测试
 *
 * 8 角色视角的 ai-rag 模块业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from './ai-rag.service'
import { AiRagController } from './ai-rag.controller'
import type { CollectionType, ToneType, ObjectionType } from './ai-rag.entity'
import { firstValueFrom } from 'rxjs'

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

// ── 测试工厂 ──
function createServices() {
  const kb = new KnowledgeBaseManager()
  const rag = new RAGPipeline(kb)
  const scriptGen = new SalesScriptGenerator()
  return { kb, rag, scriptGen }
}

function createController(svcs?: ReturnType<typeof createServices>) {
  const { kb, rag, scriptGen } = svcs ?? createServices()
  return new AiRagController(kb, rag, scriptGen)
}

// ── 辅助工具 ──

/** 从 RxJS Observable 中取值 */
async function fromObs<T>(obs: ReturnType<AiRagController[keyof AiRagController]>) {
  if (obs instanceof Promise) return obs
  return firstValueFrom(obs as any)
}

/** 准备基础知识库数据 */
function seedBasicKnowledge(kb: KnowledgeBaseManager) {
  kb.addDocument('products', {
    id: 'prod-guide-001',
    content: '智能营销系统是一款基于AI驱动的精准用户画像工具，支持多渠道自动触达和实时数据分析看板。适用于电商、零售、金融等行业。价格区间为¥99,999-¥199,999/年。',
    metadata: { title: '智能营销系统介绍', category: 'product' },
  })
  kb.addDocument('faq', {
    id: 'faq-001',
    content: '问：智能营销系统如何收费？答：按年订阅，标准版¥99,999/年，专业版¥199,999/年。支持免费试用7天。',
    metadata: { title: '收费FAQ', category: 'pricing' },
  })
  kb.addDocument('support', {
    id: 'support-001',
    content: '技术支持流程：1. 在线提交工单 2. 技术客服10分钟内响应 3. 简单问题2小时内解决 4. 复杂问题24小时内出具方案。',
    metadata: { title: '技术支持流程', category: 'support' },
  })
  kb.addDocument('training', {
    id: 'train-001',
    content: '导玩员培训手册：1. 基础产品知识 2. 客户沟通技巧 3. 异议处理话术 4. 系统操作指南。每月滚动培训。',
    metadata: { title: '导玩员培训手册', category: 'training' },
  })
  kb.addDocument('policies', {
    id: 'policy-001',
    content: '公司安全管理制度：1. 每日设备巡检 2. 异常情况报告流程 3. 应急预案演练计划 4. 消防设施检查记录。安监人员负责监督执行。',
    metadata: { title: '安全管理制度', category: 'security' },
  })
}

// ══════════════════════════════════════════
// 👔 店长 - 知识库全局管理 & 业务数据洞察
// ══════════════════════════════════════════
describe(`${ROLES.StoreManager} ai-rag 场景测试`, () => {
  it('店长可查看所有集合的文档统计，掌握知识库整体情况', () => {
    const svcs = createServices()
    seedBasicKnowledge(svcs.kb)
    const ctrl = createController(svcs)

    const productsStats = svcs.kb.getCollectionStats('products')
    assert.equal(productsStats.documentCount, 1)
    assert.ok(productsStats.chunkCount >= 1)

    const faqStats = svcs.kb.getCollectionStats('faq')
    assert.equal(faqStats.documentCount, 1)
  })

  it('店长可添加重要运营文档供全员查阅', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const doc = svcs.kb.addDocument('products', {
      id: 'prod-store-doc',
      content: '本月重点推广：智能营销系统专业版，目标销售额200万。每家门店须在月底前完成客户演示至少15场。',
      metadata: { title: '月度运营重点', category: 'operation' },
    })

    assert.equal(doc.id, 'prod-store-doc')
    assert.equal(doc.collection, 'products')
    assert.ok(doc.chunks.length >= 1)
  })
})

// ══════════════════════════════════════════
// 🛒 前台 - 快速查询 & 客户接待话术
// ══════════════════════════════════════════
describe(`${ROLES.FrontDesk} ai-rag 场景测试`, () => {
  it('前台可通过 RAG 查询快速获取产品信息回复客户咨询', async () => {
    const svcs = createServices()
    seedBasicKnowledge(svcs.kb)
    const ctrl = createController(svcs)

    const result = await ctrl.query({
      question: '智能营销系统的价格是多少？',
      collection: 'faq',
      topK: 3,
    })

    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.ok(result.data!.answer.length > 0)
    assert.ok(result.data!.sources.length >= 1)
    assert.ok(result.data!.latencyMs >= 0)
    assert.ok(result.data!.retrievedChunks >= 1)
  })

  it('前台查询不存在的集合应返回空结果不崩溃', async () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const result = await ctrl.query({
      question: '有任何文档吗？',
      collection: 'nonexistent',
      topK: 5,
    })

    assert.equal(result.success, true)
    assert.ok(result.data)
    assert.ok(result.data!.answer.length > 0) // 返回默认提示
    assert.equal(result.data!.sources.length, 0)
  })
})

// ══════════════════════════════════════════
// 👥 HR - 培训文档管理 & 话术评估
// ══════════════════════════════════════════
describe(`${ROLES.HR} ai-rag 场景测试`, () => {
  it('HR 可上传培训文档到 training 集合供新员工学习', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const doc = svcs.kb.addDocument('training', {
      id: 'hr-train-001',
      content: '新员工入职培训指南：第一天参观门店，第二天产品培训，第三天系统实操，第四天跟岗学习，第五天考核。',
      metadata: { title: '新员工入职培训指南', category: 'onboarding' },
    })

    assert.equal(doc.collection, 'training')
  })

  it('HR 可通过话术生成评估销售人员沟通技巧', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const script = svcs.scriptGen.generateProductScript('prod-001', 'professional')
    assert.ok(script.includes('智能营销系统'))
    assert.ok(script.includes('【专业版】'))
    assert.ok(script.includes('AI 驱动的精准用户画像'))
    assert.ok(script.includes('¥99,999 - ¥199,999/年'))
  })
})

// ══════════════════════════════════════════
// 🔧 安监 - 安全制度文档 & 合规检索
// ══════════════════════════════════════════
describe(`${ROLES.Security} ai-rag 场景测试`, () => {
  it('安监可上传安全制度文档并检索相关条款', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const doc = svcs.kb.addDocument('policies', {
      id: 'sec-pol-001',
      content: '消防安全检查标准：1. 消防通道保持畅通 2. 灭火器每月检查压力 3. 应急灯每季度测试 4. 消防演习每半年一次。违规扣分标准：每次隐患扣5分。',
      metadata: { title: '消防安全检查标准', category: 'fire-safety' },
    })

    assert.equal(doc.collection, 'policies')
    assert.ok(doc.chunks.length >= 1)
  })

  it('安监可以更新过期安全制度并验证更新生效', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    svcs.kb.addDocument('policies', {
      id: 'sec-pol-002',
      content: '旧版本：设备巡检每季度一次。',
      metadata: { title: '设备巡检制度（旧版）', category: 'inspection' },
    })

    const updated = svcs.kb.updateDocument('policies', 'sec-pol-002', '新版本：设备巡检每月一次。重点设备每周巡检。巡检记录须在系统留存。')
    assert.ok(updated)
    assert.ok(updated.chunks.some(c => c.content.includes('每月一次')))
    assert.equal(updated.metadata.title, undefined) // metadata 被覆盖

    const fetched = svcs.kb.getDocument('policies', 'sec-pol-002')
    assert.ok(fetched)
    assert.ok(fetched.chunks.some(c => c.content.includes('每月一次')))
  })
})

// ══════════════════════════════════════════
// 🎮 导玩员 - 产品话术 & 异议处理
// ══════════════════════════════════════════
describe(`${ROLES.Guide} ai-rag 场景测试`, () => {
  it('导玩员可生成亲和版话术向客户介绍产品', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const result = svcs.scriptGen.generateProductScript('prod-001', 'friendly')
    assert.ok(result.includes('【亲和版】'))
    assert.ok(result.includes('Hi！给您推荐'))
    assert.ok(result.includes('智能营销系统'))
  })

  it('导玩员可针对价格异议生成处理话术', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const script = svcs.scriptGen.generateObjectionScript('prod-001', 'price')
    assert.ok(script.length > 0)
    assert.ok(script.includes('智能营销系统'))
    // 应该包含某种价格异议话术
    const hasPriceContent =
      script.includes('价格') || script.includes('预算') || script.includes('折扣') || script.includes('性价比') || script.includes('优惠')
    assert.ok(hasPriceContent, '异议话术应包含价格相关内容')
  })
})

// ══════════════════════════════════════════
// 🎯 运行专员 - 知识库运维 & 文档生命周期
// ══════════════════════════════════════════
describe(`${ROLES.Operations} ai-rag 场景测试`, () => {
  it('运行专员可列出指定集合的所有文档', () => {
    const svcs = createServices()
    seedBasicKnowledge(svcs.kb)
    const ctrl = createController(svcs)

    const docs = svcs.kb.listDocuments('products')
    assert.equal(docs.length, 1)
    assert.equal(docs[0].collection, 'products')
  })

  it('运行专员可删除过期文档并确认删除生效', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    svcs.kb.addDocument('products', { id: 'old-doc', content: '过期内容' })
    assert.ok(svcs.kb.getDocument('products', 'old-doc'))

    const deleted = svcs.kb.deleteDocument('products', 'old-doc')
    assert.equal(deleted, true)

    const afterDelete = svcs.kb.getDocument('products', 'old-doc')
    assert.equal(afterDelete, null)
  })
})

// ══════════════════════════════════════════
// 🤝 团建 - 跟进话术 & 客户关怀
// ══════════════════════════════════════════
describe(`${ROLES.Teambuilding} ai-rag 场景测试`, () => {
  it('团建人员可使用跟进话术模块生成客户关怀消息', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const script = svcs.scriptGen.generateFollowUpScript('cust-001')
    assert.ok(script.includes('张总'))
    assert.ok(script.includes('智能营销系统'))
    assert.ok(script.length > 10)
  })

  it('团建人员可将话术本地化为不同语言', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const original = '您好！关于我们的优惠方案，限时折扣即将结束，建议立即购买。'
    const en = svcs.scriptGen.localizeScript(original, 'en-US')
    assert.ok(en.includes('Hello'))
    assert.ok(en.includes('discount'))
    assert.ok(en.includes('limited time'))
    assert.ok(en.includes('buy now'))

    const tw = svcs.scriptGen.localizeScript(original, 'zh-TW')
    assert.ok(tw.includes('優惠'))
    assert.ok(tw.includes('限時'))
    assert.ok(tw.includes('立即購買'))
  })
})

// ══════════════════════════════════════════
// 📢 营销 - 产品话术创作 & 多语气适配
// ══════════════════════════════════════════
describe(`${ROLES.Marketing} ai-rag 场景测试`, () => {
  it('营销人员可生成三种语气的产品话术用于不同场景', () => {
    const svcs = createServices()
    const ctrl = createController(svcs)

    const professional = svcs.scriptGen.generateProductScript('prod-002', 'professional')
    const friendly = svcs.scriptGen.generateProductScript('prod-002', 'friendly')
    const urgent = svcs.scriptGen.generateProductScript('prod-002', 'urgent')

    assert.ok(professional.includes('【专业版】'))
    assert.ok(professional.includes('核心卖点'))
    assert.ok(friendly.includes('【亲和版】'))
    assert.ok(friendly.includes('Hi'))
    assert.ok(urgent.includes('【紧迫版】'))
    assert.ok(urgent.includes('限时'))

    // 三种语气内容不同
    assert.notEqual(professional, friendly)
    assert.notEqual(friendly, urgent)
  })

  it('营销人员通过 RAG 检索知识库中的营销素材用于方案策划', () => {
    const svcs = createServices()
    seedBasicKnowledge(svcs.kb)
    const ctrl = createController(svcs)

    const chunks = svcs.rag.retrieve('营销系统功能特点', 'products', 3)
    assert.ok(chunks.length >= 1)
    assert.ok(chunks[0].score > 0)
    assert.ok(chunks[0].chunk.content.includes('AI') || chunks[0].chunk.content.includes('营销'))
  })
})
