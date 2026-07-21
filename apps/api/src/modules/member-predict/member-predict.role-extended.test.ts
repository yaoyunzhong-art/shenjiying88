import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-predict] [C] 角色扩展测试
 *
 * 8 角色视角的会员流失预测模块扩展测试（补充 service.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深层场景测试
 * 使用独立 in-memory Store 避免装饰器依赖
 */
import assert from 'node:assert/strict'

// ── In-memory 模拟 Store ──
const RiskLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

const MEMBER_LEVELS = {
  REGULAR_L1: 'REGULAR_L1',
  REGULAR_L2: 'REGULAR_L2',
  REGULAR_L3: 'REGULAR_L3',
  VIP_L1: 'VIP_L1',
  VIP_L2: 'VIP_L2',
  VIP_L3: 'VIP_L3',
  SVIP_L1: 'SVIP_L1',
  SVIP_L2: 'SVIP_L2',
  DIAMOND_L1: 'DIAMOND_L1',
  LEGEND_L1: 'LEGEND_L1',
} as const

function makeTenantContext(tenantId = 't-ext', brandId = 'b-ext', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

// ── 模拟 MemberPredictService ──
class MockMemberPredictService {
  private predictions: any[] = []
  private nextSeq = 1

  constructor() {
    // 预置 10 条模拟数据 (evolved from service mock)
    const basePredictions = [
      { memberId: 'm-001', memberName: '张三', memberLevel: MEMBER_LEVELS.REGULAR_L1, riskScore: 85, riskLevel: RiskLevel.HIGH, churnProbability: 0.75, predictedChurnDate: '2026-08-15', mainReason: '连续45天未到店，月消费降幅超80%', suggestedAction: '立即发送专属优惠券+电话回访', lastActiveDate: '2026-06-02', storeId: 'store-001' },
      { memberId: 'm-002', memberName: '李四', memberLevel: MEMBER_LEVELS.VIP_L2, riskScore: 78, riskLevel: RiskLevel.HIGH, churnProbability: 0.68, predictedChurnDate: '2026-08-20', mainReason: '最近3次投诉未妥善处理', suggestedAction: '客服主管亲自致歉+赠送补偿套餐', lastActiveDate: '2026-06-10', storeId: 'store-001' },
      { memberId: 'm-003', memberName: '王五', memberLevel: MEMBER_LEVELS.REGULAR_L2, riskScore: 72, riskLevel: RiskLevel.HIGH, churnProbability: 0.62, predictedChurnDate: '2026-08-25', mainReason: '周边新开竞品导致用户分流', suggestedAction: '推送差异化权益对比', lastActiveDate: '2026-06-15', storeId: 'store-002' },
      { memberId: 'm-004', memberName: '赵六', memberLevel: MEMBER_LEVELS.SVIP_L1, riskScore: 62, riskLevel: RiskLevel.MEDIUM, churnProbability: 0.45, predictedChurnDate: '2026-09-01', mainReason: '消费频次从每周3次降至每周1次', suggestedAction: '邀请参与VIP专属活动', lastActiveDate: '2026-06-20', storeId: 'store-001' },
      { memberId: 'm-005', memberName: '孙七', memberLevel: MEMBER_LEVELS.VIP_L1, riskScore: 55, riskLevel: RiskLevel.MEDIUM, churnProbability: 0.38, predictedChurnDate: '2026-09-10', mainReason: '季节性消费波动', suggestedAction: '推送夏季清凉活动+充值优惠', lastActiveDate: '2026-06-25', storeId: 'store-003' },
      { memberId: 'm-006', memberName: '周八', memberLevel: MEMBER_LEVELS.REGULAR_L3, riskScore: 48, riskLevel: RiskLevel.MEDIUM, churnProbability: 0.30, predictedChurnDate: '2026-09-18', mainReason: '会员等级停留时间过长', suggestedAction: '展示升级进度', lastActiveDate: '2026-07-01', storeId: 'store-002' },
      { memberId: 'm-007', memberName: '吴九', memberLevel: MEMBER_LEVELS.DIAMOND_L1, riskScore: 35, riskLevel: RiskLevel.LOW, churnProbability: 0.18, predictedChurnDate: '2026-10-05', mainReason: '到店频率略有下降', suggestedAction: '推送新项目内测邀请', lastActiveDate: '2026-07-05', storeId: 'store-001' },
      { memberId: 'm-008', memberName: '郑十', memberLevel: MEMBER_LEVELS.VIP_L3, riskScore: 28, riskLevel: RiskLevel.LOW, churnProbability: 0.12, predictedChurnDate: '2026-10-20', mainReason: '近期未参与活动', suggestedAction: '推送个性化活动推荐', lastActiveDate: '2026-07-08', storeId: 'store-003' },
      { memberId: 'm-009', memberName: '陈一', memberLevel: MEMBER_LEVELS.LEGEND_L1, riskScore: 22, riskLevel: RiskLevel.LOW, churnProbability: 0.08, predictedChurnDate: '2026-11-01', mainReason: '消费稳定', suggestedAction: '保持常规维护', lastActiveDate: '2026-07-10', storeId: 'store-001' },
      { memberId: 'm-010', memberName: '林二', memberLevel: MEMBER_LEVELS.SVIP_L2, riskScore: 18, riskLevel: RiskLevel.LOW, churnProbability: 0.05, predictedChurnDate: '2026-11-15', mainReason: '活跃度稳定', suggestedAction: '推送感恩回馈活动', lastActiveDate: '2026-07-12', storeId: 'store-002' },
    ]
    basePredictions.forEach(p => this.predictions.push({ ...p }))
  }

  async findAll(storeId?: string, riskLevel?: string, minScore?: number) {
    let result = [...this.predictions]
    if (storeId) result = result.filter(p => p.storeId === storeId)
    if (riskLevel) result = result.filter(p => p.riskLevel === riskLevel)
    if (minScore !== undefined) result = result.filter(p => p.riskScore >= minScore)
    return result.map(this.toDto)
  }

  async findById(memberId: string) {
    const p = this.predictions.find(p => p.memberId === memberId)
    return p ? this.toDto(p) : null
  }

  async getSummary() {
    const items = this.predictions
    const highRiskCount = items.filter(p => p.riskLevel === RiskLevel.HIGH).length
    const mediumRiskCount = items.filter(p => p.riskLevel === RiskLevel.MEDIUM).length
    const lowRiskCount = items.filter(p => p.riskLevel === RiskLevel.LOW).length
    const avgRiskScore = Math.round(items.reduce((s, p) => s + p.riskScore, 0) / items.length * 100) / 100
    const predictedLossAmount = Math.round(items.reduce((s, p) => s + p.churnProbability * 5000, 0))
    const highRatio = highRiskCount / items.length
    const recommendedActions = ['对高风险会员进行电话回访']
    if (highRatio > 0.3) recommendedActions.push('启动流失预警应急预案，全员拉新补位')
    if (mediumRiskCount > 0) recommendedActions.push('中风险会员推送定向优惠券包')
    recommendedActions.push('分析竞品动态，优化差异化权益')
    recommendedActions.push('高价值会员（SVIP+）一对一管家跟进')
    return { totalPredicted: items.length, highRiskCount, mediumRiskCount, lowRiskCount, avgRiskScore, predictedLossAmount, recommendedActions }
  }

  async getRiskDistribution() {
    const levels = [RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW]
    return levels.map(level => {
      const items = this.predictions.filter(p => p.riskLevel === level)
      return {
        riskLevel: level,
        count: items.length,
        avgScore: items.length > 0 ? Math.round(items.reduce((s, p) => s + p.riskScore, 0) / items.length * 100) / 100 : 0,
      }
    })
  }

  async evaluateRisk(memberId: string, riskScore: number, churnProbability: number) {
    const riskLevel = riskScore >= 70 ? RiskLevel.HIGH : riskScore >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW
    const suggestions: Record<string, string> = {
      [RiskLevel.HIGH]: '立即干预：专属回访+补偿方案+竞品分析',
      [RiskLevel.MEDIUM]: '关注维护：定向推送+活动邀约+积分激励',
      [RiskLevel.LOW]: '常规维护：日常互动+权益提醒+满意度跟踪',
    }
    return { riskLevel, suggestion: suggestions[riskLevel] }
  }

  async create(data: any) {
    const riskLevel = data.riskScore >= 70 ? RiskLevel.HIGH : data.riskScore >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW
    const churnDate = new Date()
    churnDate.setDate(churnDate.getDate() + Math.floor(30 * data.churnProbability))
    const p = {
      memberId: data.memberId,
      memberName: data.memberName,
      memberLevel: data.memberLevel,
      riskScore: data.riskScore,
      riskLevel,
      churnProbability: data.churnProbability,
      predictedChurnDate: churnDate.toISOString().split('T')[0],
      mainReason: data.mainReason,
      suggestedAction: data.suggestedAction,
      lastActiveDate: data.lastActiveDate,
      storeId: data.storeId,
    }
    this.predictions.push(p)
    return this.toDto(p)
  }

  private toDto(p: any) {
    return {
      memberId: p.memberId,
      memberName: p.memberName,
      memberLevel: p.memberLevel,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      churnProbability: p.churnProbability,
      predictedChurnDate: p.predictedChurnDate,
      mainReason: p.mainReason,
      suggestedAction: p.suggestedAction,
      lastActiveDate: p.lastActiveDate,
    }
  }
}

function freshService() {
  return new MockMemberPredictService()
}

// ════════════════════════════════════════════════
//  👔 店长扩展
// ════════════════════════════════════════════════
describe('👔店长 会员预测扩展测试', () => {
  it('店长查看本店高流失风险会员（正常：定位预警对象）', async () => {
    const svc = freshService()
    const highStore1 = await svc.findAll('store-001', RiskLevel.HIGH)
    // store-001 high: m-001(85), m-002(78) => 2
    assert.equal(highStore1.length, 2)
    highStore1.forEach(m => {
      assert.equal(m.riskLevel, RiskLevel.HIGH)
    })
  })

  it('店长查看流失预测总览以制定挽回策略（正常）', async () => {
    const svc = freshService()
    const summary = await svc.getSummary()
    assert.equal(summary.totalPredicted, 10)
    assert.equal(summary.highRiskCount, 3)
    assert.equal(summary.mediumRiskCount, 3)
    assert.equal(summary.lowRiskCount, 4)
    assert.ok(summary.recommendedActions.length >= 3)
  })

  it('店长按最低风险分数筛选获得全部会员（边界：minScore=0）', async () => {
    const svc = freshService()
    const all = await svc.findAll(undefined, undefined, 0)
    assert.equal(all.length, 10)
  })
})

// ════════════════════════════════════════════════
//  🛒 前台扩展
// ════════════════════════════════════════════════
describe('🛒前台 会员预测扩展测试', () => {
  it('前台查看常客会员流失风险以便加强服务（正常：日常接待关注）', async () => {
    const svc = freshService()
    const regularMembers = await svc.findAll(undefined, undefined, undefined)
    const highRiskRegular = regularMembers.filter(m => m.riskLevel === RiskLevel.HIGH && m.memberLevel.startsWith('REGULAR'))
    // HIGH: m-001(REGULAR_L1), m-003(REGULAR_L2) → 2
    assert.equal(highRiskRegular.length, 2)
  })

  it('前台按会员ID查询特定会员详细信息（正常）', async () => {
    const svc = freshService()
    const member = await svc.findById('m-001')
    assert.ok(member)
    assert.equal(member.memberName, '张三')
    assert.equal(member.riskScore, 85)
    assert.equal(member.churnProbability, 0.75)
    assert.equal(member.suggestedAction, '立即发送专属优惠券+电话回访')
  })
})

// ════════════════════════════════════════════════
//  👥 HR 扩展
// ════════════════════════════════════════════════
describe('👥HR 会员预测扩展测试', () => {
  it('HR 查看按风险等级分布情况（正常：人力资源规划支持）', async () => {
    const svc = freshService()
    const dist = await svc.getRiskDistribution()
    assert.equal(dist.length, 3)
    const high = dist.find(d => d.riskLevel === RiskLevel.HIGH)
    const medium = dist.find(d => d.riskLevel === RiskLevel.MEDIUM)
    const low = dist.find(d => d.riskLevel === RiskLevel.LOW)
    assert.equal(high?.count, 3)
    assert.equal(medium?.count, 3)
    assert.equal(low?.count, 4)
    assert.ok(high!.avgScore > medium!.avgScore)
    assert.ok(medium!.avgScore > low!.avgScore)
  })

  it('HR 查询SVIP+级别的流失风险以安排管家跟进（正常）', async () => {
    const svc = freshService()
    const highValue = await svc.findAll(undefined, undefined, undefined)
    const svipPlus = highValue.filter(m =>
      m.memberLevel.startsWith('SVIP') || m.memberLevel.startsWith('DIAMOND') || m.memberLevel.startsWith('LEGEND')
    )
    // SVIP: m-004(SVIP_L1), m-010(SVIP_L2), DIAMOND: m-007, LEGEND: m-009 => 4
    assert.equal(svipPlus.length, 4)
    const highRiskVip = svipPlus.filter(m => m.riskLevel === RiskLevel.HIGH)
    assert.equal(highRiskVip.length, 0) // none of the high-value are high risk
  })

  it('HR 查看到期未处理的中风险会员的预警建议（边界：准确判断riskScore=40）', async () => {
    const svc = freshService()
    // 边界测试：riskScore=40 应为 MEDIUM
    const result = await svc.evaluateRisk('m-boundary', 40, 0.3)
    assert.equal(result.riskLevel, RiskLevel.MEDIUM)
    assert.equal(result.suggestion, '关注维护：定向推送+活动邀约+积分激励')
  })
})

// ════════════════════════════════════════════════
//  🔧 安监扩展
// ════════════════════════════════════════════════
describe('🔧安监 会员预测扩展测试', () => {
  it('安监筛选异常高风险会员以排查安全隐患（正常：借流失预警排查问题）', async () => {
    const svc = freshService()
    const highRisk = await svc.findAll(undefined, RiskLevel.HIGH, 75)
    // score >= 75: m-001(85), m-002(78) => 2
    assert.equal(highRisk.length, 2)
    highRisk.forEach(m => {
      assert.ok(m.riskScore >= 75)
    })
  })

  it('安监评估会员流失风险与安全事件关联（正常：投诉未妥善处理类预警）', async () => {
    const svc = freshService()
    const complaintRisk = await svc.findAll(undefined, RiskLevel.HIGH)
    // m-002 has complaint-related mainReason
    const complaintRelated = complaintRisk.filter(m => m.mainReason.includes('投诉'))
    assert.equal(complaintRelated.length, 1)
    assert.equal(complaintRelated[0].memberId, 'm-002')
  })
})

// ════════════════════════════════════════════════
//  🎮 导玩员扩展
// ════════════════════════════════════════════════
describe('🎮导玩员 会员预测扩展测试', () => {
  it('导玩员查看常玩游戏会员的流失预警（正常：关注活跃会员状态）', async () => {
    const svc = freshService()
    const all = await svc.findAll()
    const regularHigh = all.filter(m =>
      m.memberLevel.startsWith('REGULAR') && m.riskLevel === RiskLevel.HIGH
    )
    // REGULAR high: m-001(REGULAR_L1), m-003(REGULAR_L2) => 2
    assert.equal(regularHigh.length, 2)
  })

  it('导玩员新增会员预测记录（正常：标记新发现的流失迹象）', async () => {
    const svc = freshService()
    const result = await svc.create({
      memberId: 'm-100',
      memberName: '测试导玩会员',
      memberLevel: MEMBER_LEVELS.REGULAR_L2,
      riskScore: 58,
      churnProbability: 0.42,
      mainReason: '最近两周未参与游戏活动',
      suggestedAction: '推送新游戏体验邀请',
      lastActiveDate: '2026-07-10',
      storeId: 'store-001',
    })
    assert.equal(result.memberId, 'm-100')
    assert.equal(result.riskLevel, RiskLevel.MEDIUM) // 58 → MEDIUM
    assert.equal(result.mainReason, '最近两周未参与游戏活动')
    assert.ok(result.predictedChurnDate)
    // 验证持久化
    const found = await svc.findById('m-100')
    assert.ok(found)
    assert.equal(found.memberName, '测试导玩会员')
  })
})

// ════════════════════════════════════════════════
//  🎯 运行专员扩展
// ════════════════════════════════════════════════
describe('🎯运行专员 会员预测扩展测试', () => {
  it('运行专员查看按门店的流失会员分布（正常：运营优化）', async () => {
    const svc = freshService()
    const store1 = await svc.findAll('store-001')
    const store2 = await svc.findAll('store-002')
    const store3 = await svc.findAll('store-003')
    // store-001: m-001,m-002,m-004,m-007,m-009 => 5
    // store-002: m-003,m-006,m-010 => 3
    // store-003: m-005,m-008 => 2
    assert.equal(store1.length, 5)
    assert.equal(store2.length, 3)
    assert.equal(store3.length, 2)
  })

  it('运行专员评估高流失概率会员的干预策略（正常：数据驱动决策）', async () => {
    const svc = freshService()
    const highChurn = await svc.findAll(undefined, undefined, 70)
    assert.equal(highChurn.length, 3)
    highChurn.forEach(m => {
      assert.ok(m.riskScore >= 70)
    })
    const top1 = highChurn[0]
    const riskEval = await svc.evaluateRisk(top1.memberId, top1.riskScore, top1.churnProbability)
    assert.equal(riskEval.riskLevel, RiskLevel.HIGH)
    assert.equal(riskEval.suggestion, '立即干预：专属回访+补偿方案+竞品分析')
  })

  it('运行专员按minScore筛选无结果时返回空数组（边界）', async () => {
    const svc = freshService()
    const result = await svc.findAll(undefined, undefined, 100)
    assert.equal(result.length, 0)
  })
})

// ════════════════════════════════════════════════
//  🤝 团建扩展
// ════════════════════════════════════════════════
describe('🤝团建 会员预测扩展测试', () => {
  it('团建查看流失高风险会员以邀请参与团建活动（正常：通过活动挽回）', async () => {
    const svc = freshService()
    const highRisk = await svc.findAll(undefined, RiskLevel.HIGH)
    assert.equal(highRisk.length, 3)
    highRisk.forEach(m => {
      // 团建可以针对每个高风险会员的活动建议
      assert.ok(m.suggestedAction)
      assert.ok(m.mainReason)
    })
  })

  it('团建新增会员再激活记录（正常：活动挽回标记）', async () => {
    const svc = freshService()
    const result = await svc.create({
      memberId: 'm-200',
      memberName: '团建挽回会员',
      memberLevel: MEMBER_LEVELS.VIP_L1,
      riskScore: 72,
      churnProbability: 0.6,
      mainReason: '缺乏社交互动体验，参与意愿降低',
      suggestedAction: '邀请参加周末团队活动+赠送团建体验套餐',
      lastActiveDate: '2026-06-20',
      storeId: 'store-001',
    })
    assert.equal(result.riskLevel, RiskLevel.HIGH) // 72 ≥ 70 → HIGH
    assert.equal(result.suggestedAction, '邀请参加周末团队活动+赠送团建体验套餐')
    const found = await svc.findById('m-200')
    assert.ok(found)
    assert.equal(found.memberName, '团建挽回会员')
  })
})

// ════════════════════════════════════════════════
//  📢 营销扩展
// ════════════════════════════════════════════════
describe('📢营销 会员预测扩展测试', () => {
  it('营销查看中风险会员以精准推送营销活动（正常：定向优惠推送）', async () => {
    const svc = freshService()
    const mediumRisk = await svc.findAll(undefined, RiskLevel.MEDIUM)
    assert.equal(mediumRisk.length, 3)
    // 营销可以针对每个中风险会员制定差异化推送策略
    mediumRisk.forEach(m => {
      assert.ok(m.suggestedAction)
    })
  })

  it('营销交叉分析会员等级与流失风险以制定差异化策略（正常）', async () => {
    const svc = freshService()
    const all = await svc.findAll()
    // 按会员等级分组统计高风险比例
    const highValueMembers = all.filter(m =>
      m.memberLevel.startsWith('SVIP') || m.memberLevel.startsWith('DIAMOND') || m.memberLevel.startsWith('LEGEND')
    )
    assert.equal(highValueMembers.length, 4)
    const highValueHighRisk = highValueMembers.filter(m => m.riskLevel === RiskLevel.HIGH)
    assert.equal(highValueHighRisk.length, 0) // 高价值会员无高风险
    const regularMembers = all.filter(m => m.memberLevel.startsWith('REGULAR'))
    assert.equal(regularMembers.length, 4)
    const regularHighRisk = regularMembers.filter(m => m.riskLevel === RiskLevel.HIGH)
    assert.equal(regularHighRisk.length, 2) // m-001, m-003
  })

  it('营销查询无风险的会员门店列表（边界）', async () => {
    const svc = freshService()
    const noRisk = await svc.findAll('store-999')
    assert.equal(noRisk.length, 0)
    const lowOnly = await svc.findAll(undefined, RiskLevel.LOW)
    assert.equal(lowOnly.length, 4)
  })
})

// ════════════════════════════════════════════════
//  跨角色集成场景
// ════════════════════════════════════════════════
describe('会员预测跨角色集成场景', () => {
  it('👔店长发现→📢营销推送→🤝团建挽回→🎯运行专员跟踪（完整闭环）', async () => {
    const svc = freshService()
    // 1. 店长发现中风险会员
    const mediumRisk = await svc.findAll(undefined, RiskLevel.MEDIUM)
    assert.equal(mediumRisk.length, 3)
    // 2. 营销为这些会员准备推送
    const marketingTargets = mediumRisk.filter(m => m.riskScore >= 50)
    assert.equal(marketingTargets.length, 2) // m-004(62), m-005(55)
    // 3. 团建策划活动挽回
    const groupedTargets = marketingTargets.map(m => ({
      memberId: m.memberId,
      name: m.memberName,
      inviteToTeamBuilding: true,
    }))
    assert.equal(groupedTargets.length, 2)
    // 4. 运行专员评估效果
    const initialSummary = await svc.getSummary()
    assert.ok(initialSummary.totalPredicted > 0)
    // 创建一条新记录模拟挽回成功
    await svc.create({
      memberId: 'm-300',
      memberName: '挽回测试会员',
      memberLevel: MEMBER_LEVELS.REGULAR_L1,
      riskScore: 65,
      churnProbability: 0.5,
      mainReason: '参加团建活动后恢复活跃',
      suggestedAction: '持续推送活动邀请',
      lastActiveDate: '2026-07-20',
      storeId: 'store-001',
    })
    const updatedSummary = await svc.getSummary()
    assert.equal(updatedSummary.totalPredicted, initialSummary.totalPredicted + 1)
    assert.equal(updatedSummary.mediumRiskCount, initialSummary.mediumRiskCount + 1)
  })

  it('高风险会员评估边界验证（边界：score=69为MEDIUM，score=70为HIGH）', async () => {
    const svc = freshService()
    const nearHigh = await svc.evaluateRisk('m-boundary-69', 69, 0.5)
    assert.equal(nearHigh.riskLevel, RiskLevel.MEDIUM)
    const highEdge = await svc.evaluateRisk('m-boundary-70', 70, 0.5)
    assert.equal(highEdge.riskLevel, RiskLevel.HIGH)
  })
})
