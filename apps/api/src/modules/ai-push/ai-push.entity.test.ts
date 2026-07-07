import { describe, it, expect } from 'vitest'
import type {
  PushTask,
  PushRecord,
  PushStats,
  PushChannel,
  PushStatus,
  MemberBehavior,
  SegmentProfile,
  OptimalTimeWindow,
  ExperimentConfig,
  ExperimentResult,
} from './ai-push.entity'

describe('ai-push.entity', () => {
  it('PushTask 应该包含所有必需字段', () => {
    const task: PushTask = {
      id: 'task-001',
      title: '限时优惠通知',
      content: '亲爱的会员，今日限时优惠已开启',
      channel: 'push',
      targetMemberIds: ['m1', 'm2'],
      scheduledAt: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    expect(task.id).toBe('task-001')
    expect(task.channel).toBe('push')
    expect(task.targetMemberIds).toHaveLength(2)
  })

  it('PushRecord 应该追踪完整状态流转', () => {
    const sentRecord: PushRecord = {
      id: 'rec-001',
      taskId: 'task-001',
      memberId: 'm1',
      channel: 'push',
      status: 'sent',
      sentAt: Date.now(),
      createdAt: Date.now(),
    }
    expect(sentRecord.status).toBe('sent')

    const clickedRecord: PushRecord = {
      ...sentRecord,
      status: 'clicked',
      deliveredAt: Date.now(),
      clickedAt: Date.now(),
    }
    expect(clickedRecord.status).toBe('clicked')
    expect(clickedRecord.clickedAt).toBeDefined()
  })

  it('PushStats 应该正确计算比率', () => {
    const stats: PushStats = {
      totalTasks: 10,
      totalRecords: 100,
      sentCount: 100,
      deliveredCount: 80,
      clickedCount: 30,
      failedCount: 5,
      deliveryRate: 0.8,
      clickRate: 0.3,
    }

    expect(stats.deliveryRate).toBe(0.8)
    expect(stats.clickRate).toBe(0.3)
    expect(stats.totalTasks).toBe(10)
  })

  it('MemberBehavior 应该包含行为追踪字段', () => {
    const behavior: MemberBehavior = {
      memberId: 'm1',
      lastActiveAt: Date.now() - 86400000,
      purchaseCount: 5,
      totalSpent: 3000,
      avgOrderValue: 600,
      sessionCount: 20,
      lastPurchaseAt: Date.now() - 86400000 * 3,
      churnDays: 3,
    }

    expect(behavior.purchaseCount).toBe(5)
    expect(behavior.totalSpent).toBe(3000)
  })

  it('SegmentProfile 应该包含分群标签', () => {
    const profile: SegmentProfile = {
      segmentId: 'behavior-active',
      segmentType: 'behavior',
      description: '高频活跃会员',
      tags: ['复购', '高粘性', 'VIP'],
      avgMetrics: { purchaseCount: 8, totalSpent: 5000, activeDaysAgo: 3 },
    }

    expect(profile.tags).toContain('复购')
    expect(profile.avgMetrics.purchaseCount).toBe(8)
  })

  it('ExperimentResult 应该包含实验结果字段', () => {
    const result: ExperimentResult = {
      experimentId: 'exp-001',
      experimentName: '优惠券样式测试',
      variants: [
        { name: '对照组', sampleCount: 100, conversionCount: 10, conversionRate: 0.1, avgValue: 50 },
        { name: '实验组', sampleCount: 100, conversionCount: 15, conversionRate: 0.15, avgValue: 80 },
      ],
      winner: '实验组',
      confidence: 0.95,
      liftMap: { '实验组': 50 },
      totalSamples: 200,
      isSignificant: true,
    }

    expect(result.winner).toBe('实验组')
    expect(result.liftMap['实验组']).toBe(50)
    expect(result.isSignificant).toBe(true)
  })
})
