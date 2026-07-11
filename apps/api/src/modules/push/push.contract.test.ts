import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [push] [D] contract 补全
 *
 * push.contract.test.ts - Push 模块契约测试
 * 验证跨模块转换函数的正确性 + 边界情况。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  toPushRecordContract,
  toPushTemplateContract,
  toScheduledPushContract,
  toWSClientContract,
  toPushStatsContract,
  type PushRecordContract,
  type PushTemplateContract,
  type ScheduledPushContract,
  type WSClientContract,
  type PushStatsContract,
} from './push.contract'
import {
  PushPlatform,
  PushStatus,
  PushPriority,
  PushScheduleStatus,
} from './push.entity'
import type {
  PushRecord,
  PushTemplate,
  ScheduledPush,
  WSClient,
  PushStats,
} from './push.entity'

const BASE_TS = '2026-07-11T05:00:00.000Z'

describe('PushContract - toPushRecordContract', () => {
  it('正常转换推送记录所有字段', () => {
    const input: PushRecord = {
      id: 'push-rec-001',
      deviceToken: 'dev-token-abc123',
      platform: PushPlatform.iOS,
      payload: { alert: '欢迎回来!', badge: 1 },
      priority: PushPriority.High,
      status: PushStatus.Sent,
      sentAt: BASE_TS,
      tenantId: 'tenant-001',
      memberId: 'member-001',
    }

    const result = toPushRecordContract(input)

    assert.equal(result.id, 'push-rec-001')
    assert.equal(result.deviceToken, 'dev-token-abc123')
    assert.equal(result.platform, PushPlatform.iOS)
    assert.equal(result.status, PushStatus.Sent)
    assert.equal(result.sentAt, BASE_TS)
    assert.equal(result.priority, PushPriority.High)
  })

  it('转换失败状态的推送记录', () => {
    const input: PushRecord = {
      id: 'push-rec-002',
      deviceToken: 'dev-token-xyz',
      platform: PushPlatform.Android,
      payload: { alert: '失败通知' },
      priority: PushPriority.Normal,
      status: PushStatus.Failed,
      sentAt: BASE_TS,
    }

    const result = toPushRecordContract(input)

    assert.equal(result.id, 'push-rec-002')
    assert.equal(result.platform, PushPlatform.Android)
    assert.equal(result.status, PushStatus.Failed)
    assert.equal(result.priority, PushPriority.Normal)
  })

  it('转换吊销状态的推送记录', () => {
    const input: PushRecord = {
      id: 'push-rec-003',
      deviceToken: 'dev-token-revoked',
      platform: PushPlatform.Web,
      payload: { alert: '已吊销' },
      priority: PushPriority.Low,
      status: PushStatus.Revoked,
      sentAt: BASE_TS,
    }

    const result = toPushRecordContract(input)

    assert.equal(result.id, 'push-rec-003')
    assert.equal(result.platform, PushPlatform.Web)
    assert.equal(result.status, PushStatus.Revoked)
    assert.equal(result.priority, PushPriority.Low)
  })
})

describe('PushContract - toPushTemplateContract', () => {
  it('正常转换推送模板', () => {
    const input: PushTemplate = {
      id: 'pt_001',
      code: 'welcome_message',
      platform: PushPlatform.iOS,
      tenantId: 'tenant-001',
      brandId: 'brand-001',
      title: '欢迎',
      body: '感谢注册!',
      sound: 'default',
      badge: 1,
      enabled: true,
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
    }

    const result = toPushTemplateContract(input)

    assert.equal(result.id, 'pt_001')
    assert.equal(result.code, 'welcome_message')
    assert.equal(result.platform, PushPlatform.iOS)
    assert.equal(result.tenantId, 'tenant-001')
    assert.equal(result.title, '欢迎')
    assert.equal(result.body, '感谢注册!')
    assert.equal(result.enabled, true)
    assert.equal(result.createdAt, BASE_TS)
  })

  it('转换模板无标题时 title 为 undefined', () => {
    const input: PushTemplate = {
      id: 'pt_002',
      code: 'silent_push',
      platform: PushPlatform.Android,
      tenantId: 'tenant-002',
      body: '静默推送内容',
      enabled: true,
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
    }

    const result = toPushTemplateContract(input)

    assert.equal(result.id, 'pt_002')
    assert.equal(result.title, undefined)
    assert.equal(result.body, '静默推送内容')
  })

  it('转换禁用状态的模板', () => {
    const input: PushTemplate = {
      id: 'pt_003',
      code: 'disabled_promo',
      platform: PushPlatform.Web,
      tenantId: 'tenant-003',
      body: '已停用促销',
      enabled: false,
      createdAt: BASE_TS,
      updatedAt: BASE_TS,
    }

    const result = toPushTemplateContract(input)

    assert.equal(result.enabled, false)
    assert.equal(result.platform, PushPlatform.Web)
  })
})

