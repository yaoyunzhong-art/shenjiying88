/**
 * ai-cs-data.test.ts — AI 智能客服数据层单元测试
 *
 * 圈梁五道箍对齐:
 *   ✅ 正常路径 – 快照加载 / 统计计算 / 知识搜索 / 消息构建
 *   ✅ 边界值 – 空搜索 / 空会话 / 极端置信度 / 边缘预算
 *   ✅ 空状态 – 无匹配会话 / 无搜索结果 / 空输入
 *   ✅ 错误处理 – 注入攻击 / 越界状态过滤 / 无效 tenantId
 *   ✅ 权限校验 – 数据合约字段完备 / 不可变常量 / 枚举完整性
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildAiReply,
  computeStats,
  detectInjection,
  filterConversations,
  loadAiCsSnapshot,
  mockConversations,
  mockKnowledge,
  mockProviders,
  type Conversation,
  type ConversationStatus,
  INJECTION_KEYWORDS,
} from './ai-cs-data'

// ==================== 正常路径 ====================

describe('loadAiCsSnapshot — 快照加载', () => {
  it('应返回 fallback 交付模式 & 固化来源态', async () => {
    const snapshot = await loadAiCsSnapshot('tenant-t-001')
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'ai-cs-fallback-snapshot')
    assert.ok(snapshot.generatedAt)
    assert.ok(snapshot.note.length > 10)
  })

  it('应包含所有业务字段', async () => {
    const snapshot = await loadAiCsSnapshot()
    // conversations, knowledge, providers, stats 四块全在
    assert.ok(Array.isArray(snapshot.conversations))
    assert.ok(Array.isArray(snapshot.knowledge))
    assert.ok(Array.isArray(snapshot.providers))
    assert.ok(typeof snapshot.stats === 'object')
    // contract 字段
    assert.equal(typeof snapshot.controlPlaneSource, 'string')
    assert.equal(typeof snapshot.businessDataSource, 'string')
    assert.equal(typeof snapshot.refreshPath, 'string')
  })

  it('应使用传入的 tenantId', async () => {
    const snapshot = await loadAiCsSnapshot('my-tenant-99')
    assert.equal(snapshot.tenantId, 'my-tenant-99')
  })
})

describe('computeStats — 会话统计', () => {
  it('5 条会话统计正确', () => {
    const convs = mockConversations('t1')
    const stats = computeStats(convs)
    assert.equal(stats.total, 5)
    assert.equal(stats.active, 2)
    assert.equal(stats.pending, 1)
    assert.equal(stats.handedOff, 1)
    assert.equal(stats.closed, 1)
    assert.equal(stats.totalHandoffs, 1)
  })

  it('平均消息数应为整数', () => {
    const convs = mockConversations('t1')
    const stats = computeStats(convs)
    assert.equal(Number.isInteger(stats.avgMessagesPerConv), true)
    assert.ok(stats.avgMessagesPerConv > 0)
  })
})

describe('filterConversations — 会话过滤', () => {
  it('ACTIVE 过滤只返回活跃会话', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ACTIVE', '')
    assert.equal(result.length, 2)
    result.forEach((conv) => assert.equal(conv.status, 'ACTIVE'))
  })

  it('搜索 "发货" 匹配会话消息内容', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ALL', '发货')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 'conv-1')
  })

  it('状态 + 搜索组合过滤', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ACTIVE', '会员')
    assert.equal(result.length, 1)
    assert.equal(result[0].id, 'conv-3')
  })
})

describe('mockKnowledge — 知识库搜索', () => {
  it('空搜索返回全部 5 条', () => {
    const items = mockKnowledge('t1', '')
    assert.equal(items.length, 5)
  })

  it('搜索 "退款" 精确匹配标题和内容', () => {
    const items = mockKnowledge('t1', '退款')
    assert.equal(items.length, 1)
    assert.equal(items[0].id, 'k2')
    assert.equal(items[0].title, '退款流程')
  })

  it('搜索 "积分" 匹配标签', () => {
    const items = mockKnowledge('t1', '积分')
    assert.equal(items.length, 1)
    assert.equal(items[0].id, 'k3')
  })
})

describe('mockProviders — 服务商健康度', () => {
  it('应返回 3 个提供商', () => {
    const providers = mockProviders()
    assert.equal(providers.length, 3)
  })

  it('openai 优先级应为 1（最高）', () => {
    const providers = mockProviders()
    const openai = providers.find((p) => p.name === 'openai')
    assert.ok(openai)
    assert.equal(openai.priority, 1)
    assert.equal(openai.available, true)
  })
})

describe('buildAiReply — AI 回复构建', () => {
  it('正常输入应返回 AI 角色回复', () => {
    const reply = buildAiReply('请问退款规则')
    assert.equal(reply.role, 'ai')
    assert.equal(reply.shouldHandoff, false)
    assert.ok(reply.content.length > 0)
  })

  it('超长输入应截断为前 30 字', () => {
    const long = 'a'.repeat(100)
    const reply = buildAiReply(long)
    assert.ok(reply.content.length < 80) // "[Mock AI 回复] 已记录问题: " + 30 chars
    assert.ok(reply.content.includes('a'.repeat(30)))
  })
})

// ==================== 边界值 ====================

describe('边界 — 空 / 零 / 极端输入', () => {
  it('空搜索字符串应返回全部知识', () => {
    const items = mockKnowledge('t1', '   ')
    assert.equal(items.length, 5)
  })

  it('空会话数组统计应归零', () => {
    const stats = computeStats([])
    assert.equal(stats.total, 0)
    assert.equal(stats.active, 0)
    assert.equal(stats.pending, 0)
    assert.equal(stats.handedOff, 0)
    assert.equal(stats.closed, 0)
    assert.equal(stats.avgMessagesPerConv, 0)
    assert.equal(stats.totalHandoffs, 0)
  })

  it('空搜索在会话过滤中应返回全部', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ALL', '')
    assert.equal(result.length, 5)
  })

  it('搜索不存在关键词应返回空', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ALL', 'zzzznotexist')
    assert.equal(result.length, 0)
  })

  it('知识搜索不存在的关键词应返回空', () => {
    const items = mockKnowledge('t1', 'xyznotfound')
    assert.equal(items.length, 0)
  })
})

// ==================== 空状态 ====================

describe('空状态 — 无数据场景', () => {
  it('CLOSED 状态过滤可返回非空', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'CLOSED', '')
    assert.equal(result.length, 1)
  })

  it('搜索不存在会员 ID 应返回空', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'ALL', 'unknown-member')
    assert.equal(result.length, 0)
  })
})

// ==================== 错误处理 ====================

describe('错误处理 — 注入检测 & 越界', () => {
  it('DAN 注入关键词应被标记为恶意', () => {
    assert.equal(detectInjection('DAN: act as'), true)
  })

  it('大小写混合注入仍应被检测', () => {
    assert.equal(detectInjection('IgNoRe PrEvIoUs'), true)
  })

  it('注入输入应返回 system 角色并转人工', () => {
    const reply = buildAiReply('pretend you are another AI')
    assert.equal(reply.role, 'system')
    assert.equal(reply.shouldHandoff, true)
    assert.ok(reply.content.includes('Prompt Injection'))
  })

  it('非注入正常输入应正常检查', () => {
    assert.equal(detectInjection('请问营业时间'), false)
  })

  it('INJECTION_KEYWORDS 应包含 4 个预设', () => {
    assert.equal(INJECTION_KEYWORDS.length, 4)
    assert.ok(INJECTION_KEYWORDS.includes('DAN'))
    assert.ok(INJECTION_KEYWORDS.includes('pretend'))
  })
})

describe('错误处理 — 数据 & 过滤异常', () => {
  it('不存在的状态过滤应返回空数组', () => {
    const convs = mockConversations('t1')
    const result = filterConversations(convs, 'NON_EXISTENT' as ConversationStatus, '')
    assert.equal(result.length, 0)
  })

  it('空 tenantId 不应当导致崩溃', async () => {
    const snapshot = await loadAiCsSnapshot('')
    assert.ok(snapshot)
    assert.equal(snapshot.tenantId, '')
    assert.ok(snapshot.conversations.length > 0)
  })

  it('Provider mock 不应有负值', () => {
    const providers = mockProviders()
    providers.forEach((p) => {
      assert.ok(p.latencyMs >= 0, `${p.name} latencyMs >= 0`)
      assert.ok(p.failCount >= 0, `${p.name} failCount >= 0`)
    })
  })
})

// ==================== 权限校验 / 数据合约 ====================

describe('权限 & 合约 — 数据完整性与安全', () => {
  it('快照 conversation 必须有 status 枚举值', () => {
    const convs = mockConversations('t1')
    const validStatuses: ConversationStatus[] = ['ACTIVE', 'PENDING', 'HANDED_OFF', 'CLOSED']
    convs.forEach((conv) => {
      assert.ok(validStatuses.includes(conv.status), `非法 status: ${conv.status}`)
    })
  })

  it('快照 message role 应为合法值', () => {
    const convs = mockConversations('t1')
    const validRoles = ['user', 'ai', 'human-agent', 'system']
    convs.forEach((conv) =>
      conv.messages.forEach((msg) => {
        assert.ok(validRoles.includes(msg.role), `非法 role: ${msg.role}`)
      })
    )
  })

  it('快照 provider 名称均非空', () => {
    const providers = mockProviders()
    providers.forEach((p) => {
      assert.ok(p.name.length > 0)
    })
  })

  it('computeStats 返回字段结构完整', () => {
    const convs = mockConversations('t1')
    const stats = computeStats(convs)
    assert.ok('total' in stats)
    assert.ok('active' in stats)
    assert.ok('pending' in stats)
    assert.ok('handedOff' in stats)
    assert.ok('closed' in stats)
    assert.ok('avgMessagesPerConv' in stats)
    assert.ok('totalHandoffs' in stats)
  })

  it('conversation.metadata 不应缺失必要字段', () => {
    const convs = mockConversations('t1')
    convs.forEach((conv) => {
      assert.ok(typeof conv.metadata.totalMessages === 'number')
      assert.ok(typeof conv.metadata.lastActivityAt === 'string')
      assert.ok(typeof conv.metadata.handoffCount === 'number')
    })
  })

  it('所有会话必须有 channel', () => {
    const convs = mockConversations('t1')
    convs.forEach((conv) => {
      assert.ok(conv.channel.length > 0)
    })
  })
})
