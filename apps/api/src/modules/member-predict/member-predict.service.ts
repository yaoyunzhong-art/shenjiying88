import { Injectable } from '@nestjs/common'
import { RiskLevel, type MemberPrediction } from './member-predict.entity'
import type { MemberPredictDto, PredictSummaryDto } from './member-predict.dto'

/** Mock 会员预测数据 10条（高/中/低风险） */
const MOCK_PREDICTIONS: MemberPrediction[] = [
  {
    memberId: 'm-001',
    memberName: '张三',
    memberLevel: 'REGULAR_L1',
    riskScore: 85,
    riskLevel: RiskLevel.HIGH,
    churnProbability: 0.75,
    predictedChurnDate: '2026-08-15',
    mainReason: '连续45天未到店，月消费降幅超80%',
    suggestedAction: '立即发送专属优惠券+电话回访，推荐近期热门活动',
    lastActiveDate: '2026-06-02',
    storeId: 'store-001'
  },
  {
    memberId: 'm-002',
    memberName: '李四',
    memberLevel: 'VIP_L2',
    riskScore: 78,
    riskLevel: RiskLevel.HIGH,
    churnProbability: 0.68,
    predictedChurnDate: '2026-08-20',
    mainReason: '最近3次投诉未妥善处理，满意度下降',
    suggestedAction: '客服主管亲自致歉+赠送补偿套餐+开通专属客服通道',
    lastActiveDate: '2026-06-10',
    storeId: 'store-001'
  },
  {
    memberId: 'm-003',
    memberName: '王五',
    memberLevel: 'REGULAR_L2',
    riskScore: 72,
    riskLevel: RiskLevel.HIGH,
    churnProbability: 0.62,
    predictedChurnDate: '2026-08-25',
    mainReason: '近期周边新开竞品导致用户分流',
    suggestedAction: '推送差异化权益对比，强调本店积分优势',
    lastActiveDate: '2026-06-15',
    storeId: 'store-002'
  },
  {
    memberId: 'm-004',
    memberName: '赵六',
    memberLevel: 'SVIP_L1',
    riskScore: 62,
    riskLevel: RiskLevel.MEDIUM,
    churnProbability: 0.45,
    predictedChurnDate: '2026-09-01',
    mainReason: '消费频次从每周3次降至每周1次',
    suggestedAction: '邀请参与VIP专属活动+赠送体验券',
    lastActiveDate: '2026-06-20',
    storeId: 'store-001'
  },
  {
    memberId: 'm-005',
    memberName: '孙七',
    memberLevel: 'VIP_L1',
    riskScore: 55,
    riskLevel: RiskLevel.MEDIUM,
    churnProbability: 0.38,
    predictedChurnDate: '2026-09-10',
    mainReason: '季节性消费波动，夏季出游频次下降',
    suggestedAction: '推送夏季清凉活动+充值优惠',
    lastActiveDate: '2026-06-25',
    storeId: 'store-003'
  },
  {
    memberId: 'm-006',
    memberName: '周八',
    memberLevel: 'REGULAR_L3',
    riskScore: 48,
    riskLevel: RiskLevel.MEDIUM,
    churnProbability: 0.30,
    predictedChurnDate: '2026-09-18',
    mainReason: '会员等级停留时间过长，缺乏升级动力',
    suggestedAction: '展示升级进度和权益对比，引导消费达标',
    lastActiveDate: '2026-07-01',
    storeId: 'store-002'
  },
  {
    memberId: 'm-007',
    memberName: '吴九',
    memberLevel: 'DIAMOND_L1',
    riskScore: 35,
    riskLevel: RiskLevel.LOW,
    churnProbability: 0.18,
    predictedChurnDate: '2026-10-05',
    mainReason: '长期稳定到店，但近一个月到店频率略有下降',
    suggestedAction: '推送新项目内测邀请+钻石会员专属福利',
    lastActiveDate: '2026-07-05',
    storeId: 'store-001'
  },
  {
    memberId: 'm-008',
    memberName: '郑十',
    memberLevel: 'VIP_L3',
    riskScore: 28,
    riskLevel: RiskLevel.LOW,
    churnProbability: 0.12,
    predictedChurnDate: '2026-10-20',
    mainReason: '日常消费稳定，但近期未参与任何活动',
    suggestedAction: '推送个性化活动推荐+生日月专属礼遇提醒',
    lastActiveDate: '2026-07-08',
    storeId: 'store-003'
  },
  {
    memberId: 'm-009',
    memberName: '陈一',
    memberLevel: 'LEGEND_L1',
    riskScore: 22,
    riskLevel: RiskLevel.LOW,
    churnProbability: 0.08,
    predictedChurnDate: '2026-11-01',
    mainReason: '消费稳定，系统判定为低波动用户',
    suggestedAction: '保持常规维护，无需特别干预',
    lastActiveDate: '2026-07-10',
    storeId: 'store-001'
  },
  {
    memberId: 'm-010',
    memberName: '林二',
    memberLevel: 'SVIP_L2',
    riskScore: 18,
    riskLevel: RiskLevel.LOW,
    churnProbability: 0.05,
    predictedChurnDate: '2026-11-15',
    mainReason: '活跃度稳定，忠诚度高',
    suggestedAction: '推送感恩回馈活动+联名限量品优先购买权',
    lastActiveDate: '2026-07-12',
    storeId: 'store-002'
  }
]