describe('PushContract - toScheduledPushContract', () => {
  it('正常转换待发送的定时推送', () => {
    const input: ScheduledPush = {
      id: 'sched-001',
      memberId: 'member-001',
      tenantId: 'tenant-001',
      content: '今晚8点有活动!',
      platform: PushPlatform.iOS,
      sendAt: new Date('2026-07-11T12:00:00.000Z'),
      status: PushScheduleStatus.Pending,
      createdAt: BASE_TS,
    }

    const result = toScheduledPushContract(input)

    assert.equal(result.id, 'sched-001')
    assert.equal(result.memberId, 'member-001')
    assert.equal(result.content, '今晚8点有活动!')
    assert.equal(result.sendAt, '2026-07-11T12:00:00.000Z')
    assert.equal(result.status, PushScheduleStatus.Pending)
  })

  it('转换已发送的定时推送', () => {
    const input: ScheduledPush = {
      id: 'sched-002',
      memberId: 'member-002',
      tenantId: 'tenant-001',
      content: '已发送通知',
      platform: PushPlatform.Android,
      sendAt: new Date('2026-07-10T08:00:00.000Z'),
      status: PushScheduleStatus.Sent,
      createdAt: BASE_TS,
    }

    const result = toScheduledPushContract(input)

    assert.equal(result.status, PushScheduleStatus.Sent)
    assert.equal(result.content, '已发送通知')
  })

  it('转换已取消的定时推送', () => {
    const input: ScheduledPush = {
      id: 'sched-003',
      memberId: 'member-003',
      tenantId: 'tenant-001',
      content: '已取消通知',
      platform: PushPlatform.Web,
      sendAt: new Date('2026-07-12T00:00:00.000Z'),
      status: PushScheduleStatus.Cancelled,
      createdAt: BASE_TS,
    }

    const result = toScheduledPushContract(input)

    assert.equal(result.status, PushScheduleStatus.Cancelled)
  })
})

describe('PushContract - toWSClientContract', () => {
  it('正常转换 WebSocket 客户端', () => {
    const input: WSClient = {
      clientId: 'ws-client-001',
      userId: 'user-001',
      tenantId: 'tenant-001',
      connectedAt: BASE_TS,
      sessionId: 'session-001',
      platform: PushPlatform.iOS,
    }

    const result = toWSClientContract(input)

    assert.equal(result.clientId, 'ws-client-001')
    assert.equal(result.userId, 'user-001')
    assert.equal(result.connectedAt, BASE_TS)
    assert.equal(result.sessionId, 'session-001')
  })

  it('转换无 sessionId 的客户端', () => {
    const input: WSClient = {
      clientId: 'ws-client-002',
      userId: 'user-002',
      connectedAt: BASE_TS,
    }

    const result = toWSClientContract(input)

    assert.equal(result.clientId, 'ws-client-002')
    assert.equal(result.sessionId, undefined)
  })
})

describe('PushContract - toPushStatsContract', () => {
  it('正常转换推送统计', () => {
    const input: PushStats = {
      totalSent: 150,
      totalFailed: 3,
      activeConnections: 25,
      scheduledCount: 10,
      byPlatform: {
        [PushPlatform.iOS]: 100,
        [PushPlatform.Android]: 40,
        [PushPlatform.Web]: 10,
      },
    }

    const result = toPushStatsContract(input)

    assert.equal(result.totalSent, 150)
    assert.equal(result.totalFailed, 3)
    assert.equal(result.activeConnections, 25)
    assert.equal(result.scheduledCount, 10)
  })

  it('转换无推送/无连接的统计（零值）', () => {
    const input: PushStats = {
      totalSent: 0,
      totalFailed: 0,
      activeConnections: 0,
      scheduledCount: 0,
      byPlatform: {
        [PushPlatform.iOS]: 0,
        [PushPlatform.Android]: 0,
        [PushPlatform.Web]: 0,
      },
    }

    const result = toPushStatsContract(input)

    assert.equal(result.totalSent, 0)
    assert.equal(result.totalFailed, 0)
    assert.equal(result.activeConnections, 0)
    assert.equal(result.scheduledCount, 0)
  })
})
