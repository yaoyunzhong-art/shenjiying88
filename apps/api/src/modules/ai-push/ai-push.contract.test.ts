import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [ai-push] [A] contract 测试
 *
 * ai-push contract 测试：
 * - 合约类型完整性验证
 * - 转换函数正例测试
 * - 转换函数边界测试
 */

import {
  toPushTaskContract,
  toPushRecordContract,
  toPushStatsContract,
  toExperimentResultContract,
  toSegmentProfileContract,
  toOptimalTimeWindowContract,
} from './ai-push.contract'

import type {
  PushTask,
  PushRecord,
  PushStats,
  ExperimentResult,
  SegmentProfile,
  OptimalTimeWindow,
} from './ai-push.entity'

// ── 测试工厂 ──

const sampleTask: PushTask = {
  id: 'task-abc123',
  title: '限时优惠通知',
  content: '今日充值享双倍积分！',
  channel: 'push',
  targetMemberIds: ['m-001', 'm-002', 'm-003'],
  scheduledAt: 1750000000000,
  sentAt: 1750000001000,
  status: 'sent',
  retryCount: 0,
  maxRetries: 3,
  createdAt: 1749999000000,
  updatedAt: 1750000001000,
  metadata: { source: 'campaign-spring' },
}

const sampleRecord: PushRecord = {
  id: 'rec-def456',
  taskId: 'task-abc123',
  memberId: 'm-001',
  channel: 'push',
  status: 'clicked',
  sentAt: 1750000001000,
  deliveredAt: 1750000002000,
  clickedAt: 1750000030000,
  createdAt: 1750000001000,
}

const sampleStats: PushStats = {
  totalTasks: 10,
  totalRecords: 100,
  sentCount: 100,
  deliveredCount: 85,
  clickedCount: 30,
  failedCount: 5,
  deliveryRate: 0.85,
  clickRate: 0.3,
}

const sampleExperimentResult: ExperimentResult = {
  experimentId: 'exp-001',
  experimentName: '春季推送文案对比',
  variants: [
    { name: 'A-控制组', sampleCount: 500, conversionCount: 25, conversionRate: 0.05, avgValue: 50 },
    { name: 'B-实验组', sampleCount: 500, conversionCount: 40, conversionRate: 0.08, avgValue: 72 },
  ],
  winner: 'B-实验组',
  confidence: 0.92,
  liftMap: { 'A-控制组': 0, 'B-实验组': 60 },
  totalSamples: 1000,
  isSignificant: true,
}

const sampleProfile: SegmentProfile = {
  segmentId: 'behavior-active',
  segmentType: 'behavior',
  description: '高频活跃会员',
  tags: ['复购', '会员权益'],
  avgMetrics: { purchaseCount: 8, totalSpent: 5000, activeDaysAgo: 3 },
}

const sampleOptimalWindow: OptimalTimeWindow = {
  startHour: 19,
  endHour: 21,
  score: 0.9,
  channel: 'push',
}

// ══════════════════════════════════════════════════════════════
// 合约类型结构验证
// ══════════════════════════════════════════════════════════════

describe('PushTaskContract 转换', () => {
  it('toPushTaskContract — 正常转换 PushTask 为合约', () => {
    const contract = toPushTaskContract(sampleTask)

    expect(contract.id).toBe('task-abc123')
    expect(contract.title).toBe('限时优惠通知')
    expect(contract.channel).toBe('push')
    expect(contract.status).toBe('sent')
    expect(contract.targetMemberCount).toBe(3)
    expect(contract.scheduledAt).toBe(1750000000000)
    expect(contract.sentAt).toBe(1750000001000)
    expect(contract.createdAt).toBe(1749999000000)
    expect(contract.metadata).toEqual({ source: 'campaign-spring' })
  })

  it('toPushTaskContract — 合约不暴露内部字段 retryCount / maxRetries / updatedAt', () => {
    const contract = toPushTaskContract(sampleTask)

    expect((contract as any).retryCount).toBeUndefined()
    expect((contract as any).maxRetries).toBeUndefined()
    expect((contract as any).targetMemberIds).toBeUndefined()
  })

  it('toPushTaskContract — status 为 pending 时 sentAt 为 undefined', () => {
    const pendingTask: PushTask = {
      ...sampleTask,
      status: 'pending',
      sentAt: undefined,
      updatedAt: 1749999000000,
    }
    const contract = toPushTaskContract(pendingTask)

    expect(contract.status).toBe('pending')
    expect(contract.sentAt).toBeUndefined()
  })

  it('toPushTaskContract — 空 targetMemberIds 时 count 为 0', () => {
    const emptyTask: PushTask = {
      ...sampleTask,
      targetMemberIds: [],
      status: 'pending',
      sentAt: undefined,
      updatedAt: 1749999000000,
    }
    const contract = toPushTaskContract(emptyTask)

    expect(contract.targetMemberCount).toBe(0)
  })

  it('toPushTaskContract — metadata 为 undefined 时合约中为 undefined', () => {
    const noMetaTask: PushTask = {
      ...sampleTask,
      metadata: undefined,
      status: 'pending',
      sentAt: undefined,
      updatedAt: 1749999000000,
    }
    const contract = toPushTaskContract(noMetaTask)

    expect(contract.metadata).toBeUndefined()
  })
})