@Injectable()
export class MemberPredictService {
  private predictions: MemberPrediction[] = [...MOCK_PREDICTIONS]

  /** 获取预测列表（支持筛选） */
  async findAll(storeId?: string, riskLevel?: string, minScore?: number): Promise<MemberPredictDto[]> {
    let result = [...this.predictions]

    if (storeId) {
      result = result.filter(p => p.storeId === storeId)
    }
    if (riskLevel) {
      result = result.filter(p => p.riskLevel === riskLevel)
    }
    if (minScore !== undefined) {
      result = result.filter(p => p.riskScore >= minScore)
    }

    return result.map(this.toDto)
  }

  /** 按 ID 获取预测 */
  async findById(memberId: string): Promise<MemberPredictDto | null> {
    const prediction = this.predictions.find(p => p.memberId === memberId)
    return prediction ? this.toDto(prediction) : null
  }

  /** 获取预测汇总统计 */
  async getSummary(): Promise<PredictSummaryDto> {
    const items = this.predictions

    const highRiskCount = items.filter(p => p.riskLevel === RiskLevel.HIGH).length
    const mediumRiskCount = items.filter(p => p.riskLevel === RiskLevel.MEDIUM).length
    const lowRiskCount = items.filter(p => p.riskLevel === RiskLevel.LOW).length

    const avgRiskScore = Math.round(items.reduce((s, p) => s + p.riskScore, 0) / items.length * 100) / 100

    // 模拟流失损失金额
    const predictedLossAmount = Math.round(
      items.reduce((s, p) => s + p.churnProbability * 5000, 0)
    )

    // 根据高风险占比推荐措施
    const highRatio = highRiskCount / items.length
    const recommendedActions: string[] = [
      '对高风险会员进行电话回访'
    ]

    if (highRatio > 0.3) {
      recommendedActions.push('启动流失预警应急预案，全员拉新补位')
    }
    if (mediumRiskCount > 0) {
      recommendedActions.push('中风险会员推送定向优惠券包')
    }
    recommendedActions.push('分析竞品动态，优化差异化权益')
    recommendedActions.push('高价值会员（SVIP+）一对一管家跟进')

    return {
      totalPredicted: items.length,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      avgRiskScore,
      predictedLossAmount,
      recommendedActions
    }
  }

  /** 按风险等级统计 */
  async getRiskDistribution(): Promise<{ riskLevel: string; count: number; avgScore: number }[]> {
    const levels = [RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW]
    return levels.map(level => {
      const items = this.predictions.filter(p => p.riskLevel === level)
      return {
        riskLevel: level,
        count: items.length,
        avgScore: items.length > 0
          ? Math.round(items.reduce((s, p) => s + p.riskScore, 0) / items.length * 100) / 100
          : 0
      }
    })
  }

  /** 流失风险评估 */
  async evaluateRisk(memberId: string, riskScore: number, churnProbability: number): Promise<{
    riskLevel: string
    suggestion: string
  }> {
    const riskLevel = riskScore >= 70 ? RiskLevel.HIGH : riskScore >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW

    const suggestions: Record<string, string> = {
      [RiskLevel.HIGH]: '立即干预：专属回访+补偿方案+竞品分析',
      [RiskLevel.MEDIUM]: '关注维护：定向推送+活动邀约+积分激励',
      [RiskLevel.LOW]: '常规维护：日常互动+权益提醒+满意度跟踪'
    }

    return {
      riskLevel,
      suggestion: suggestions[riskLevel]
    }
  }

  /** 创建预测记录 */
  async create(data: {
    memberId: string
    memberName: string
    memberLevel: string
    riskScore: number
    churnProbability: number
    mainReason: string
    suggestedAction: string
    lastActiveDate: string
    storeId: string
  }): Promise<MemberPredictDto> {
    const riskLevel = data.riskScore >= 70 ? RiskLevel.HIGH : data.riskScore >= 40 ? RiskLevel.MEDIUM : RiskLevel.LOW

    // 模拟预测流失日期（30天内）
    const churnDate = new Date()
    churnDate.setDate(churnDate.getDate() + Math.floor(30 * data.churnProbability))

    const prediction: MemberPrediction = {
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
      storeId: data.storeId
    }

    this.predictions.push(prediction)
    return this.toDto(prediction)
  }

  /** 转换为 DTO */
  private toDto(p: MemberPrediction): MemberPredictDto {
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
      lastActiveDate: p.lastActiveDate
    }
  }
}
