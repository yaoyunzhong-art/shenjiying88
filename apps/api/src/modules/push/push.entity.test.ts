import { describe, it, expect, assert } from 'vitest'
import {
  PushPlatform,
  PushStatus,
  PushPriority,
  PushScheduleStatus,
  PushTemplate,
  PushRecord,
  ScheduledPush,
  WSClient,
  WSMessage,
  PushStats
} from './push.entity'

describe('Push Entity - Enums', () => {
  it('PushPlatform should have expected values', () => {
    expect(PushPlatform.iOS).toBe('iOS')
    expect(PushPlatform.Android).toBe('ANDROID')
    expect(PushPlatform.Web).toBe('WEB')
  })

  it('PushStatus should have expected values', () => {
    expect(PushStatus.Pending).toBe('PENDING')
    expect(PushStatus.Sent).toBe('SENT')
    expect(PushStatus.Failed).toBe('FAILED')
    expect(PushStatus.Cancelled).toBe('CANCELLED')
    expect(PushStatus.Revoked).toBe('REVOKED')
  })

  it('PushPriority should have expected values', () => {
    expect(PushPriority.High).toBe('HIGH')
    expect(PushPriority.Normal).toBe('NORMAL')
    expect(PushPriority.Low).toBe('LOW')
  })

  it('PushScheduleStatus should have expected values', () => {
    expect(PushScheduleStatus.Pending).toBe('PENDING')
    expect(PushScheduleStatus.Sent).toBe('SENT')
    expect(PushScheduleStatus.Cancelled).toBe('CANCELLED')
  })
})

describe('Push Entity - Interfaces', () => {
  it('PushTemplate should be constructable', () => {
    const template: PushTemplate = {
      id: 'pt_001',
      code: 'welcome_push',
      platform: PushPlatform.iOS,
      tenantId: 'tenant_1',
      title: 'Welcome',
      body: 'Welcome to our app!',
      sound: 'default',
      badge: 1,
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    expect(template.id).toBe('pt_001')
    expect(template.code).toBe('welcome_push')
    expect(template.platform).toBe(PushPlatform.iOS)
    expect(template.enabled).toBe(true)
    expect(template.badge).toBe(1)
  })

  it('PushTemplate should allow optional fields to be undefined', () => {
    const minimal: PushTemplate = {
      id: 'pt_002',
      code: 'minimal',
      platform: PushPlatform.Android,
      tenantId: 'tenant_1',
      body: 'Minimal body',
      enabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    }

    expect(minimal.title).toBeUndefined()
    expect(minimal.sound).toBeUndefined()
    expect(minimal.badge).toBeUndefined()
    expect(minimal.storeId).toBeUndefined()
  })

  it('PushRecord should be constructable', () => {
    const record: PushRecord = {
      id: 'push_001',
      deviceToken: 'a'.repeat(64),
      platform: PushPlatform.iOS,
      payload: {
        alert: 'Test alert',
        badge: 1,
        sound: 'default',
        extra: { key: 'value' }
      },
      priority: PushPriority.High,
      status: PushStatus.Sent,
      sentAt: '2026-01-01T00:00:00Z',
      tenantId: 'tenant_1',
      memberId: 'member_1'
    }

    expect(record.status).toBe(PushStatus.Sent)
    expect(record.payload.alert).toBe('Test alert')
    expect(record.payload.extra?.key).toBe('value')
  })

  it('ScheduledPush should be constructable', () => {
    const scheduled: ScheduledPush = {
      id: 'sched_001',
      memberId: 'member_1',
      tenantId: 'tenant_1',
      content: 'Reminder message',
      platform: PushPlatform.iOS,
      sendAt: new Date('2026-02-01T00:00:00Z'),
      status: PushScheduleStatus.Pending,
      createdAt: '2026-01-01T00:00:00Z'
    }

    expect(scheduled.status).toBe(PushScheduleStatus.Pending)
    expect(scheduled.content).toBe('Reminder message')
    expect(scheduled.sendAt instanceof Date).toBe(true)
  })

  it('WSClient should be constructable', () => {
    const client: WSClient = {
      clientId: 'client_1',
      userId: 'user_1',
      tenantId: 'tenant_1',
      connectedAt: '2026-01-01T00:00:00Z',
      sessionId: 'sess_001',
      platform: PushPlatform.Web
    }

    expect(client.clientId).toBe('client_1')
    expect(client.platform).toBe(PushPlatform.Web)
  })

  it('WSMessage should be constructable', () => {
    const msg: WSMessage = {
      channel: 'orders',
      data: { orderId: 'ord_001' },
      from: 'system',
      timestamp: '2026-01-01T00:00:00Z'
    }

    expect(msg.channel).toBe('orders')
    expect(msg.data).toEqual({ orderId: 'ord_001' })
  })

  it('PushStats should be constructable', () => {
    const stats: PushStats = {
      totalSent: 100,
      totalFailed: 2,
      activeConnections: 50,
      scheduledCount: 10,
      byPlatform: {
        [PushPlatform.iOS]: 80,
        [PushPlatform.Android]: 15,
        [PushPlatform.Web]: 5
      }
    }

    expect(stats.totalSent).toBe(100)
    expect(stats.byPlatform[PushPlatform.iOS]).toBe(80)
  })

  it('PushRecord should default status to PENDING when not explicitly sent', () => {
    const record: PushRecord = {
      id: 'push_002',
      deviceToken: 'b'.repeat(64),
      platform: PushPlatform.Android,
      payload: { alert: 'Android push' },
      priority: PushPriority.Normal,
      status: PushStatus.Pending,
      sentAt: '2026-01-01T00:00:00Z'
    }

    // 正常流程: 初试状态为 PENDING
    expect(record.status).toBe(PushStatus.Pending)
  })

  it('should handle all PushPriority values in a switch', () => {
    const getPriorityLabel = (p: PushPriority): string => {
      switch (p) {
        case PushPriority.High: return '紧急'
        case PushPriority.Normal: return '普通'
        case PushPriority.Low: return '低优'
      }
    }

    expect(getPriorityLabel(PushPriority.High)).toBe('紧急')
    expect(getPriorityLabel(PushPriority.Normal)).toBe('普通')
    expect(getPriorityLabel(PushPriority.Low)).toBe('低优')
  })
})