describe('PushRecordContract 转换', () => {
  it('toPushRecordContract — 正常转换 PushRecord 为合约', () => {
    const contract = toPushRecordContract(sampleRecord)

    expect(contract.id).toBe('rec-def456')
    expect(contract.taskId).toBe('task-abc123')
    expect(contract.memberId).toBe('m-001')
    expect(contract.channel).toBe('push')
    expect(contract.status).toBe('clicked')
    expect(contract.sentAt).toBe(1750000001000)
    expect(contract.deliveredAt).toBe(1750000002000)
    expect(contract.clickedAt).toBe(1750000030000)
    expect(contract.createdAt).toBe(1750000001000)
  })

  it('toPushRecordContract — 合约不暴露内部 error 字段', () => {
    const recordWithError: PushRecord = {
      ...sampleRecord,
      status: 'failed',
      error: '推送渠道返回错误: 设备离线',
    }

    const contract = toPushRecordContract(recordWithError)

    expect((contract as any).error).toBeUndefined()
  })

  it('toPushRecordContract — failed 记录不包含送达/点击时间', () => {
    const failedRecord: PushRecord = {
      ...sampleRecord,
      status: 'failed',
      sentAt: 1750000001000,
      deliveredAt: undefined,
      clickedAt: undefined,
      error: '设备离线',
    }
    const contract = toPushRecordContract(failedRecord)

    expect(contract.status).toBe('failed')
    expect(contract.deliveredAt).toBeUndefined()
    expect(contract.clickedAt).toBeUndefined()
  })
})

describe('PushStatsContract 转换', () => {
  it('toPushStatsContract — 正常转换 PushStats 为合约', () => {
    const contract = toPushStatsContract(sampleStats)

    expect(contract.totalTasks).toBe(10)
    expect(contract.totalRecords).toBe(100)
    expect(contract.sentCount).toBe(100)
    expect(contract.deliveredCount).toBe(85)
    expect(contract.clickedCount).toBe(30)
    expect(contract.failedCount).toBe(5)
    expect(contract.deliveryRate).toBe(0.85)
    expect(contract.clickRate).toBe(0.3)
  })

  it('toPushStatsContract — 全零统计值处理', () => {
    const emptyStats: PushStats = {
      totalTasks: 0,
      totalRecords: 0,
      sentCount: 0,
      deliveredCount: 0,
      clickedCount: 0,
      failedCount: 0,
      deliveryRate: 0,
      clickRate: 0,
    }
    const contract = toPushStatsContract(emptyStats)

    expect(contract.totalTasks).toBe(0)
    expect(contract.deliveryRate).toBe(0)
    expect(contract.clickRate).toBe(0)
  })
})

describe('ExperimentResultContract 转换', () => {
  it('toExperimentResultContract — 正常转换 ExperimentResult 为合约', () => {
    const contract = toExperimentResultContract(sampleExperimentResult)

    expect(contract.experimentId).toBe('exp-001')
    expect(contract.experimentName).toBe('春季推送文案对比')
    expect(contract.winner).toBe('B-实验组')
    expect(contract.confidence).toBe(0.92)
    expect(contract.liftMap).toEqual({ 'A-控制组': 0, 'B-实验组': 60 })
    expect(contract.totalSamples).toBe(1000)
    expect(contract.isSignificant).toBe(true)
    expect(contract.variantResults).toHaveLength(2)
    expect(contract.variantResults[1].conversionRate).toBe(0.08)
  })

  it('toExperimentResultContract — 多变体实验结果', () => {
    const multiVariantResult: ExperimentResult = {
      ...sampleExperimentResult,
      variants: [
        { name: 'A', sampleCount: 300, conversionCount: 15, conversionRate: 0.05, avgValue: 50 },
        { name: 'B', sampleCount: 300, conversionCount: 24, conversionRate: 0.08, avgValue: 65 },
        { name: 'C', sampleCount: 300, conversionCount: 18, conversionRate: 0.06, avgValue: 55 },
      ],
      winner: 'B',
      liftMap: { A: 0, B: 60, C: 20 },
      totalSamples: 900,
    }
    const contract = toExperimentResultContract(multiVariantResult)

    expect(contract.variantResults).toHaveLength(3)
    expect(contract.winner).toBe('B')
    expect(contract.liftMap.C).toBe(20)
  })

  it('toExperimentResultContract — 无显著结果', () => {
    const insignificantResult: ExperimentResult = {
      ...sampleExperimentResult,
      winner: undefined,
      confidence: 0.45,
      variants: [
        { name: 'A', sampleCount: 50, conversionCount: 3, conversionRate: 0.06, avgValue: 60 },
        { name: 'B', sampleCount: 50, conversionCount: 3, conversionRate: 0.06, avgValue: 58 },
      ],
      liftMap: { A: 0, B: 0 },
      totalSamples: 100,
      isSignificant: false,
    }
    const contract = toExperimentResultContract(insignificantResult)

    expect(contract.winner).toBeUndefined()
    expect(contract.isSignificant).toBe(false)
    expect(contract.confidence).toBe(0.45)
  })
})

describe('SegmentProfileContract 转换', () => {
  it('toSegmentProfileContract — 正常转换 SegmentProfile 为合约', () => {
    const contract = toSegmentProfileContract(sampleProfile)

    expect(contract.segmentId).toBe('behavior-active')
    expect(contract.segmentType).toBe('behavior')
    expect(contract.description).toBe('高频活跃会员')
    expect(contract.tags).toEqual(['复购', '会员权益'])
    expect(contract.memberCount).toBe(0)
    expect(contract.avgPurchaseCount).toBe(8)
    expect(contract.avgTotalSpent).toBe(5000)
    expect(contract.avgActiveDaysAgo).toBe(3)
  })

  it('toSegmentProfileContract — 沉睡会员画像转换', () => {
    const sleepingProfile: SegmentProfile = {
      segmentId: 'behavior-sleeping',
      segmentType: 'behavior',
      description: '沉睡会员',
      tags: ['唤醒', '限时优惠'],
      avgMetrics: { purchaseCount: 2, totalSpent: 800, activeDaysAgo: 60 },
    }
    const contract = toSegmentProfileContract(sleepingProfile)

    expect(contract.segmentId).toBe('behavior-sleeping')
    expect(contract.avgActiveDaysAgo).toBe(60)
    expect(contract.avgPurchaseCount).toBe(2)
  })

  it('toSegmentProfileContract — 空 tags 处理', () => {
    const noTagsProfile: SegmentProfile = {
      ...sampleProfile,
      tags: [],
    }
    const contract = toSegmentProfileContract(noTagsProfile)

    expect(contract.tags).toEqual([])
  })
})

describe('OptimalTimeWindowContract 转换', () => {
  it('toOptimalTimeWindowContract — 正常转换', () => {
    const contract = toOptimalTimeWindowContract(sampleOptimalWindow)

    expect(contract.startHour).toBe(19)
    expect(contract.endHour).toBe(21)
    expect(contract.score).toBe(0.9)
    expect(contract.channel).toBe('push')
  })

  it('toOptimalTimeWindowContract — 低分窗口转换', () => {
    const lowScoreWindow: OptimalTimeWindow = {
      startHour: 3,
      endHour: 5,
      score: 0.1,
      channel: 'sms',
    }
    const contract = toOptimalTimeWindowContract(lowScoreWindow)

    expect(contract.score).toBe(0.1)
    expect(contract.channel).toBe('sms')
  })

  it('toOptimalTimeWindowContract — 跨天窗口（23->1）转换', () => {
    const crossDayWindow: OptimalTimeWindow = {
      startHour: 23,
      endHour: 1,
      score: 0.2,
      channel: 'push',
    }
    const contract = toOptimalTimeWindowContract(crossDayWindow)

    expect(contract.startHour).toBe(23)
    expect(contract.endHour).toBe(1)
  })
})
